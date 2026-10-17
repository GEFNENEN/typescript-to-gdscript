import { describe, it, expect, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { Watcher } from '../../src/watcher/index.ts';

// ─── Helpers ────────────────────────────────────────────────

function makeTmpDir(label: string): string {
  const dir = join(
    tmpdir(),
    `tstogd-${label}-${randomBytes(4).toString('hex')}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(
  predicate: () => T | undefined,
  timeout = 3000,
  step = 50,
): Promise<T | undefined> {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const v = predicate();
    if (v) return v;
    if (Date.now() - start > timeout) return v;
    await sleep(step);
  }
}

const AUTOLOAD = '\n[autoload]\n\nGame="*res://out/game_state.gd"\n';

/**
 * A project whose `hud.ts` reads an autoload. Conversion only gets it right
 * with the generated typings in the program: they declare `Game`, and its
 * plain-object field reads through `.get()`, its function field via `.call()`.
 */
function writeProject(dir: string, withAutoload: boolean): string {
  const typings = resolve(__dirname, '../../typings').replace(/\\/g, '/');
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(
    join(dir, 'project.godot'),
    'config_version=5\n' + (withAutoload ? AUTOLOAD : ''),
  );
  writeFileSync(
    join(dir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'esnext',
        module: 'esnext',
        moduleResolution: 'bundler',
        noLib: true,
        strict: true,
        noEmit: true,
        types: [],
      },
      include: [typings, 'src/**/*.ts', 'types/**/*.d.ts'],
    }),
  );
  writeFileSync(
    join(dir, 'src/game_state.ts'),
    [
      'export class _GameState extends Node {',
      '  config: { speed: float } = { speed: 1.0 };',
      '  on_done: () => void = () => {};',
      '}',
    ].join('\n'),
  );
  const hud = join(dir, 'src/hud.ts');
  writeFileSync(
    hud,
    [
      'export class Hud extends Node {',
      '  _ready(): void {',
      '    print(Game.config.speed);',
      '    Game.on_done();',
      '  }',
      '}',
    ].join('\n'),
  );
  return hud;
}

const isTyped = (gd: string) =>
  gd.includes('print(Game.config.get("speed"))') &&
  gd.includes('Game.on_done.call()');

// ─── Tests ──────────────────────────────────────────────────

describe('Watcher: conversion sees the typings generated for it', () => {
  let tmpDir: string;
  let watcher: Watcher | null = null;

  afterEach(async () => {
    if (watcher) {
      await watcher.stop();
      watcher = null;
    }
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  function startWatcher(noCheck: boolean): void {
    watcher = new Watcher({
      rootDir: tmpDir,
      tsDir: join(tmpDir, 'src'),
      gdDir: join(tmpDir, 'out'),
      cacheDir: join(tmpDir, 'cache'),
      typingsDir: join(tmpDir, 'types'),
      tsConfigPath: join(tmpDir, 'tsconfig.json'),
      projectFile: join(tmpDir, 'project.godot'),
      noCheck,
    });
    watcher.start();
  }

  it('converts the initial scan of a fresh checkout against its typings', async () => {
    tmpDir = makeTmpDir('watcher-typings');
    writeProject(tmpDir, true);
    startWatcher(true);

    const hudGd = join(tmpDir, 'out/hud.gd');
    const gd = await waitFor(
      () => existsSync(hudGd) && readFileSync(hudGd, 'utf-8'),
      8000,
    );
    expect(gd, gd || '(not written)').toSatisfy(
      (text: string | false) => !!text && isTyped(text),
    );
  }, 20000);

  // project.godot changes no `.ts`, so only the check can bring `hud.gd` up
  // to date — and only if its program carries the regenerated typings.
  it('a project.godot change reaches the check, which heals the scripts it affects', async () => {
    tmpDir = makeTmpDir('watcher-typings');
    writeProject(tmpDir, false);
    startWatcher(false);

    const hudGd = join(tmpDir, 'out/hud.gd');
    const before = await waitFor(
      () => existsSync(hudGd) && readFileSync(hudGd, 'utf-8'),
      8000,
    );
    expect(before).toContain('print(Game.config.speed)');
    // Let the first check set the diagnostics baseline (debounce is 1s).
    await sleep(2500);

    writeFileSync(
      join(tmpDir, 'project.godot'),
      'config_version=5\n' + AUTOLOAD,
    );

    const healed = await waitFor(() => {
      const gd = readFileSync(hudGd, 'utf-8');
      return isTyped(gd) ? gd : undefined;
    }, 12000);
    expect(healed, readFileSync(hudGd, 'utf-8')).toBeTruthy();
  }, 30000);
});
