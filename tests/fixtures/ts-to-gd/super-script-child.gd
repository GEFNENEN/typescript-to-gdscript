# Imported script base: the constructor call and the method call go out
# as written, and both reach code the parent declares.
class_name SuperScriptChild
extends SuperScriptParent

func _init(hp: int):
    super(hp)

func hook(x: int) -> int:
    return super.hook(x) + 1
