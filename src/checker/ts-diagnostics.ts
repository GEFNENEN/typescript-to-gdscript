import ts from 'typescript';
import { normalize, resolve } from 'path';
import type { TransformDiagnostic } from '../converter/common/index.ts';

/**
 * TS diagnostic codes that cannot correspond to a real mistake in this
 * dialect. Two kinds, and nothing else qualifies:
 *
 * 1. Codes the generated typings themselves provoke — TS2434 / TS2435
 *    ("namespace must precede the class") and TS2449 ("class used
 *    before its declaration"), from the namespace+class merge pattern.
 *
 * 2. Codes enforcing a JavaScript RUNTIME rule that GDScript does not
 *    have — TS2377 ("derived constructors must contain a super call")
 *    and TS17009 ("super must be called before accessing this"). Both
 *    exist because a JS object does not exist until the base
 *    constructor has run. Nothing here is ever run as JavaScript, and
 *    GDScript's `_init` has no such rule: `self` is live throughout,
 *    and the parent `_init` runs only if the script calls it. So
 *    `super()` is optional in a TS constructor here; one that is
 *    written goes out as written.
 *
 * Diagnostics a user opted into stay visible even when they fire on
 * every file — `noFallthroughCasesInSwitch` (TS7029) is incompatible
 * with this dialect, but silently overriding an explicit compiler
 * setting is worse than letting it say so. The codes above are not a
 * setting: they are unconditional, so leaving them in place would
 * force every constructor to carry a `super()` that means nothing.
 */
export const NOISE_CODES = new Set([2434, 2435, 2449, 2377, 17009]);

export function flattenDiagnosticMessage(
  msg: string | ts.DiagnosticMessageChain,
): string {
  if (typeof msg === 'string') return msg;
  const parts = [msg.messageText];
  if (msg.next) {
    for (const chain of msg.next) {
      parts.push(flattenDiagnosticMessage(chain));
    }
  }
  return parts.join(' ');
}

function tsSeverity(
  category: ts.DiagnosticCategory,
): TransformDiagnostic['severity'] {
  switch (category) {
    case ts.DiagnosticCategory.Error:
      return 'error';
    case ts.DiagnosticCategory.Warning:
      return 'warning';
    default:
      return 'info';
  }
}

/**
 * Collect TypeScript semantic + syntactic diagnostics from `program`,
 * limited to source files under `tsDir`. Filters out:
 * - `.d.ts` declaration files
 * - files outside `tsDir`
 * - noise codes 2434, 2435, 2449 (namespace+class merge pattern)
 */
export function collectTsDiagnostics(
  program: ts.Program,
  tsDir: string,
): TransformDiagnostic[] {
  const normalizedTsDir = normalize(resolve(tsDir));
  const result: TransformDiagnostic[] = [];

  for (const sf of program.getSourceFiles()) {
    const filePath = normalize(resolve(sf.fileName));
    if (filePath.endsWith('.d.ts')) continue;
    if (!filePath.startsWith(normalizedTsDir)) continue;

    const diags: readonly ts.Diagnostic[] = [
      ...program.getSyntacticDiagnostics(sf),
      ...program.getSemanticDiagnostics(sf),
    ];

    for (const d of diags) {
      if (NOISE_CODES.has(d.code)) continue;

      let line = 0;
      let column = 0;
      if (d.file && d.start !== undefined) {
        const lc = d.file.getLineAndCharacterOfPosition(d.start);
        line = lc.line + 1;
        column = lc.character + 1;
      }

      result.push({
        message: `TS${d.code}: ${flattenDiagnosticMessage(d.messageText)}`,
        severity: tsSeverity(d.category),
        file: filePath,
        line,
        column,
      });
    }
  }

  return result;
}
