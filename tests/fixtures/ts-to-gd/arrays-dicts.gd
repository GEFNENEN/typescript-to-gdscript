class_name MyClass
extends Node

var scores: Array[int] = []
var names: Array[String] = []
var nodes: Array[Node2D] = []

func test_arrays():
	var numbers = [1, 2, 3, 4, 5]
	var first = numbers[0]
	var length = numbers.size()
	numbers.append(6)
	numbers.remove_at(0)
	for n in numbers:
		print(n)

func total(values: Array[float]) -> float:
	var sum = 0.0
	for v in values:
		sum += v
	return sum

func test_dictionaries():
	var dict = {
		"name": "Player",
		"health": 100,
		"alive": true,
	}
	var player_name = dict.get("name")
	dict["score"] = 9001
