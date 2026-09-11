import ts from 'typescript';
import { tsTypeNodeToGdType } from '../common/index.ts';
import {
  isGdEvalCall,
  processGdEval,
  emitGdEval,
  isGdMatchCall,
  visitGdMatchStatement,
  emitMatchPatternExpr,
} from './gd-helpers.ts';
import type { TransformerDelegate } from './transformer-types.ts';

// ---- Block / Statement Visitors ----

export function visitBlock(t: TransformerDelegate, block: ts.Block): void {
  if (block.statements.length === 0) {
    const pos = t.getLineAndCol(block);
    t.emitter.writeLine('pass', pos.line, pos.col);
    return;
  }
  for (const stmt of block.statements) {
    t.emitLeadingComments(stmt);
    visitStatement(t, stmt);
  }
  // Emit trailing comments before the closing brace
  const closeBrace = block.getLastToken();
  if (closeBrace) {
    t.emitLeadingComments(closeBrace);
  }
}

/**
 * Write one statement line, splicing in the bodies of any block-body lambdas
 * that appeared as call arguments in that line.
 *
 * `emitCallExpression` marks each such lambda header with \u0001<id>\u0001 and
 * the point where the closing `)` belongs with \u0002, because a GDScript call
 * with an inline multi-line lambda must place the closing paren *after* the
 * body. Nothing may consume those markers except this function.
 */
export function writeStatementLine(
  t: TransformerDelegate,
  text: string,
  pos: { line: number; col: number },
): void {
  const lambdas = t.__argLambdas ?? [];
  t.__argLambdas = [];
  if (lambdas.length === 0 || !text.includes('\u0001')) {
    t.emitter.writeLine(text.replace(/\u0002/g, ''), pos.line, pos.col);
    return;
  }
  const re = /\u0001(\d+)\u0001|\u0002/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const seg = text.slice(last, m.index);
    if (seg) t.emitter.writeLine(seg, pos.line, pos.col);
    last = re.lastIndex;
    if (m[1] !== undefined) {
      const lambda = lambdas[Number(m[1])];
      if (lambda) t.emitLambdaBody(lambda);
    }
  }
  const tail = text.slice(last);
  if (tail) t.emitter.writeLine(tail, pos.line, pos.col);
}

export function visitStatement(
  t: TransformerDelegate,
  node: ts.Statement,
): void {
  const pos = t.getLineAndCol(node);
  t.__argLambdas = [];

  if (ts.isVariableStatement(node)) {
    visitVariableStatement(t, node);
  } else if (ts.isExpressionStatement(node)) {
    if (isGdEvalCall(node.expression)) {
      emitGdEval(t, node.expression as ts.CallExpression, pos);
    } else if (isGdMatchCall(node.expression)) {
      visitGdMatchStatement(
        t,
        node.expression as ts.CallExpression,
        visitStatement,
      );
    } else {
      writeStatementLine(t, t.emitExpression(node.expression), pos);
    }
  } else if (ts.isReturnStatement(node)) {
    const expr = node.expression ? ` ${t.emitExpression(node.expression)}` : '';
    writeStatementLine(t, `return${expr}`, pos);
  } else if (ts.isIfStatement(node)) {
    visitIfStatement(t, node);
  } else if (ts.isForOfStatement(node)) {
    visitForOfStatement(t, node);
  } else if (ts.isForStatement(node)) {
    visitForStatement(t, node);
  } else if (ts.isWhileStatement(node)) {
    visitWhileStatement(t, node);
  } else if (ts.isBlock(node)) {
    for (const s of node.statements) {
      visitStatement(t, s);
    }
  } else if (ts.isBreakStatement(node)) {
    t.emitter.writeLine('break', pos.line, pos.col);
  } else if (ts.isContinueStatement(node)) {
    t.emitter.writeLine('continue', pos.line, pos.col);
  } else if (ts.isSwitchStatement(node)) {
    visitSwitchStatement(t, node);
  } else if (ts.isForInStatement(node)) {
    t.addDiagnostic(
      node,
      'error',
      '`for...in` is not supported; use `for...of` instead',
    );
  } else {
    t.addDiagnostic(
      node,
      'error',
      `Unsupported statement: ${ts.SyntaxKind[node.kind]}`,
    );
  }
}

// ---- Variable Statements ----

