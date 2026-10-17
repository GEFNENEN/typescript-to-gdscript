// AUTO-GENERATED — do not edit manually.

import type { Weapon as ScriptClass } from "../Weapon";

type StaticProps = Omit<typeof ScriptClass, 'prototype' | keyof Function>;

declare module "../Weapon" {
  interface Weapon extends StaticProps {}
}

declare global {
  /** @see import("../Weapon") */
  class Weapon extends ScriptClass {
  }

  interface GodotScripts {
    "res://Weapon.gd": Weapon;
  }

  interface GodotResources {
    "res://Weapon.gd": typeof Weapon;
  }
}

export {};