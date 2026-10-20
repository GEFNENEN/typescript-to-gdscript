# A class of your own named `GodotObject` is yours: only the typings'
# engine class goes out as GDScript's `Object`.
class_name GodotObject
extends Node

var twin: GodotObject = null

func make() -> GodotObject:
    return GodotObject.new()
