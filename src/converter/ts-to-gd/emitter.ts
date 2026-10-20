import { SourceMapper, type Mapping } from '../../sourcemap/index.ts';

/**
 * GDScript code emitter with source map support.
 * Tracks line/column positions as code is emitted.
 */
/**
 * An annotation alone on its line — no statement after it to attach to.
 * `@onready`, `@warning_ignore("unused_variable")`, `@export_range(0, 1)`.
 *
 * The argument list runs to the LAST `)` on the line, not the first:
 * an argument is free-form text (it can reach the emitter through
 * `gd.eval`) and may contain `)` inside a string. Matching too eagerly
 * only costs a redundant `pass`; matching too little suppresses one
 * and emits a block GDScript refuses to parse. An annotation with a
 * statement after it (`@export var x = 1`) still fails to match, since
 * the line then has text left over after the closing `)`.
 */
const BARE_ANNOTATION = /^@[A-Za-z_]\w*\s*(\(.*\))?$/;

/**
 * Stands in for a block of GDScript that belongs in the middle of an
 * expression — a lambda body. The expression emitter builds a string
 * and cannot write indented lines of its own, and the lambda is
 * rarely the last thing on its line (`f(func(): …, 0, 1)`), so it
 * reserves the block with {@link GDScriptEmitter.reserveBlock} and
 * leaves this marker where the body goes. `writeLine` expands it.
 *
 * The `\0` cannot arrive from source: string literals are emitted
 * from `getText()`, so a `\0` escape in TypeScript stays the two
 * characters `\` and `0`.
 */
const BLOCK_MARKER = /\0block:(\d+)\0/;

export class GDScriptEmitter {
  private output: string[] = [];
  private currentLine = 1;
  private currentColumn = 0;
  private indentLevel = 0;
  // Four spaces, matching `docs/GODOT_CODING.md` and the `.gd` files the
  // project has checked in (GDScript accepts either).
  private indentStr = '    ';
  private sourceMapper: SourceMapper | null = null;
  private sourceFile: string;
  private blocks = new Map<number, () => void>();
  private nextBlockId = 1;

  constructor(
    sourceFile: string,
    generatedFile?: string,
    enableSourceMap = false,
  ) {
    this.sourceFile = sourceFile;
    if (enableSourceMap && generatedFile) {
      this.sourceMapper = new SourceMapper(sourceFile, generatedFile);
    }
  }

  indent(): void {
    this.indentLevel++;
  }

  dedent(): void {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
  }

  /**
   * Write text to output, tracking position for source maps.
   * @param text The text to write
   * @param originalLine Original source line (1-based), for source map
   * @param originalColumn Original source column (0-based), for source map
   */
  write(text: string, originalLine?: number, originalColumn?: number): void {
    if (
      originalLine !== undefined &&
      originalColumn !== undefined &&
      this.sourceMapper
    ) {
      this.sourceMapper.addMapping({
        source: this.sourceFile,
        originalLine,
        originalColumn,
        generatedLine: this.currentLine,
        generatedColumn: this.currentColumn,
      });
    }

    const lines = text.split('\n');
    this.output.push(text);
    this.currentLine += lines.length - 1;
    this.currentColumn =
      lines.length > 1
        ? lines.at(-1)!.length
        : this.currentColumn + lines.at(0)!.length;
  }

  /**
   * Reserve a block of lines for a spot inside an expression, and
   * return the marker to leave there. `emit` runs later, from
   * `writeLine`, with the indent level already set to the block's
   * body — so it writes whole lines exactly as a statement would,
   * keeping its own source-map positions.
   */
  reserveBlock(emit: () => void): string {
    const id = this.nextBlockId++;
    this.blocks.set(id, emit);
    return `\0block:${id}\0`;
  }

  /**
   * One indentation level. For callers that emit text the user wrote
   * verbatim (`gd.eval`, a `// @gd.eval:` comment) and so have to re-indent
   * it themselves — emitting the text's own tabs next to this emitter's
   * spaces mixes the two, which GDScript rejects.
   */
  get indentUnit(): string {
    return this.indentStr;
  }

