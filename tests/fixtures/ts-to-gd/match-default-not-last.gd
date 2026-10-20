class_name MatchDefaultNotLast
extends Node

# `default` becomes `_`, which matches everything, so in GDScript it
# has to come last or nothing below it can run. TypeScript reaches
# `default` only when no `case` matches, wherever it sits, so moving
# the branch to the end is what preserves the meaning.
func first(value: int):
    match value:
        2:
            print("two")
        3:
            print("three")
        _:
            print("other")

# `default` inside a run of empty clauses stacks onto the body below
# it, so the whole run is one `_` branch — and that branch moves.
func in_run(value: int):
    match value:
        3:
            print("three")
        _:
            print("two")

# `default` and everything after it are empty, so the run collapses
# to a bodyless `_`. Already last; nothing to move.
func trailing_empty(value: int):
    match value:
        1:
            print("one")
        _:
            pass

# A comment attached to the moved branch travels with it.
func with_comment(value: int):
    match value:
        1:
            print("one")
        # about the fallback
        _:
            print("other")
