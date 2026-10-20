class_name GetsetTest
extends Node

var a: int:
    get:
        return a
    set(value):
        a = value

var b: int = 10:
    get:
        return b
    set(value):
        b = value

var c: int:
    get = get_c, set = set_c

var d: int:
    get:
        return d
    set(value):
        d = value

var e: int:
    get:
        return e
    set(value):
        e = value

var f: float = self.e:
    get:
        return f

var g: int:
    set(value):
        g = value

var h: int:
    get:
        return h
    set(value):
        pass

var i: int:
    get:
        return i
    set(value):
        pass

var points: Array[int] = []

var j = self.points:
    get:
        return j

var names: Array[String] = []

var k = self.names:
    get:
        return k

var tint = {
    "r": 1.0,
}

var l = self.tint:
    get:
        return l

func get_c() -> int:
    return 10

func set_c(v: int):
    pass
