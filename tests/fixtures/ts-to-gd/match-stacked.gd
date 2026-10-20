class_name MyClass
extends Node

var KIND_A: int = 1

func stacked(value: int) -> int:
    match value:
        1, 2:
            return 0
        3, 4:
            return 1
    return -1

func stacked_into_default(value: int):
    match value:
        _:
            print("rest")

func trailing_empty(value: int):
    match value:
        1:
            print("one")
        2:
            pass

# The shape `gd-to-ts` emits for a GDScript branch that has no
# statement: an explicit empty block keeps the case off the one
# below it, where a body-less `case` would stack onto it.
func blocked_empty_case(value: int):
    match value:
        1:
            pass
        2:
            # only a comment
            pass
        3:
            # a note above the statement
            print("three")
            # and one below it
        # An annotation attaches to the statement after it, so a branch
        # holding only one is still unfilled and needs `pass`.
        4:
            @warning_ignore("unused_variable")
            pass

func own_field_pattern(value: int):
    match value:
        KIND_A:
            print("a")

# A comment between two branches is leading trivia of the `case`
# below it. Nothing inside a branch body reaches it, so the branch
# itself has to emit it or it is dropped.
# 
# It lands in the pattern section, where GDScript takes no
# statement — so a block comment goes out as `#` here, not as the
# `"""..."""` it becomes in a body. A bare string there would parse
# as a pattern and take the branch's `:` with it.
func comment_between_branches(value: int):
    match value:
        # about the first branch
        1:
            print("one")
        # about the branch below
        2:
            print("two")
        # and one over
        # two lines
        3:
            print("three")

func loop_break_in_case(value: int):
    match value:
        1:
            var i: int = 0
            while i < 10:
                i += 1
                if i > 5:
                    break
            print(i)

func empty_switch(value: int):
    print("after")

func empty_switch_only(value: int):
    pass

# The discriminant goes with the dropped `switch`, side effects and
# all — `bump()` is never called in the GDScript, and nothing is
# reported. Accepted for now: an empty `switch` is dead code, and a
# branchless `match` does not parse.
func empty_switch_call(value: int):
    print("after")

func bump(value: int) -> int:
    return value + 1

func comment_only_if(value: int):
    if value > 0:
        # just a note
        pass

# GDScript has no multi-line comment, so each line gets its own
# `##`. Written as one line with newlines in it, everything after
# the first would sit at column 0 — ending the block, and reading
# as a statement to the `pass` check.
func doc_comment_only_if(value: int):
    if value > 0:
        ## just a note
        ## on two lines
        pass

# A comment after the last case's statements is trivia of the case
# block's `}` — there is no `case` below it to carry it.
func trailing_comment_in_case(value: int):
    match value:
        1:
            print("one")
            # trailing note

func empty_switch_in_if(value: int):
    if value > 0:
        pass

func trailing_comment_in_if(value: int):
    if value > 0:
        print("one")
        # trailing note

func match_empty_do(value: int):
    match value:
        1:
            pass
