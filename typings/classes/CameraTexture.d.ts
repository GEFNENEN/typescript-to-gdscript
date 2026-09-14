// AUTO-GENERATED from Godot class documentation.
// Manual overrides applied from typings-overrides/*.d.ts

/** Texture provided by a {@link CameraFeed}. */
declare class CameraTexture extends Texture2D {
  /** The ID of the {@link CameraFeed} for which we want to display the image. */
  camera_feed_id: int;
  /** Convenience property that gives access to the active property of the {@link CameraFeed}. */
  camera_is_active: boolean;
  resource_local_to_scene: boolean;
  /**
   * Which image within the {@link CameraFeed} we want access to, important if the camera image is split in a Y and CbCr component.
   */
  which_feed: int;
  set_camera_feed_id(value: int): void;
  get_camera_feed_id(): int;
  set_camera_active(value: boolean): void;
  get_camera_active(): boolean;
  set_which_feed(value: int): void;
  get_which_feed(): int;
}
