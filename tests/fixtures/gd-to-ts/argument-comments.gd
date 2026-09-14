extends Node
class_name ArgumentComments


func _ready():
	# Comments between the arguments of a call that spans several lines must
	# not become part of the emitted argument list — GDScript also allows them
	# trailing a single argument.
	var total: float = _add(
		1.0,  # first operand
		2.0,  # second operand
	)
	var scaled: float = _scale(3.0, 4.0)  # trailing comment after the call
	var values: Array = [
		1,  # one
		2,  # two
	]


func _add(left: float, right: float) -> float:
	return left + right


func _scale(value: float, factor: float) -> float:
	return value * factor
