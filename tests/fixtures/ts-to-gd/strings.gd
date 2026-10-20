class_name MyClass
extends Node

func test_strings():
    var simple: String = "Hello, World!"
    var with_quotes: String = "He said \"hi\""
    var concat = "Hello" + " " + "World"
    var template = "" + str(concat) + "! === " + str(simple)
    var sn = StringName("my_action")
    var np = NodePath("Sprite2D/AnimationPlayer")
    var unique = self.get_node("%UniqueNode")
