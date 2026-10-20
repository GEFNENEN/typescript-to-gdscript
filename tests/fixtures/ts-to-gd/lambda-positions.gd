class_name MyClass
extends Node

# Block lambda in a field initializer
var on_ready: Callable = func():
    print("field")
var registry = {}

func apply(progress: float) -> void:
    print(progress)

func pair(a: Callable, b: Callable, n: int) -> void:
    a.call()
    b.call()
    print(n)

# Block lambda as a call argument, with more arguments after it
func tween_block() -> void:
    var tween = self.create_tween()
    tween.tween_method(func(progress: float):
        self.apply(progress)
        , 0.0, 1.0, 1.0)

# Arrow whose body is a void call
func tween_expr() -> void:
    var tween = self.create_tween()
    tween.tween_method(func(progress: float): self.apply(progress), 0.0, 1.0, 1.0)

# Two block lambdas in the same call
func siblings() -> void:
    self.pair(func():
        print("one")
        , func():
        print("two")
        , 5)

func containers() -> Callable:
    var arr = [func():
        print("array")
        ]
    var d = {
        "a": 1,
        "k": func():
        print("dict")
        ,
        "b": 2,
    }
    self.on_ready = func():
        print("assign")
    print(arr, d)
    return func():
        print("return")

# A lambda used as an operand of a larger expression
func operand(flag: bool) -> Callable:
    return (func(): self.apply(0.0)) if flag else self.on_ready

# `return` of a void call
func early(flag: bool) -> void:
    if flag:
        self.apply(1.0)
        return
    self.apply(2.0)

# A block lambda inside another block lambda's body
func nested() -> void:
    self.pair(func():
        self.pair(func():
            print("inner-a")
            , func():
            print("inner-b")
            , 1)
        print("outer")
        , func():
        print("second")
        , 2)

# A block lambda as a default parameter value
func with_default(cb = func():
    print("default")
    ) -> void:
    cb.call()

# A block lambda as an operand needs the parentheses AND the body
func operand_block(flag: bool) -> Callable:
    return (func():
        print("yes")
        ) if flag else (func():
        print("no")
        )

func make() -> Callable:
    return func():
        print("made")

# Calling a Callable VALUE — GDScript needs `.call()` however the
# value was produced
func call_values(flag: bool, cbs: Array) -> void:
    (func():
        print("iife")
        ).call()
    self.make().call()
    cbs[0].call()
    (cbs[0] if flag else cbs[1]).call()

# No call signature to go on, but a non-name callee can only ever be
# a value, so `.call()` is the sole reading
func untyped(x) -> void:
    (x).call()
    self.registry["fn"].call()

var handler: Callable:
    get:
        return self.on_ready
    set(value):
        self.on_ready = value

func accessor_values() -> void:
    self.handler.call()
    self.on_ready.call()
    self.apply(0.0)
