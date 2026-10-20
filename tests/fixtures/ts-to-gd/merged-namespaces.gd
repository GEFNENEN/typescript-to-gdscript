class_name Merged
extends Node

const FIRST = 1

enum Palette { RED, BLUE }

const SECOND = 2

class Inner:
    const TAG = "inner"
    var value: int = 0

var first: int = Merged.FIRST
var second: int = Merged.SECOND
var color: Palette = Merged.Palette.RED

func pick():
    return self.FIRST + self.SECOND
