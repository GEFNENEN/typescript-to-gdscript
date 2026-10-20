class_name MyClass
extends Node

var v1: Vector2 = Vector2(1, 2)
var v2: Vector2 = Vector2(3, 4)

func test_arithmetic():
    var a: int = 10
    var b: int = 3
    var sum = a + b
    var diff = a - b
    var prod = a * b
    var quot = a / b
    var remainder = a % b
    var power = a ** b

func test_comparison():
    var x: int = 5
    var is_equal = x == 5
    var not_equal = x != 3
    var greater = x > 3
    var less = x < 10
    var gte = x >= 5
    var lte = x <= 5

func test_logical():
    var a: bool = true
    var b: bool = false
    var and_result = a and b
    var or_result = a or b
    var not_result = not a

func test_assignment():
    var x: int = 10
    x += 5
    x -= 3
    x *= 2
    x /= 4
    x %= 3

func test_vector_math():
    var v1 = Vector2(1, 2)
    var v2 = Vector2(3, 4)
    var v3 = (v1 + v2)
    var v4 = (v1 * v2)
    var v5 = (v1 - v2)
    var vi1 = Vector2i(10, 20)
    var vi2 = Vector2i(3, 7)
    var vi3 = (vi1 % vi2)
    var vi4 = (vi1 % 3)

# `gd.ops` builds the operator expression itself, so an operand that is
# already infix has to be parenthesised — nothing in the TS source marks
# where it ends. Verified against Godot: `v * a + b` groups as `(v * a) + b`
# and `v * a if c else b` as `(v * a) if c else b`, both wrong.
func test_ops_operand_precedence(cond: bool, n):
    var v = Vector2(1, 2)
    var vi = Vector2i(3, 4)
    var binary = (v * (1.0 + 2.0))
    var ternary = (v * (1.0 if cond else 2.0))
    var cast = (v + (vi as Vector2))
    # A `!` is erased, so it hides nothing: the cast inside still regroups.
    var asserted = (v * (n as float))
    var plain = (v * 2.0)
    # A unary result is grouped too: bare, `-v.length()` negates the length.
    var flipped_length = (-v).length()

# Every compound assignment GDScript has, and `++` / `--` wherever the
# value is discarded — prefix included, which used to lose its step.
func test_compound_assignment() -> void:
    var k: int = 3
    k |= 8
    k &= 10
    k ^= 1
    k <<= 2
    k >>= 1
    k **= 2
    k += 1
    k -= 1
    # Parentheses around a statement change nothing.
    k += 1
    var i = 0
    while i < 3:
        print(i)
        i += 1

func test_array_concat():
    var a1 = [0, 1]
    var a2 = ["a", "b"]
    var a3 = (a1 + a2)

func test_multipple_vector_math():
    var v3 = ((self.v1 + self.v2) + self.v1)
    var v4 = ((self.v1 * self.v2) - self.v1)
    var v5 = ((self.v1 - (self.v2 * self.v2)) + (self.v1 / self.v2))
    var v6 = ((self.v1 * (2 * 1)) + (self.v1 / self.v2))
