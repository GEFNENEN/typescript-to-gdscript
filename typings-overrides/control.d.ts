/**
 * Override: Control — engine-serialized-only properties.
 *
 * `layout_mode` and `anchors_preset` are not exposed in `Control.xml` because
 * they exist purely for the editor / scene serialization: Godot writes them
 * into `.tscn` files (and `layout_mode` is also settable from code to switch a
 * control between container-managed and manually-placed layouts), but the
 * property list never mentions them, so the generated typings omit them.
 *
 * Real usage in this project: `Label.layout_mode = 1` and
 * `Control.anchors_preset = PRESET_FULL_RECT` / `PRESET_TOP_RIGHT`
 * (bare-name access inside a Control subclass). Both are plain `int` enum
 * values on the GDScript side, verified to work at runtime.
 */
declare class Control {
  /** Minimum size of the node's bounding rectangle. Editor/serialization property (absent from `Control.xml`). */
  layout_mode: int;
  /** Preset anchor configuration, serialized by the editor. Editor/serialization property (absent from `Control.xml`). */
  anchors_preset: int;
}
