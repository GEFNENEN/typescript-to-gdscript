class_name ExportUntyped
extends Node

# Bare `@export` is the one annotation that needs the type spelled
# out: with no type AND no initializer Godot answers `Cannot use
# simple "@export" annotation with variable without type or
# initializer`. `Variant` is what an untyped GDScript variable
# already is, so it changes nothing but makes the file load.
@export var unprovable: Variant
# An initializer gives Godot a type to infer, so nothing is added.
@export var with_initializer = 1
# A provable type is emitted as itself.
@export var provable: float = 1.0
# The typed export annotations carry the type themselves and accept
# an untyped variable, so they are left alone.
@export_range(0, 10) var ranged
@export_node_path("Node2D") var path_export
# Without `@export` a bare `var` is perfectly valid.
var plain
