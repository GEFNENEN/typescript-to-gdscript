# The base is the generated global wrapper, used without an import. The
# wrapper declares no constructor itself; `super(7)` still goes out as
# written, and reaches the `_init` of the script behind it.
class_name SuperGlobalChild
extends SuperScriptParent

func _init():
    super(7)
