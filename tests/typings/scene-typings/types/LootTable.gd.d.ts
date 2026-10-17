// AUTO-GENERATED — do not edit manually.

import type { _LootTable as ScriptClass } from "../LootTable";

type StaticProps = Omit<typeof ScriptClass, 'prototype' | keyof Function>;

declare module "../LootTable" {
  interface _LootTable extends StaticProps {}
}

declare global {
  interface GodotScripts {
    "res://LootTable.gd": ScriptClass;
  }

  interface GodotResources {
    "res://LootTable.gd": typeof ScriptClass;
  }
}

export {};