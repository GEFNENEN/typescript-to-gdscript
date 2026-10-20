class_name MyClass
extends Node

# Variable declarations with types
var speed: float = 10.5
var health: int = 100
# Not `name`: Node already has that property and GDScript cannot
# redefine an inherited one.
var player_name: String = "Player"
var alive: bool = true
var position_2d: Vector2 = Vector2(0, 0)

func _ready():
    # Local variables
    var x: int = 5
    var y: float = 3.14
    var greeting: String = "hello"
    var flag: bool = false
    # Variable without explicit type (inferred)
    var result = x + y
    # Null value
    var node: Node = null
