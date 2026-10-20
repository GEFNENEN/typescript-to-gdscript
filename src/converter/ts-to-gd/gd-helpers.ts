import ts from 'typescript';
import type { TransformerDelegate } from './transformer-types.ts';
import { emitOperand } from './gd-cast.ts';
import { sanitizeFunctionName } from '../../typings/class-generator.ts';

/**
 * Handle a global whose GDScript name TypeScript cannot spell:
 * `gd.typeof(value)` -> `typeof(value)`.
 *
 * Keyed on the same predicate the typings generator uses to decide a
 * global gets no declaration of its own (`sanitizeFunctionName` changes
 * it), so the two cannot drift: every global `gd` has to carry is one
 * this rewrites back, under any Godot version. `typeof` is the only
 * one today. Returns null if this is not such a call.
 */
export function tryEmitGdUnspellableGlobal(
  t: TransformerDelegate,
  node: ts.CallExpression,
  obj: ts.Expression,
  method: string,
): string | null {
  if (!ts.isIdentifier(obj) || obj.text !== 'gd') return null;
  if (
    !t.ctx.registry?.isGlobalFunction(method) ||
    sanitizeFunctionName(method) === method
  ) {
    return null;
  }
  const args = node.arguments.map((a) => t.emitExpression(a)).join(', ');
  return `${method}(${args})`;
}

// ---- gd.dict() ----

/**
 * Handle `gd.dict([[key, value], ...])` -> `{key: value, ...}`.
 * Returns null if this is not a gd.dict call.
 */
export function tryEmitGdDict(
  t: TransformerDelegate,
  node: ts.CallExpression,
  obj: ts.Expression,
  method: string,
): string | null {
  if (!ts.isIdentifier(obj) || obj.text !== 'gd' || method !== 'dict')
    return null;
  return emitGdDict(t, node);
}

function emitGdDict(t: TransformerDelegate, node: ts.CallExpression): string {
  if (node.arguments.length !== 1) {
    t.addDiagnostic(
      node,
      'error',
      'gd.dict() requires exactly one argument (array of [key, value] pairs)',
    );
    return '{}';
  }

  const arg = node.arguments[0]!;
  if (!ts.isArrayLiteralExpression(arg)) {
    t.addDiagnostic(
      node,
      'error',
      'gd.dict() argument must be an array literal of [key, value] pairs',
    );
    return '{}';
  }

  const entries: string[] = [];
  for (const element of arg.elements) {
    if (
      !ts.isArrayLiteralExpression(element) ||
      element.elements.length !== 2
    ) {
      t.addDiagnostic(
        element,
        'error',
        'gd.dict() entries must be [key, value] tuples',
      );
      continue;
    }

    const keyNode = element.elements[0]!;
    const valueNode = element.elements[1]!;

    let key: string;
    if (ts.isStringLiteral(keyNode)) {
      key = t.emitStringLiteral(keyNode);
    } else if (ts.isNumericLiteral(keyNode)) {
      key = keyNode.getText(t.ctx.sourceFile);
    } else if (ts.isIdentifier(keyNode)) {
      key = keyNode.text;
    } else if (ts.isPropertyAccessExpression(keyNode)) {
      key = t.emitExpression(keyNode);
    } else {
      t.addDiagnostic(
        keyNode,
        'error',
        'gd.dict() keys must be identifiers, property accesses, or string/number literals, not expressions',
      );
      key = keyNode.getText(t.ctx.sourceFile);
    }

    const value = t.emitExpression(valueNode);
    entries.push(`${key}: ${value}`);
  }

  if (entries.length === 0) {
    return '{}';
  }

  return t.emitMultiLineDict(entries);
}

// ---- gd.ops.* ----

/**
 * Handle `gd.ops.add(a, b)` etc. -> `(a + b)`.
 * Returns null if this is not a gd.ops.* call.
 */
export function tryEmitGdOps(
  t: TransformerDelegate,
  node: ts.CallExpression,
  outerObj: ts.Expression,
  method: string,
): string | null {
  if (!ts.isPropertyAccessExpression(outerObj)) return null;
  const gdObj = outerObj.expression;
  const opsNs = outerObj.name.text;
  if (!ts.isIdentifier(gdObj) || gdObj.text !== 'gd' || opsNs !== 'ops')
    return null;
  return emitOpsHelper(t, method, node.arguments);
}

