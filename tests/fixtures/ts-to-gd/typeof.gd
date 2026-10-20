class_name MyClass
extends Node

func describe(value) -> String:
    var kind: Variant.Type = typeof(value)
    if kind == Variant.Type.TYPE_INT:
        return "int"
    return type_string(typeof(value))

func compare(op: Variant.Operator) -> bool:
    return op == Variant.Operator.OP_EQUAL

func pressed(key: Key) -> bool:
    return key == Key.KEY_A
