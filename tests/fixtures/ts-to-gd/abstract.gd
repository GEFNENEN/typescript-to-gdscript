@abstract
class_name AbstractBase
extends Node

@abstract
class InnerAbstract:
    @abstract
    func do_something() -> void

@abstract
func process_item(item: String) -> String

func concrete_method():
    return 42
