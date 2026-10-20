import { describe, it, expect } from 'vitest';
import { GDScriptEmitter } from '../../src/converter/ts-to-gd/emitter.js';

/**
 * `hasCodeSince` decides whether an indented GDScript block got a real
 * statement, and therefore whether it needs a `pass`. Getting it wrong
 * in one direction costs a redundant `pass`; getting it wrong in the
 * other emits a block GDScript refuses to parse. These pin the second
 * direction.
 */
describe('GDScriptEmitter: hasCodeSince', () => {
  function after(write: (e: GDScriptEmitter) => void): boolean {
    const e = new GDScriptEmitter('a.ts');
    const mark = e.mark();
    write(e);
    return e.hasCodeSince(mark);
  }

  it('reports no code for a blank line', () => {
    expect(after((e) => e.writeLine('', 1, 1))).toBe(false);
  });

  it('reports no code for a comment', () => {
    expect(after((e) => e.writeLine('# just a note', 1, 1))).toBe(false);
  });

  it('reports code for a statement', () => {
    expect(after((e) => e.writeLine('print("x")', 1, 1))).toBe(true);
  });

  it('reports no code for a bare annotation', () => {
    expect(after((e) => e.writeLine('@onready', 1, 1))).toBe(false);
  });

  it('reports no code for a bare annotation with arguments', () => {
    expect(
      after((e) => e.writeLine('@warning_ignore("unused_variable")', 1, 1)),
    ).toBe(false);
  });

  // The argument is free-form text (it can reach the emitter through
  // `gd.eval`), so a `)` inside a string must not end the argument list
  // early and make the line read as a statement.
  it('reports no code for a bare annotation whose argument contains `)`', () => {
    expect(
      after((e) => e.writeLine('@export_placeholder("name (x)")', 1, 1)),
    ).toBe(false);
  });

  // The flip side: an annotation followed by a statement on the same
  // line IS code — the annotation attaches to that statement.
  it('reports code for an annotation with a statement after it', () => {
    expect(after((e) => e.writeLine('@export var x = 1', 1, 1))).toBe(true);
    expect(
      after((e) => e.writeLine('@export_range(0, 1) var x = 1', 1, 1)),
    ).toBe(true);
  });
});

/**
 * `reserveBlock` / `writeLine` put an indented block in the middle of
 * an expression — the GDScript lambda body. Everything about it is
 * decided by `writeLine`: where the body's lines go, where the rest of
 * the line goes, and that a tail-position block does not gain a blank
 * line. The fixtures pin the emitted GDScript; these pin the mechanism
 * underneath it, including the two cases no fixture can reach.
 */
describe('GDScriptEmitter: reserved blocks', () => {
  function emit(write: (e: GDScriptEmitter) => void): string {
    const e = new GDScriptEmitter('a.ts');
    write(e);
    return e.getOutput();
  }

  it('writes the body one level deeper, with nothing after it', () => {
    const out = emit((e) => {
      const block = e.reserveBlock(() => e.writeLine('print("x")', 1, 1));
      e.writeLine(`var cb = func():${block}`, 1, 1);
    });
    expect(out).toBe('var cb = func():\n    print("x")\n');
  });

  // The text after the lambda cannot stay on the header's line, and it
  // goes at the BODY's indent — GDScript takes a continuation there,
  // but not at a level it has no block open for.
  it('moves what follows the block onto its own line at the body indent', () => {
    const out = emit((e) => {
      const block = e.reserveBlock(() => e.writeLine('print("x")', 1, 1));
      e.writeLine(`f(func():${block}, 1)`, 1, 1);
    });
    expect(out).toBe('f(func():\n    print("x")\n    , 1)\n');
  });

  it('expands two blocks on one line at the same indent', () => {
    const out = emit((e) => {
      const a = e.reserveBlock(() => e.writeLine('print("a")', 1, 1));
      const b = e.reserveBlock(() => e.writeLine('print("b")', 1, 1));
      e.writeLine(`f(func():${a}, func():${b}, 2)`, 1, 1);
    });
    expect(out).toBe(
      'f(func():\n    print("a")\n    , func():\n    print("b")\n    , 2)\n',
    );
  });

  // A lambda inside another lambda's body re-enters `writeLine` while
  // the outer expansion is still running.
  it('expands a block reserved from inside another block', () => {
    const out = emit((e) => {
      const outer = e.reserveBlock(() => {
        const inner = e.reserveBlock(() => e.writeLine('print("in")', 1, 1));
        e.writeLine(`g(func():${inner}, 1)`, 1, 1);
      });
      e.writeLine(`f(func():${outer}, 2)`, 1, 1);
    });
    expect(out).toBe(
      'f(func():\n    g(func():\n        print("in")\n        , 1)\n    , 2)\n',
    );
  });

  it('honours the indent level in force when the line is written', () => {
    const out = emit((e) => {
      e.indent();
      const block = e.reserveBlock(() => e.writeLine('print("x")', 1, 1));
      e.writeLine(`var cb = func():${block}`, 1, 1);
    });
    expect(out).toBe('    var cb = func():\n        print("x")\n');
  });

  // Emitting the header without its body would be a `func():` GDScript
  // cannot parse, so this fails loudly instead.
  it('throws when a marker has no reserved block', () => {
    const e = new GDScriptEmitter('a.ts');
    const block = e.reserveBlock(() => e.writeLine('print("x")', 1, 1));
    e.writeLine(`var a = func():${block}`, 1, 1);
    expect(() => e.writeLine(`var b = func():${block}`, 1, 1)).toThrow(
      /never reserved/,
    );
  });

  it('leaves a lone NUL that is not a marker alone', () => {
    const out = emit((e) => e.writeLine('print("a\0b")', 1, 1));
    expect(out).toBe('print("a\0b")\n');
  });

  // The mirror of the throw above, and the half that matters more: a
  // reserved block whose marker never reached `writeLine` is a lambda
  // body that vanished from the output with nothing to show for it.
  it('throws when a reserved block was never written', () => {
    const e = new GDScriptEmitter('a.ts');
    e.reserveBlock(() => e.writeLine('print(1)', 1, 1));
    expect(() => e.assertBlocksDrained()).toThrow(/never written/);
  });

  it('is drained once every marker has been written', () => {
    const e = new GDScriptEmitter('a.ts');
    const block = e.reserveBlock(() => e.writeLine('print(1)', 1, 1));
    e.writeLine('var cb = func():' + block, 1, 1);
    expect(() => e.assertBlocksDrained()).not.toThrow();
  });
});
