import { SyntaxType, type SyntaxNode } from '../../parser/gdscript/types.ts';
import { type GdToTsContext, isGlobalName } from './context.ts';
import { selfClassNameIfMatches, qualifyClassType } from './type-inference.ts';
import { emitLambda } from './functions.ts';
import { escapeTsBindingName } from './identifiers.ts';
import { sanitizeFunctionName } from '../../typings/class-generator.ts';
import { firstSyntaxChild, syntaxChildren } from './syntax-children.ts';
import {
  tryEmitUniqueNodePath,
  emitBinaryOp,
  emitUnaryOp,
} from './operators.ts';

// ─── Expressions ──────────────────────────────────────────────

export function emitExpr(node: SyntaxNode, ctx: GdToTsContext): string {
  if (node.type === SyntaxType.Identifier) {
    if (node.text === 'self') return 'this';
    if (node.text === 'null') return 'null';
    if (node.text === 'true') return 'true';
    if (node.text === 'false') return 'false';
    // If identifier is a known class member AND not a local variable,
    // prefix with `this.` (instance) or `ClassName.` (static — const /
    // static var / enum / inner class / static func). Matches GDScript's
    // convention of accessing statics via the class name.
    if (ctx.classMembers.has(node.text) && !ctx.localVars.has(node.text)) {
      const prefix = ctx.staticMembers.has(node.text) ? ctx.className : 'this';
      return `${prefix}.${node.text}`;
    }
    // Global enum constant → qualified name (e.g. KEY_F21 → Key.KEY_F21)
    const enumQualified = ctx.globalEnumMap.get(node.text);
    if (enumQualified) return enumQualified;
    // Bare reference. Only a LOCAL binding (var / param / loop var) gets
    // reserved-word escaping (GD `function` → TS `function_`); global names
    // stay verbatim — they're not bindings.
    if (ctx.localVars.has(node.text)) return escapeTsBindingName(node.text);
    // … except a global whose name TypeScript cannot spell. As a CALL it
    // routes through `gd.` (see `emitCall`); as a VALUE — `var c: Callable
    // = typeof`, which GDScript accepts — there is nothing to emit. The
    // bare name is a TS syntax error, and `gd.typeof` is a TS value that
    // converts back to `gd.get("typeof")` rather than to the callable, so
    // both spellings are wrong in different ways. Say so instead.
    if (
      !ctx.classMembers.has(node.text) &&
      ctx.registry.isGlobalFunction(node.text) &&
      sanitizeFunctionName(node.text) !== node.text
    ) {
      ctx.diagnostics.push({
        message:
          `\`${node.text}\` is used as a value here, and TypeScript has no ` +
          `name for it — \`${node.text}\` is a TypeScript operator, so the ` +
          `global is only reachable as a call, \`gd.${node.text}(...)\`. ` +
          `Wrap it: \`func(v): return ${node.text}(v)\`.`,
        severity: 'error',
        file: ctx.filePath,
        line: node.startPosition.row + 1,
        column: node.startPosition.column + 1,
      });
    }
    return node.text;
  }

  if (node.type === SyntaxType.Integer || node.type === SyntaxType.Float) {
    return node.text;
  }

  if (node.type === SyntaxType.String) {
    const text = node.text;
    // GDScript triple-quoted (multi-line) string → TS template literal. The
    // raw content keeps its escape sequences (\n, \t, \\, …) — those are valid
    // in template literals too — so only backticks and `${` need escaping to
    // avoid accidental TS interpolation / early termination.
    if (text.startsWith('"""') || text.startsWith("'''")) {
      const content = text
        .slice(3, -3)
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
      return '`' + content + '`';
    }
    return text;
  }

  if (node.type === SyntaxType.True) return 'true';
  if (node.type === SyntaxType.False) return 'false';
  if (node.type === SyntaxType.Null) return 'null';

  if (node.type === SyntaxType.Call) {
    return emitCall(node, ctx);
  }

  if (node.type === SyntaxType.Attribute) {
    return emitAttribute(node, ctx);
  }

  if (node.type === SyntaxType.BinaryOperator) {
    // Check for %"UniqueNode"/Child pattern — tree-sitter parses / as division
    const uniqueNodePath = tryEmitUniqueNodePath(node);
    if (uniqueNodePath !== null) {
      return `this.get_node("${uniqueNodePath.path}")${uniqueNodePath.suffix}`;
    }
    return emitBinaryOp(node, ctx);
  }

  if (node.type === SyntaxType.UnaryOperator) {
    return emitUnaryOp(node, ctx);
  }

  if (node.type === SyntaxType.StringName) {
    const strChild = node.namedChildren.find(
      (c) => c.type === SyntaxType.String,
    );
    if (strChild) {
      // Extract the string content
      const content = strChild.text.slice(1, -1); // remove quotes
      return `StringName('${content}')`;
    }
    // &"text" — extract content between &" and "
    const text = node.text;
    const content = text.slice(2, -1);
    return `StringName('${content}')`;
  }

  if (node.type === SyntaxType.NodePath) {
    const text = node.text;
    const content = text.slice(2, -1);
    return `NodePath('${content}')`;
  }

  if (node.type === SyntaxType.GetNode) {
    // $Path -> this.get_node("Path")
    // $"Path/To/Node" -> this.get_node("Path/To/Node")
    // %UniqueNode -> this.get_node("%UniqueNode")
    // %"UniqueNode" -> this.get_node("%UniqueNode")
    const text = node.text;
    if (text.startsWith('%"')) {
      // %"UniqueNode" -> get_node("%UniqueNode")
      const name = text.slice(2, -1);
      return `this.get_node("%${name}")`;
    } else if (text.startsWith('%')) {
      // %UniqueNode -> get_node("%UniqueNode")
      const name = text.slice(1);
      return `this.get_node("%${name}")`;
    } else if (text.startsWith('$"')) {
      // $"Path/To/Node" -> get_node("Path/To/Node")
      const path = text.slice(2, -1);
      return `this.get_node("${path}")`;
    } else {
      // $Path -> get_node("Path")
      const path = text.slice(1);
      return `this.get_node("${path}")`;
    }
  }

  if (node.type === SyntaxType.Array) {
    const elements = emitCommaList(node.namedChildren, ctx);
    return `[${elements}]`;
  }

  if (node.type === SyntaxType.Dictionary) {
    const pairNodes = node.namedChildren.filter(
      (c) => c.type === SyntaxType.Pair,
    );
    // A Lua-style pair (`{a = 1}`) NAMES its key: GDScript reads it as the
    // StringName `&"a"` (verified at runtime), never as the variable `a`,
    // so it goes out exactly as `{&"a": 1}` would.
    const isLuaPair = (p: SyntaxNode) =>
      p.children.some((c) => !c.isNamed && c.type === '=');
    const emitKey = (p: SyntaxNode) => {
      const key = p.childForFieldName('left');
      if (!key) return '';
      return isLuaPair(p) ? `StringName('${key.text}')` : emitExpr(key, ctx);
    };
    // Check if any key is an identifier (variable reference, not string/number literal)
    const hasIdentifierKey = pairNodes.some((p) => {
      const key = p.childForFieldName('left');
      return key && key.type === SyntaxType.Identifier && !isLuaPair(p);
    });
    if (hasIdentifierKey) {
      // Use gd.dict() format for dicts with variable keys
      const entries = pairNodes.map((p) => {
        const value = p.childForFieldName('value');
        const keyStr = emitKey(p);
        const valStr = value ? emitExpr(value, ctx) : '';
        return `[${keyStr}, ${valStr}]`;
      });
      return `gd.dict([\n${entries.map((e) => `      ${e},`).join('\n')}\n    ])`;
    }
    // Check if any key is an expression (binary_operator, subscript, attribute, etc.)
    const hasExpressionKey = pairNodes.some((p) => {
      const key = p.childForFieldName('left');
      return (
        key &&
        key.type !== SyntaxType.String &&
        key.type !== SyntaxType.Integer &&
        key.type !== SyntaxType.Float
      );
    });
    if (hasExpressionKey) {
      // Use computed property syntax for expression keys
      const pairs = pairNodes.map((p) => {
        const key = p.childForFieldName('left');
        const value = p.childForFieldName('value');
        const keyStr = emitKey(p);
        const valStr = value ? emitExpr(value, ctx) : '';
        // Wrap non-literal keys in [...]
        const isLiteral =
          key &&
          !isLuaPair(p) &&
          (key.type === SyntaxType.String ||
            key.type === SyntaxType.Integer ||
            key.type === SyntaxType.Float);
        return isLiteral ? `${keyStr}: ${valStr}` : `[${keyStr}]: ${valStr}`;
      });
      return `{\n${pairs.map((p) => `      ${p},`).join('\n')}\n    }`;
    }
    // Regular object literal for string/number-keyed dicts
    const pairs = pairNodes
      .map((p) => {
        const key = p.childForFieldName('left');
        const value = p.childForFieldName('value');
        return `${key ? emitExpr(key, ctx) : ''}: ${value ? emitExpr(value, ctx) : ''}`;
      })
      .join(', ');
    return `{${pairs}}`;
  }

  if (node.type === SyntaxType.ConditionalExpression) {
    // GD: value if cond else other -> TS: cond ? value : other
    const left = node.childForFieldName('left');
    const condition = node.childForFieldName('condition');
    const right = node.childForFieldName('right');
    if (left && condition && right) {
      return `${emitExpr(condition, ctx)} ? ${emitExpr(left, ctx)} : ${emitExpr(right, ctx)}`;
    }
    return node.text;
  }

  if (node.type === SyntaxType.AwaitExpression) {
    const expr = firstSyntaxChild(node);
    return `await ${expr ? emitExpr(expr, ctx) : ''}`;
  }

  if (node.type === SyntaxType.ParenthesizedExpression) {
    const inner = firstSyntaxChild(node);
    return inner ? `(${emitExpr(inner, ctx)})` : '()';
  }

  if (node.type === SyntaxType.Subscript) {
    // obj[key]
    const obj = node.namedChildren[0];
    const argsNode = node.childForFieldName('arguments');
    const key = argsNode && firstSyntaxChild(argsNode);
    return `${obj ? emitExpr(obj, ctx) : ''}[${key ? emitExpr(key, ctx) : ''}]`;
  }

  if (node.type === SyntaxType.Lambda) {
    return emitLambda(node, ctx);
  }

  // Inline comment in expression context — emit as trailing comment
  if (node.type === SyntaxType.Comment) {
    const content = node.text.startsWith('##')
      ? node.text.slice(2).trim()
      : node.text.slice(1).trim();
    return `/* ${content} */`;
  }

  // Fallback: return raw text with warning
  ctx.diagnostics.push({
    message: `Unhandled GDScript expression: ${node.type}`,
    severity: 'error',
    file: ctx.filePath,
    line: node.startPosition.row + 1,
    column: node.startPosition.column + 1,
  });
  return `/* ERROR: Unhandled GDScript expression: ${node.type} */ ${node.text}`;
}

