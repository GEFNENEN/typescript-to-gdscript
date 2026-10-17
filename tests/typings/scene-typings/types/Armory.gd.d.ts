// AUTO-GENERATED — do not edit manually.

import type { Armory as ScriptClass } from "../Armory";

type StaticProps = Omit<typeof ScriptClass, 'prototype' | keyof Function>;

type ScriptTree = _GDGetInterfaceTree<__ArmoryGd__Trees>;
type ScriptPaths = _GDGetTreePaths<ScriptTree>;

declare module "../Armory" {
  interface Armory extends StaticProps {
    get_node<P extends string & ScriptPaths>(path: P): _GDGetNode<ScriptTree, P>;
    get_node<P extends '/root' | `/root/${string}`>(path: P): _GDGetRootNode<ScriptTree, P>;
    get_node(path: string): Node | null;
    get_node(path: NodePath): Node | null;
    get_node_or_null<P extends string & ScriptPaths>(path: P): _GDGetNodeOrNull<ScriptTree, P>;
    get_node_or_null<P extends '/root' | `/root/${string}`>(path: P): _GDGetRootNode<ScriptTree, P> | null;
    get_node_or_null(path: string): Node | null;
    get_node_or_null(path: NodePath): Node | null;
    has_node<P extends string & ScriptPaths>(path: P): boolean;
    has_node(path: string): boolean;
    has_node(path: NodePath): boolean;
    get_child<Idx extends number & _GDChildIndices<ScriptTree>>(idx: Idx): _GDGetChild<ScriptTree, Idx>;
    get_child(idx: int, include_internal?: boolean): Node;
    get_parent(): _GDParentType<ScriptTree>;
    get_parent<N extends Node = Node>(): N;
  }
}

declare global {
  interface __ArmoryGd__Trees {}

  /** @see import("../Armory") */
  class Armory extends ScriptClass {
    get_node(path: string): Node | null;
    get_node(path: NodePath): Node | null;
    get_node_or_null(path: string): Node | null;
    get_node_or_null(path: NodePath): Node | null;
    has_node(path: string): boolean;
    has_node(path: NodePath): boolean;
    get_child(idx: int, include_internal?: boolean): Node;
    get_parent<N extends Node = Node>(): N;
  }

  interface GodotScripts {
    "res://Armory.gd": Armory;
  }

  interface GodotResources {
    "res://Armory.gd": typeof Armory;
  }
}

export {};