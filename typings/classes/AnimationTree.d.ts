// AUTO-GENERATED from Godot class documentation.
// Manual overrides applied from typings-overrides/*.d.ts

/** A node used for advanced animation transitions in an {@link AnimationPlayer}. */
declare class AnimationTree extends AnimationMixer {
  /**
   * The path to the {@link Node} used to evaluate the {@link AnimationNode} {@link Expression} if one is not explicitly specified internally.
   */
  advance_expression_base_node: NodePath;
  /** The path to the {@link AnimationPlayer} used for animating. */
  anim_player: NodePath;
  callback_mode_discrete: int;
  deterministic: boolean;
  /** The root animation node of this {@link AnimationTree}. See {@link AnimationRootNode}. */
  tree_root: AnimationRootNode | null;
  set_advance_expression_base_node(value: NodePath | string): void;
  get_advance_expression_base_node(): NodePath;
  set_animation_player(value: NodePath | string): void;
  get_animation_player(): NodePath;
  set_tree_root(value: AnimationRootNode | null): void;
  get_tree_root(): AnimationRootNode | null;

  /** Returns the process notification in which to update animations. */
  get_process_callback(): int;
  /** Sets the process notification in which to update animations. */
  set_process_callback(mode: int): void;

  /** Emitted when the {@link anim_player} is changed. */
  animation_player_changed: Signal<[]>;

  // enum AnimationProcessCallback
  static readonly ANIMATION_PROCESS_PHYSICS: int;
  static readonly ANIMATION_PROCESS_IDLE: int;
  static readonly ANIMATION_PROCESS_MANUAL: int;
}