// ─── Call Expression ──────────────────────────────────────────

/**
 * Emit a comma-separated list, folding any interleaved comment onto the
 * item it trails.
 *
 * GDScript lets a `#` comment sit between the arguments of a call, or
 * the elements of an array literal, spread over several lines. The
 * comment is a SIBLING of the values in the tree, so emitting the list
 * position by position puts a block comment where TypeScript expects a
 * value, and `f(a, <comment>, b)` does not parse. The comment trails
 * the value before it, so that is where it goes.
 *
 * A comment with nothing before it — a list that opens with one — has
 * no item to attach to and is dropped: there is no legal spot for it,
 * and it carries no semantics. A `\` line continuation carries nothing
 * at all and is always dropped.
 */
function emitCommaList(nodes: SyntaxNode[], ctx: GdToTsContext): string {
  const items: string[] = [];
  for (const child of nodes) {
    if (child.type === SyntaxType.LineContinuation) continue;
    const text = emitExpr(child, ctx);
    if (child.type === SyntaxType.Comment) {
      if (items.length > 0) items[items.length - 1] += ` ${text}`;
      continue;
    }
    items.push(text);
  }
  return items.join(', ');
}

export function emitCall(node: SyntaxNode, ctx: GdToTsContext): string {
  // call node: first named child is callee, 'arguments' field has args
  const callee = node.namedChildren[0];
  const argsNode = node.childForFieldName('arguments');
  const args = argsNode ? emitCommaList(argsNode.namedChildren, ctx) : '';

  if (!callee) return `(${args})`;

  // GDScript super() → TS super.methodName() (or super() in constructors)
  if (callee.type === SyntaxType.Identifier && callee.text === 'super') {
    if (ctx.currentMethodName && ctx.currentMethodName !== 'constructor') {
      return `super.${ctx.currentMethodName}(${args})`;
    }
    return `super(${args})`;
  }

  // Bare `new()` → self-class constructor `new ClassName()`. Every GDScript
  // class exposes a hidden static `new()`; calling it unqualified instantiates
  // the current class. `ctx.className` is the already-escaped TS class name and
  // is swapped to the inner class inside `withClassScope`, so this resolves to
  // the innermost enclosing class. Skipped when `new` is a local variable.
  if (
    callee.type === SyntaxType.Identifier &&
    callee.text === 'new' &&
    ctx.className &&
    !ctx.localVars.has('new')
  ) {
    return `new ${ctx.className}(${args})`;
  }

  // A global whose GDScript name TypeScript cannot spell (`typeof`) has
  // no declaration of its own — it lives in the `gd` namespace, so the
  // call routes there. A local of the same name shadows the global.
  if (
    callee.type === SyntaxType.Identifier &&
    !ctx.localVars.has(callee.text) &&
    !ctx.classMembers.has(callee.text) &&
    ctx.registry.isGlobalFunction(callee.text) &&
    sanitizeFunctionName(callee.text) !== callee.text
  ) {
    return `gd.${callee.text}(${args})`;
  }

  // For bare identifier calls: prefix known class members. Static members
  // (static func / static var / const / enum / inner class) are accessed via
  // the class name; instance members via `this.` — mirrors `emitExpr` and
  // GDScript's own convention for reaching statics.
  if (
    callee.type === SyntaxType.Identifier &&
    !ctx.localVars.has(callee.text) &&
    !isGlobalName(callee.text, ctx)
  ) {
    if (ctx.classMembers.has(callee.text)) {
      const prefix = ctx.staticMembers.has(callee.text)
        ? ctx.className
        : 'this';
      return `${prefix}.${callee.text}(${args})`;
    }
  }

  const calleeStr = emitExpr(callee, ctx);
  return `${calleeStr}(${args})`;
}

