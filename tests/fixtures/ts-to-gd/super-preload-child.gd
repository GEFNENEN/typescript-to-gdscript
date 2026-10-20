# A base named by path: `super(5)` goes out as written, and reaches the
# `_init` of the script at that path.
extends "res://super-script-parent.gd"

func _init():
    super(5)