export function visitVariableStatement(
  t: TransformerDelegate,
  node: ts.VariableStatement,
): void {
  for (const decl of node.declarationList.declarations) {
    const pos = t.getLineAndCol(decl);

    // Check for destructuring
    if (
      ts.isArrayBindingPattern(decl.name) ||
      ts.isObjectBindingPattern(decl.name)
    ) {
      t.addDiagnostic(
        decl,
        'error',
        'Destructuring is not supported in GDScript',
      );
      continue;
    }

    const name = decl.name.getText(t.ctx.sourceFile);

    // Check for var restriction (const and let are both allowed)
    const flags = node.declarationList.flags;
    if (!(flags & (ts.NodeFlags.Const | ts.NodeFlags.Let))) {
      t.addDiagnostic(
        node,
        'warning',
        '`var` is restricted; use `let` or `const` instead. Converting to `var`.',
      );
    }

    // Type
    const typeNode = (decl as ts.VariableDeclaration).type;
    const gdType = tsTypeNodeToGdType(
      typeNode,
      t.ctx.checker,
      t.ctx.sourceFile,
      t.currentClassName,
      t.ctx.registry,
    );
    const typeAnnotation = gdType ? `: ${gdType}` : '';

    // Special case: gd.eval() as initializer
    if (decl.initializer && isGdEvalCall(decl.initializer)) {
      const evalLines = processGdEval(t, decl.initializer as ts.CallExpression);
      if (evalLines && evalLines.length > 0) {
        // First line becomes the RHS of the var declaration
        const firstLine = evalLines[0]!;
        t.emitter.writeLine(
          `var ${name}${typeAnnotation} = ${firstLine}`,
          pos.line,
          pos.col,
        );
        // Remaining lines emit at current indent; their embedded \t prefixes
        // represent relative depth beyond the var line.
        for (let i = 1; i < evalLines.length; i++) {
          t.emitter.writeLine(evalLines[i]!, pos.line, pos.col);
        }
        continue;
      }
    }

    // Initializer
    const init = decl.initializer
      ? ` = ${t.emitExpression(decl.initializer)}`
      : '';

    writeStatementLine(t, `var ${name}${typeAnnotation}${init}`, pos);

    // If the initializer was a block lambda, emit its body after the declaration line
    if (decl.initializer && t.isBlockLambda(decl.initializer)) {
      t.emitLambdaBody(decl.initializer);
    }
  }
}

// ---- If Statement ----

export function visitIfStatement(
  t: TransformerDelegate,
  node: ts.IfStatement,
): void {
  const pos = t.getLineAndCol(node);
  t.emitter.writeLine(
    `if ${t.emitExpression(node.expression)}:`,
    pos.line,
    pos.col,
  );

  t.emitter.indent();
  visitStatementBody(t, node.thenStatement);
  t.emitter.dedent();

  if (node.elseStatement) {
    if (ts.isIfStatement(node.elseStatement)) {
      const elsePos = t.getLineAndCol(node.elseStatement);
      t.emitter.writeLine(
        `elif ${t.emitExpression(node.elseStatement.expression)}:`,
        elsePos.line,
        elsePos.col,
      );
      t.emitter.indent();
      visitStatementBody(t, node.elseStatement.thenStatement);
      t.emitter.dedent();
      if (node.elseStatement.elseStatement) {
        visitElseChain(t, node.elseStatement.elseStatement);
      }
    } else {
      const elsePos = t.getLineAndCol(node.elseStatement);
      t.emitter.writeLine('else:', elsePos.line, elsePos.col);
      t.emitter.indent();
      visitStatementBody(t, node.elseStatement);
      t.emitter.dedent();
    }
  }
}

function visitElseChain(t: TransformerDelegate, node: ts.Statement): void {
  if (ts.isIfStatement(node)) {
    const pos = t.getLineAndCol(node);
    t.emitter.writeLine(
      `elif ${t.emitExpression(node.expression)}:`,
      pos.line,
      pos.col,
    );
    t.emitter.indent();
    visitStatementBody(t, node.thenStatement);
    t.emitter.dedent();
    if (node.elseStatement) {
      visitElseChain(t, node.elseStatement);
    }
  } else {
    const pos = t.getLineAndCol(node);
    t.emitter.writeLine('else:', pos.line, pos.col);
    t.emitter.indent();
    visitStatementBody(t, node);
    t.emitter.dedent();
  }
}

// ---- For Statements ----

export function visitForOfStatement(
  t: TransformerDelegate,
  node: ts.ForOfStatement,
): void {
  const pos = t.getLineAndCol(node);
  const varName = ts.isVariableDeclarationList(node.initializer)
    ? (node.initializer.declarations[0]?.name.getText(t.ctx.sourceFile) ?? '_')
    : t.emitExpression(node.initializer as ts.Expression);
  const iterable = t.emitExpression(node.expression);
  t.emitter.writeLine(`for ${varName} in ${iterable}:`, pos.line, pos.col);
  t.emitter.indent();
  visitStatementBody(t, node.statement);
  t.emitter.dedent();
}

