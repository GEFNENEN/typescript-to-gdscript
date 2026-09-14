// AUTO-GENERATED from Godot class documentation.
// Manual overrides applied from typings-overrides/*.d.ts

/** Texture which displays the content of an external buffer. */
declare class ExternalTexture extends Texture2D {
  resource_local_to_scene: boolean;
  /** External texture size. */
  size: Vector2;
  set_size(value: Vector2 | Vector2i): void;

  /**
   * Returns the external texture ID.
   * Depending on your use case, you may need to pass this to platform APIs, for example, when creating an `android.graphics.SurfaceTexture` on Android.
   */
  get_external_texture_id(): int;
  /**
   * Sets the external buffer ID.
   * Depending on your use case, you may need to call this with data received from a platform API, for example, `SurfaceTexture.getHardwareBuffer()` on Android.
   */
  set_external_buffer_id(external_buffer_id: int): void;
}
