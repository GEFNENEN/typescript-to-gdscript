class_name GodotObjectNames
extends Object

# An inner class goes out through a different path than the script's own.
class Inner extends Object:
    pass

var held: Object = null
# TypeScript's own `Object` type is the plain-object interface — no
# GDScript type at all, so the annotation is dropped.
var plain = null
signal hit

# `gd.getset` falls back to its value's type when the annotation is no
# GDScript type, and that type goes through the same name rules.
var inferred_held: Object = self.held:
    get:
        return inferred_held
    set(value):
        inferred_held = value

var inferred_plain = self.plain:
    get:
        return inferred_plain
    set(value):
        inferred_plain = value

func take(o: Object) -> Object:
    return o

func make() -> Object:
    return Object.new()

func check(x: Node) -> bool:
    return x is Object

func cast(x: Node) -> Object:
    return x as Object

func flags() -> void:
    self.hit.connect(func():
        pass
        , Object.CONNECT_ONE_SHOT)
    # The VALUE `Object` is the engine class in TypeScript too.
    self.hit.connect(func():
        pass
        , Object.CONNECT_DEFERRED)