export function visitForStatement(
  t: TransformerDelegate,
  node: ts.ForStatement,
): void {
  const pos = t.getLineAndCol(node);
  if (node.initializer) {
    if (ts.isVariableDeclarationList(node.initializer)) {
      visitVariableStatement(
        t,
        ts.factory.createVariableStatement(undefined, node.initializer),
      );
    } else {
      t.emitter.writeLine(
        t.emitExpression(node.initializer),
        pos.line,
        pos.col,
      );
    }
  }
  const condition = node.condition ? t.emitExpression(node.condition) : 'true';
  t.emitter.writeLine(`while ${condition}:`, pos.line, pos.col);
  t.emitter.indent();
  visitStatementBody(t, node.statement);
  if (node.incrementor) {
    const incPos = t.getLineAndCol(node.incrementor);
    t.emitter.writeLine(
      t.emitExpression(node.incrementor),
      incPos.line,
      incPos.col,
    );
  }
  t.emitter.dedent();
}

// ---- While Statement ----

export function visitWhileStatement(
  t: TransformerDelegate,
  node: ts.WhileStatement,
): void {
  const pos = t.getLineAndCol(node);
  t.emitter.writeLine(
    `while ${t.emitExpression(node.expression)}:`,
    pos.line,
    pos.col,
  );
  t.emitter.indent();
  visitStatementBody(t, node.statement);
  t.emitter.dedent();
}

// ---- Switch -> Match ----

export function visitSwitchStatement(
  t: TransformerDelegate,
  node: ts.SwitchStatement,
): void {
  const pos = t.getLineAndCol(node);
  t.emitter.writeLine(
    `match ${t.emitExpression(node.expression)}:`,
    pos.line,
    pos.col,
  );
  t.emitter.indent();

  // Local patch: GDScript `match` has no fall-through, so consecutive TS `case`
  // labels that share one body must fold into ONE branch with a comma-separated
  // pattern list (`a, b, c:`). Emitting them separately turned the earlier labels
  // into `pass` branches and silently changed behaviour (and broke typed returns).
  const clauses = node.caseBlock.clauses;
  for (let ci = 0; ci < clauses.length; ci++) {
    const clause = clauses[ci];
    const clausePos = t.getLineAndCol(clause);
    if (ts.isCaseClause(clause)) {
      const patterns = [t.emitExpression(clause.expression)];
      let bodyClause = clause;
      // Fall-through labels (empty bodies) fold into the label that carries the body.
      while (
        bodyClause.statements.filter((s) => !ts.isBreakStatement(s)).length === 0 &&
        ci + 1 < clauses.length &&
        ts.isCaseClause(clauses[ci + 1]!)
      ) {
        ci++;
        bodyClause = clauses[ci] as ts.CaseClause;
        patterns.push(t.emitExpression(bodyClause.expression));
      }
      t.emitter.writeLine(
        `${patterns.join(', ')}:`,
        clausePos.line,
        clausePos.col,
      );
      t.emitter.indent();
      const stmts = bodyClause.statements.filter(
        (s) => !ts.isBreakStatement(s),
      );
      if (stmts.length === 0) {
        t.emitter.writeLine('pass', clausePos.line, clausePos.col);
      } else {
        for (const stmt of stmts) {
          visitStatement(t, stmt);
        }
      }
      t.emitter.dedent();
    } else {
      t.emitter.writeLine('_:', clausePos.line, clausePos.col);
      t.emitter.indent();
      const stmts = clause.statements.filter((s) => !ts.isBreakStatement(s));
      if (stmts.length === 0) {
        t.emitter.writeLine('pass', clausePos.line, clausePos.col);
      } else {
        for (const stmt of stmts) {
          visitStatement(t, stmt);
        }
      }
      t.emitter.dedent();
    }
  }

  t.emitter.dedent();
}

// ---- Statement Body Helper ----

export function visitStatementBody(
  t: TransformerDelegate,
  node: ts.Statement,
): void {
  if (ts.isBlock(node)) {
    if (node.statements.length === 0) {
      const pos = t.getLineAndCol(node);
      t.emitter.writeLine('pass', pos.line, pos.col);
    } else {
      for (const stmt of node.statements) {
        t.emitLeadingComments(stmt);
        visitStatement(t, stmt);
      }
    }
  } else {
    visitStatement(t, node);
  }
}
