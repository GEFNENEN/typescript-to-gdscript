# A script base with a constructor of its own. Every `super` call that
# reaches it must survive into the .gd: GDScript runs no parent `_init`
# on its own, so a dropped call would silently skip this body.
class_name SuperScriptParent
extends RefCounted

var hp: int = 0

func _init(hp: int):
    self.hp = hp

func hook(x: int) -> int:
    return x
