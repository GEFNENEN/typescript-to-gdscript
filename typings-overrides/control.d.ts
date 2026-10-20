/**
 * Override: Control — engine-serialized-only properties.
 *
 * `layout_mode` and `anchors_preset` are absent from `Control.xml` because
 * they exist for the editor and for scene serialization: Godot writes them
 * into `.tscn` files, and `layout_mode` is also settable from code to switch a
 * control between container-managed and manually-placed layouts. The property
 * list never mentions them, so the generated typings omit them.
 *
 * `Control.anchors_preset` is read and written with the bare `PRESET_*`
 * constants (see `typings/globals/global-enums.d.ts`).
 */
declare class Control {
  /** Minimum size of the node's bounding rectangle. Editor/serialization property (absent from `Control.xml`). */
  layout_mode: int;
  /** Preset anchor configuration, serialized by the editor. Editor/serialization property (absent from `Control.xml`). */
  anchors_preset: int;
}
