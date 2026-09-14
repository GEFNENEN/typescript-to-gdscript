/**
 * Override: Global functions — adds generic type parameters to polymorphic functions.
 */
declare function abs<
  T extends
    | int
    | float
    | Vector2
    | Vector2i
    | Vector3
    | Vector3i
    | Vector4
    | Vector4i,
>(x: T): T;

declare function ceil<
  T extends
    | int
    | float
    | Vector2
    | Vector2i
    | Vector3
    | Vector3i
    | Vector4
    | Vector4i,
>(x: T): T;

declare function clamp<T extends int | float>(value: T, min: T, max: T): T;

declare function floor<
  T extends
    | int
    | float
    | Vector2
    | Vector2i
    | Vector3
    | Vector3i
    | Vector4
    | Vector4i,
>(x: T): T;

declare function lerp<
  T extends
    | int
    | float
    | Vector2
    | Vector3
    | Vector4
    | Color
    | Quaternion
    | Basis
    | Transform2D
    | Transform3D,
>(from_: T, to: T, weight: float): T;

declare function load<P extends keyof GodotResources>(
  path: P,
): GodotResources[P];
declare function load<T extends Resource = any>(path: string): T;

declare function max<T extends int | float>(...args: T[]): T;

declare function min<T extends int | float>(...args: T[]): T;

declare function preload<P extends keyof GodotResources>(
  path: P,
): GodotResources[P];
declare function preload<T extends Resource = any>(path: string): T;

declare function range(end: int): Array<int>;
declare function range(begin: int, end: int): Array<int>;
declare function range(begin: int, end: int, step: int): Array<int>;

declare function round<
  T extends
    | int
    | float
    | Vector2
    | Vector2i
    | Vector3
    | Vector3i
    | Vector4
    | Vector4i,
>(x: T): T;

declare function sign<
  T extends
    | int
    | float
    | Vector2
    | Vector2i
    | Vector3
    | Vector3i
    | Vector4
    | Vector4i,
>(x: T): T;

declare function snapped<
  T extends
    | int
    | float
    | Vector2
    | Vector2i
    | Vector3
    | Vector3i
    | Vector4
    | Vector4i,
>(x: T, step: T): T;

declare function weakref(obj: GodotObject): WeakRef;

declare function wrap<T extends int | float>(value: T, min: T, max: T): T;

declare function assert(condition: boolean, message?: string): void;


/**
 * Global constants — Godot exposes these as bare global names in GDScript,
 * while the class typings only expose them as static members (e.g. Object.CONNECT_ONE_SHOT).
 * Expose the ones used with bare names so bare-style TS code type-checks.
 */
declare const CONNECT_DEFERRED: int;
declare const CONNECT_PERSIST: int;
declare const CONNECT_ONE_SHOT: int;
declare const CONNECT_REFERENCE_COUNTED: int;
declare const CONNECT_APPEND_SOURCE_OBJECT: int;

declare const GROW_DIRECTION_BEGIN: int;
declare const GROW_DIRECTION_END: int;
declare const GROW_DIRECTION_BOTH: int;

declare const STRETCH_SCALE: int;
declare const STRETCH_TILE: int;
declare const STRETCH_KEEP: int;
declare const STRETCH_KEEP_CENTERED: int;
declare const STRETCH_KEEP_ASPECT: int;
declare const STRETCH_KEEP_ASPECT_CENTERED: int;
declare const STRETCH_KEEP_ASPECT_COVERED: int;

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
declare const PRESET_MODE_MINSIZE: int;
declare const PRESET_MODE_KEEP_WIDTH: int;
declare const PRESET_MODE_KEEP_HEIGHT: int;
declare const PRESET_MODE_KEEP_SIZE: int;
declare const PRESET_FULL_RECT: int;
