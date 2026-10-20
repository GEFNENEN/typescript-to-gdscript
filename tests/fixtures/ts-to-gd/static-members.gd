class_name MyClass
extends Node

static var MAX_SPEED: float = 200.0
static var instance_count: int = 0
# A static initializer reading another static. `self` is `Nil` while
# statics initialize, so this can only go through the class name.
static var SPEED_LIMIT: float = MyClass.MAX_SPEED
# Static field holding a Callable — invoked with `.call()`.
static var on_spawn = func(name: String):
    print(name)

static func get_max_speed() -> float:
    return MyClass.MAX_SPEED

static func increment_count():
    MyClass.instance_count += 1

# `this` inside a static method is the class itself in TS, and
# GDScript has no `self` inside `static func`.
static func reset():
    MyClass.instance_count = 0
    return MyClass.get_max_speed()

# A lambda inside a static func is still static context — a GDScript
# lambda captures `self` lexically, and there is none to capture.
static func speed_getter() -> Callable:
    return func(): return MyClass.MAX_SPEED

static func spawn():
    MyClass.on_spawn.call("player")

# Instance context reaches statics through the class name too.
func current_speed() -> float:
    return MyClass.MAX_SPEED
