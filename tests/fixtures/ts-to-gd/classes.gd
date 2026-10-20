class_name Animal
extends RefCounted

var name: String = ""
var sound: String = ""

func _init(name: String, sound: String):
    self.name = name
    self.sound = sound

func speak() -> String:
    return self.name + " says " + self.sound