// ─── Attribute Expression ─────────────────────────────────────

export function emitAttribute(node: SyntaxNode, ctx: GdToTsContext): string {
  // attribute node children: [object, ".", name] or [object, ".", attribute_call]
  const children = syntaxChildren(node);
  if (children.length === 0) return node.text;

  const parts: string[] = [];
  let selfSeen = false;

  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;

    // `self` at the start of an attribute chain becomes:
    //   - `ClassName` if the NEXT part is a static member
    //     (static var / const / enum / inner class / static func) —
    //     matches GDScript's convention of accessing statics via the
    //     class name, and avoids TS type-check surprises from
    //     accessing a static through `this`.
    //   - `this` otherwise (regular instance member).
    if (
      i === 0 &&
      child.type === SyntaxType.Identifier &&
      child.text === 'self'
    ) {
      const nextChild = children[i + 1];
      const nextName =
        nextChild && nextChild.type === SyntaxType.Identifier
          ? nextChild.text
          : nextChild && nextChild.type === SyntaxType.AttributeCall
            ? (nextChild.namedChildren.find(
                (c) => c.type === SyntaxType.Identifier,
              )?.text ?? '')
            : '';
      if (nextName && ctx.staticMembers.has(nextName)) {
        parts.push(ctx.className);
      } else {
        parts.push('this');
      }
      selfSeen = true;
      continue;
    }

    if (child.type === SyntaxType.AttributeCall) {
      // method call on attribute: obj.method(args)
      const methodName =
        child.namedChildren.find((c) => c.type === SyntaxType.Identifier)
          ?.text ?? '';
      const argsNode = child.childForFieldName('arguments');
      const args = argsNode ? emitCommaList(argsNode.namedChildren, ctx) : '';
      // .new() -> new ClassName(). Resolve the receiver to the name that's
      // actually in scope in the emitted TS:
      //  - inner class / class enum → `ClassName.Inner` (lives in the paired
      //    `namespace`, not visible bare from the class body) via qualifyClassType
      //  - the self class → the emitted (possibly `_Foo`→`G_Foo` escaped) name
      //  - a class member holding a script (`const Helper = preload(...)`)
      //    → qualified like any other member reference, `ClassName.Helper`.
      //    This branch replaces `parts` wholesale, so the member
      //    qualification at the end of the function never sees it.
      //  - anything else (Godot / other user class) → verbatim
      if (methodName === 'new') {
        const rawClassName = parts.join('.');
        const className =
          qualifyClassType(rawClassName, ctx.classTypeNames, ctx.className) ??
          selfClassNameIfMatches(rawClassName, ctx) ??
          qualifyMemberHead(parts, selfSeen, ctx).join('.');
        parts.length = 0;
        parts.push(`new ${className}(${args})`);
      } else {
        parts.push(`${methodName}(${args})`);
      }
    } else if (child.type === SyntaxType.AttributeSubscript) {
      const attrName =
        child.namedChildren.find((c) => c.type === SyntaxType.Identifier)
          ?.text ?? '';
      const argsNode = child.childForFieldName('arguments');
      const key = argsNode && firstSyntaxChild(argsNode);
      parts.push(`${attrName}[${key ? emitExpr(key, ctx) : ''}]`);
    } else if (child.type === SyntaxType.Identifier) {
      // The first chain element is the base expression — a bare local var /
      // param needs reserved-word escaping (e.g. `function.x` → `function_.x`).
      // Later elements are property names, which are NOT escaped (reserved
      // words are legal as TS property names).
      if (parts.length === 0 && ctx.localVars.has(child.text)) {
        parts.push(escapeTsBindingName(child.text));
      } else {
        parts.push(child.text);
      }
    } else {
      parts.push(emitExpr(child, ctx));
    }
  }

  return qualifyMemberHead(parts, selfSeen, ctx).join('.');
}

/**
 * If the first part of an attribute chain is a known class member, not
 * shadowed by a local variable, and no `self` was used, prefix it with
 * `this` (instance member) or `ClassName` (static member — matches
 * GDScript's convention of accessing statics via the class name).
 * Returns a new array; `parts` is left alone.
 */
function qualifyMemberHead(
  parts: readonly string[],
  selfSeen: boolean,
  ctx: GdToTsContext,
): string[] {
  const head = parts[0];
  if (
    selfSeen ||
    head === undefined ||
    !ctx.classMembers.has(head) ||
    ctx.localVars.has(head)
  ) {
    return [...parts];
  }
  const prefix = ctx.staticMembers.has(head) ? ctx.className : 'this';
  return [prefix, ...parts];
}
