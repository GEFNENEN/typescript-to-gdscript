import { readFileSync, writeFileSync } from 'fs';
import { extname, resolve } from 'path';
import {
  resourceParser,
  getSectionAttr,
  getSectionExtResource,
} from './scene-parser.ts';
import { SyntaxType } from '../parser/godot-resource/types.ts';
import {
  absPathToResPath,
  findAssetFiles,
  resolveResourceUid,
  ASSET_EXTENSION_MAP,
} from './scene-utils.ts';

/**
 * Writes `_resources.d.ts`: a `GodotResources` entry, under its `res://` path
 * and its uid, for every asset in the project. Returns the file written, or
 * undefined when the project has no assets.
 */
export function writeResourcesTyping(
  rootDir: string,
  ignore: string[],
  outputDir: string,
): string | undefined {
  const lines: string[] = [];
  for (const assetFile of findAssetFiles(rootDir, rootDir, ignore)) {
    const ext = extname(assetFile).toLowerCase();
    // Scenes and scripts get their entries from their own generators.
    if (ext === '.tscn' || ext === '.gd') continue;
    const type = resourceTypeExpression(assetFile);
    lines.push(`    "${absPathToResPath(assetFile, rootDir)}": ${type};`);
    const uid = resolveResourceUid(assetFile);
    if (uid) lines.push(`    "${uid}": ${type};`);
  }
  if (lines.length === 0) return undefined;

  const resourcesPath = resolve(outputDir, '_resources.d.ts');
  writeFileSync(
    resourcesPath,
    [
      '// AUTO-GENERATED — do not edit manually.\n',
      'declare global {',
      '  interface GodotResources {',
      ...lines,
      '  }',
      '}\n',
      'export {}',
    ].join('\n'),
  );
  return resourcesPath;
}

/**
 * The type of an asset file. A `.tres` / `.res` is what its root resource is:
 * the class in its `[gd_resource]` header, or — when the root has a script —
 * that script, looked up in `GodotScripts` by path the way a scene node's
 * script is, so a script without `class_name` types it too. Other assets are
 * typed by extension.
 */
function resourceTypeExpression(assetFile: string): string {
  const ext = extname(assetFile).toLowerCase();
  const byExtension = ASSET_EXTENSION_MAP[ext] ?? 'Resource';
  if (ext !== '.tres' && ext !== '.res') return byExtension;
  const root = parseResourceRoot(assetFile);
  const header = root?.type ?? byExtension;
  return root?.scriptResPath
    ? `_GDGetInterfaceResource<GodotScripts, "${root.scriptResPath}", ${header}>`
    : header;
}

/**
 * The header class and attached script of a text resource's root. Undefined
 * when the file can't be read or parsed (a binary `.res`, a corrupt file).
 */
function parseResourceRoot(
  filePath: string,
): { type?: string; scriptResPath?: string } | undefined {
  try {
    const root = resourceParser.parse(readFileSync(filePath, 'utf-8'));
    let type: string | undefined;
    let scriptId: string | undefined;
    const scripts = new Map<string, string>();
    for (const section of root.namedChildren) {
      if (section.type !== SyntaxType.Section) continue;
      const name = section.namedChildren.find(
        (c) => c.type === SyntaxType.Identifier,
      )?.text;
      if (name === 'gd_resource') {
        type = getSectionAttr(section, 'type');
      } else if (
        name === 'ext_resource' &&
        getSectionAttr(section, 'type') === 'Script'
      ) {
        const id = getSectionAttr(section, 'id');
        const path = getSectionAttr(section, 'path');
        if (id && path) scripts.set(id, path);
      } else if (name === 'resource') {
        scriptId = getSectionExtResource(section, 'script');
      }
    }
    return { type, scriptResPath: scriptId && scripts.get(scriptId) };
  } catch {
    return undefined;
  }
}
