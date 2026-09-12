import type ts from 'typescript';
import type { TransformContext, TransformDiagnostic } from '../common/index.ts';
import type { GDScriptEmitter } from './emitter.ts';

/**
 * Interface exposed by TsToGdTransformer to module functions.
 * Module functions receive this delegate instead of the full class,
 * keeping the dependency surface explicit.
 */
export interface TransformerDelegate {
  readonly ctx: TransformContext;
  readonly emitter: GDScriptEmitter;
  readonly currentClassName: string;
  readonly currentAccessorName: string | null;
  setCurrentAccessorName(name: string | null): void;
  /** [Local patch] Set while emitting a `static` function body, so
   *  `emitPropertyAccess` knows `self` is illegal and finds members bare. */
  __inStaticFunc?: boolean;

  /** [Local patch] True while emitting a constructor body (`_init`), so
   *  `emitExpression` can drop bare `super()` calls that GDScript cannot
   *  express when the parent class has no real `_init` (Godot engine classes
   *  and plain project base classes). Calls like `super(args)` for a parent
   *  that DOES define a constructor, or `super.method()`, are still emitted. */
  __inConstructor?: boolean;
  /** [Local patch] Block-body lambdas awaiting body-splicing by the statement
   *  writer (`writeStatementLine`). Indexed by the \u0001<id>\u0001 markers. */
  __argLambdas?: (ts.ArrowFunction | ts.FunctionExpression)[];

  // ── Expression / statement visitors ─────────────────────────
  emitExpression(node: ts.Expression): string;
  visitStatement(node: ts.Statement): void;
  visitBlock(block: ts.Block): void;
  visitVariableStatement(node: ts.VariableStatement): void;

  // ── Parameters ──────────────────────────────────────────────
  emitParameters(params: ts.NodeArray<ts.ParameterDeclaration>): string;

  // ── Comments ────────────────────────────────────────────────
  emitLeadingComments(node: ts.Node): void;

  // ── String helpers ──────────────────────────────────────────
  emitStringLiteral(node: ts.StringLiteral): string;
  escapeGdString(text: string): string;

  // ── Lambda helpers ──────────────────────────────────────────
  isBlockLambda(
    node: ts.Expression,
  ): node is ts.ArrowFunction | ts.FunctionExpression;
  emitLambdaBody(node: ts.ArrowFunction | ts.FunctionExpression): void;

  // ── Diagnostics / position helpers ──────────────────────────
  addDiagnostic(
    node: ts.Node,
    severity: TransformDiagnostic['severity'],
    message: string,
  ): void;
  getLineAndCol(node: ts.Node): { line: number; col: number };

  // ── gd.* detection helpers ──────────────────────────────────
  isGdHelperCall(node: ts.Expression, methodName: string): boolean;

  // ── Multi-line dict helper ──────────────────────────────────
  emitMultiLineDict(entries: string[]): string;
}