function emitOpsHelper(
  t: TransformerDelegate,
  method: string,
  args: ts.NodeArray<ts.Expression>,
): string {
  const operands = args.map((a) => emitOperand(t, a));

  // Unary operators (1 arg), grouped like the binary ones below: a bare
  // `-v` in receiver position reads `-(v.length())`, and as the value of
  // an `is` reads `-(v is T)`.
  if (method === 'plus' && operands.length === 1) return `(+${operands[0]})`;
  if (method === 'minus' && operands.length === 1) return `(-${operands[0]})`;

  // Binary operators (2 args)
  const binaryOpMap: Record<string, string> = {
    add: ' + ',
    sub: ' - ',
    mul: ' * ',
    div: ' / ',
    rem: ' % ',
    eq: ' == ',
    ne: ' != ',
    gt: ' > ',
    gte: ' >= ',
    lt: ' < ',
    lte: ' <= ',
  };
  const op = binaryOpMap[method];
  if (op && operands.length === 2) {
    return `(${operands[0]}${op}${operands[1]})`;
  }
  return `${operands.join(', ')}`;
}

// ---- gd.eval() ----

export function isGdEvalCall(node: ts.Expression): boolean {
  if (!ts.isCallExpression(node)) return false;
  if (!ts.isPropertyAccessExpression(node.expression)) return false;
  const obj = node.expression.expression;
  return (
    ts.isIdentifier(obj) &&
    obj.text === 'gd' &&
    node.expression.name.text === 'eval'
  );
}

/**
 * Process a gd.eval() call and return the GDScript lines (with relative indentation).
 * Each line is prefixed with tabs for its depth relative to the first non-empty line.
 * Returns null if the content cannot be extracted or is empty.
 */
export function processGdEval(
  t: TransformerDelegate,
  node: ts.CallExpression,
): string[] | null {
  if (node.arguments.length < 1) return null;
  const arg = node.arguments[0]!;

  // Extract the string content
  let content: string;
  if (ts.isStringLiteral(arg)) {
    content = arg.text;
  } else if (ts.isNoSubstitutionTemplateLiteral(arg)) {
    content = arg.text;
  } else if (ts.isTemplateExpression(arg)) {
    t.addDiagnostic(
      node,
      'warning',
      'gd.eval with template expressions is not supported',
    );
    return null;
  } else {
    t.addDiagnostic(
      node,
      'warning',
      'gd.eval argument must be a string literal',
    );
    return null;
  }

  // Strip leading newline if present
  const body = content.startsWith('\n') ? content.slice(1) : content;
  const rawLines = body.split('\n');

  // Strip trailing empty lines
  while (rawLines.length > 0 && rawLines[rawLines.length - 1]!.trim() === '') {
    rawLines.pop();
  }
  const nonEmpty = rawLines.filter((l) => l.trim() !== '');
  if (nonEmpty.length === 0) return null;

  // Single non-empty line: return trimmed
  if (nonEmpty.length === 1) {
    return [nonEmpty[0]!.trim()];
  }

  // Detect indentation style: tabs vs spaces
  const hasTabs = nonEmpty.some((l) => l.startsWith('\t'));
  const hasSpaces = nonEmpty.some((l) => /^ /.test(l));

  if (hasTabs && hasSpaces) {
    t.addDiagnostic(
      node,
      'error',
      'gd.eval: mixed tabs and spaces indentation is not supported',
    );
    return null;
  }

  const out: string[] = [];
  if (hasTabs) {
    // Tab indentation: strip the common tab prefix, then re-indent with spaces
    const minTabs = nonEmpty.reduce((min, l) => {
      const leading = l.match(/^(\t*)/)?.[1]?.length ?? 0;
      return Math.min(min, leading);
    }, Infinity);
    for (const line of rawLines) {
      if (line.trim() === '') continue;
      // Only the leading run is indentation: a tab inside a string literal
      // is part of the value.
      const rest = line.slice(minTabs);
      out.push(
        rest.replace(/^\t+/, (m) => t.emitter.indentUnit.repeat(m.length)),
      );
    }
  } else {
    // Space indentation: convert indent levels to four-space levels
    const spaceToDepth = new Map<number, number>();
    let prevSpaces = nonEmpty[0]!.match(/^( *)/)?.[1]?.length ?? 0;
    let depth = 0;
    spaceToDepth.set(prevSpaces, 0);

    for (const line of rawLines) {
      if (line.trim() === '') continue;
      const spaces = line.match(/^( *)/)?.[1]?.length ?? 0;
      const lineContent = line.trimStart();

      if (spaces > prevSpaces) {
        depth++;
      } else if (spaces < prevSpaces) {
        const mapped = spaceToDepth.get(spaces);
        if (mapped !== undefined) {
          depth = mapped;
        } else {
          depth = Math.max(0, depth - 1);
        }
      }

      spaceToDepth.set(spaces, depth);
      prevSpaces = spaces;
      out.push(t.emitter.indentUnit.repeat(depth) + lineContent);
    }
  }
  return out;
}

/**
 * Emit gd.eval('gdscript code') as a standalone statement (raw GDScript lines).
 */
export function emitGdEval(
  t: TransformerDelegate,
  node: ts.CallExpression,
  pos: { line: number; col: number },
): void {
  const lines = processGdEval(t, node);
  if (!lines) return;
  for (const line of lines) {
    t.emitter.writeLine(line, pos.line, pos.col);
  }
}
