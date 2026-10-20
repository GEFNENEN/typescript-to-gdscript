/**
 * Global enum constants.
 *
 * GDScript exposes enum members as bare global names (`CONNECT_ONE_SHOT`),
 * while the generated class typings only declare them as statics
 * (`Object.CONNECT_ONE_SHOT`). The four families below are the ones GDScript
 * code reaches for by bare name; declaring them keeps that style type-checked.
 *
 * Hand-written here rather than in `typings-overrides/_globals.d.ts` because
 * the generator only substitutes `declare function` declarations in the
 * generated globals file (`applyGlobalOverrides`), so a `declare const` block
 * in that override file would be dropped.
 */

/** `Object.ConnectFlags` */
declare const CONNECT_DEFERRED: int;
declare const CONNECT_PERSIST: int;
declare const CONNECT_ONE_SHOT: int;
declare const CONNECT_REFERENCE_COUNTED: int;
declare const CONNECT_APPEND_SOURCE_OBJECT: int;

/** `Control.GrowDirection` */
declare const GROW_DIRECTION_BEGIN: int;
declare const GROW_DIRECTION_END: int;
declare const GROW_DIRECTION_BOTH: int;

/** `TextureRect.StretchMode` */
declare const STRETCH_SCALE: int;
declare const STRETCH_TILE: int;
declare const STRETCH_KEEP: int;
declare const STRETCH_KEEP_CENTERED: int;
declare const STRETCH_KEEP_ASPECT: int;
declare const STRETCH_KEEP_ASPECT_CENTERED: int;
declare const STRETCH_KEEP_ASPECT_COVERED: int;

/** `Control.LayoutPreset` */
declare const PRESET_TOP_LEFT: int;
declare const PRESET_TOP_RIGHT: int;
declare const PRESET_BOTTOM_LEFT: int;
declare const PRESET_BOTTOM_RIGHT: int;
declare const PRESET_CENTER_LEFT: int;
declare const PRESET_CENTER_TOP: int;
declare const PRESET_CENTER_RIGHT: int;
declare const PRESET_CENTER_BOTTOM: int;
declare const PRESET_CENTER: int;
declare const PRESET_LEFT_WIDE: int;
declare const PRESET_TOP_WIDE: int;
declare const PRESET_RIGHT_WIDE: int;
declare const PRESET_BOTTOM_WIDE: int;
declare const PRESET_VCENTER_WIDE: int;
declare const PRESET_HCENTER_WIDE: int;
declare const PRESET_FULL_RECT: int;

/** `Control.LayoutPresetMode` */
declare const PRESET_MODE_MINSIZE: int;
declare const PRESET_MODE_KEEP_WIDTH: int;
declare const PRESET_MODE_KEEP_HEIGHT: int;
declare const PRESET_MODE_KEEP_SIZE: int;