  /** Write text followed by a newline, with mapping at column 0 (line start). */
  writeLine(text: string, originalLine: number, originalColumn: number): void {
    const indent = this.indentStr.repeat(this.indentLevel);
    if (!text.includes('\0')) {
      this.write(indent + text, originalLine, originalColumn);
      this.write('\n');
      return;
    }

    // `[before, id, between, id, …, after]` — `split` on a regex with
    // one capture group hands back the ids between the segments.
    const parts = text.split(BLOCK_MARKER);
    const bodyIndent = this.indentStr.repeat(this.indentLevel + 1);
    this.write(indent + parts[0]!, originalLine, originalColumn);

    for (let i = 1; i < parts.length; i += 2) {
      const id = Number(parts[i]);
      const emit = this.blocks.get(id);
      // Emitting the header without its body would produce a `func():`
      // GDScript cannot parse, so a marker that lost its block is a
      // bug in the caller, not something to paper over.
      if (!emit) throw new Error(`Inline block ${id} was never reserved`);
      this.blocks.delete(id);

      this.write('\n');
      this.indentLevel++;
      emit();
      this.indentLevel--;

      // The block wrote whole lines, so whatever followed the lambda
      // has to start a new one. It goes at the body's indent: GDScript
      // takes a continuation there, but not at a level in between —
      // an unindent has to land on one the parser still has open.
      const rest = parts[i + 1] ?? '';
      if (rest === '' && i + 2 >= parts.length) return;
      this.write(bodyIndent + rest, originalLine, originalColumn);
    }

    this.write('\n');
  }

  /** Write an empty line */
  writeEmptyLine(): void {
    this.write('\n');
  }

  /** Get current indentation level */
  getIndentLevel(): number {
    return this.indentLevel;
  }

  /** Get indentation string for a given level */
  getIndentStr(level?: number): string {
    return this.indentStr.repeat(level ?? this.indentLevel);
  }

  /** Write current indentation */
  writeIndent(): void {
    const indent = this.indentStr.repeat(this.indentLevel);
    this.write(indent);
  }

  /**
   * Opaque marker for the current end of output, for
   * {@link hasCodeSince}.
   */
  mark(): number {
    return this.output.length;
  }

  /**
   * True when a real GDScript statement has been written since `mark`.
   * Asking the output rather than the AST keeps the rule correct for
   * every statement kind, including ones that emit only an error
   * marker. Three things produce a line without filling an indented
   * block, and GDScript rejects a block none of whose lines is a
   * statement: a blank line, a comment, and an annotation with nothing
   * after it (an annotation attaches to the statement that follows,
   * so `@export var x = 1` counts but a lone `@warning_ignore(...)`
   * does not).
   */
  hasCodeSince(mark: number): boolean {
    return this.output
      .slice(mark)
      .join('')
      .split('\n')
      .some((line) => {
        const text = line.trim();
        if (text === '' || text.startsWith('#')) return false;
        return !BARE_ANNOTATION.test(text);
      });
  }

  /**
   * Throw when a reserved block never reached `writeLine`.
   *
   * `writeLine` already rejects the opposite mismatch — a marker whose
   * block is gone. This is the half that matters more: a block whose
   * marker was dropped is a lambda body that vanished from the output
   * with nothing to show for it, which is precisely the silent loss
   * `reserveBlock` exists to prevent. It can only happen if a caller
   * emits an expression and then throws the string away, so it is a
   * bug in the caller, and a converter that fails loudly beats one
   * that writes a `.gd` missing a function body.
   */
  assertBlocksDrained(): void {
    if (this.blocks.size === 0) return;
    const ids = [...this.blocks.keys()].join(', ');
    throw new Error(
      `Inline block(s) ${ids} were reserved but never written — ` +
        'an emitted expression string was discarded after a lambda ' +
        'body was reserved for it.',
    );
  }

  /** Get the generated code */
  getOutput(): string {
    return this.output.join('');
  }

  /** Get the source map JSON string, or undefined if source maps are disabled */
  getSourceMap(): string | undefined {
    return this.sourceMapper?.toString();
  }

  /** Set source content for source maps */
  setSourceContent(content: string): void {
    this.sourceMapper?.addSourceContent(this.sourceFile, content);
  }
}
