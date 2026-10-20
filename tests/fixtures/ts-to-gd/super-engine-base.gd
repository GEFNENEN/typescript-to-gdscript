# A `super()` goes out as written, whatever the base. Directly under an
# engine class there is no parent `_init` for it to reach, and Godot
# reports that when it parses the script — so the converter adds no rule
# of its own (the Godot-validate runner expects exactly that error).
class_name SuperEngineBase
extends Node2D

func _init():
    super()
    print("built")
