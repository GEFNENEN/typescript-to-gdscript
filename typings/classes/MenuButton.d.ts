// AUTO-GENERATED from Godot class documentation.
// Manual overrides applied from typings-overrides/*.d.ts

/** A button that brings up a {@link PopupMenu} when clicked. */
declare class MenuButton extends Button {
  action_mode: int;
  flat: boolean;
  focus_mode: int;
  /** The number of items currently in the list. */
  item_count: int;
  /**
   * The checkable item type of the item at `index`.
   * **Note:** `index` is a value in the `0 .. item_count - 1` range.
   */
  'popup/item_{index}/checkable': int;
  /**
   * If `true`, the item at `index` is checked.
   * **Note:** `index` is a value in the `0 .. item_count - 1` range.
   */
  'popup/item_{index}/checked': boolean;
  /**
   * If `true`, the item at `index` is disabled.
   * **Note:** `index` is a value in the `0 .. item_count - 1` range.
   */
  'popup/item_{index}/disabled': boolean;
  /**
   * The icon of the item at `index`.
   * **Note:** `index` is a value in the `0 .. item_count - 1` range.
   */
  'popup/item_{index}/icon': Texture2D | null;
  /**
   * The ID of the item at `index`.
   * **Note:** `index` is a value in the `0 .. item_count - 1` range.
   */
  'popup/item_{index}/id': int;
  /**
   * If `true`, the item at `index` is a separator.
   * **Note:** `index` is a value in the `0 .. item_count - 1` range.
   */
  'popup/item_{index}/separator': boolean;
  /**
   * The text of the item at `index`.
   * **Note:** `index` is a value in the `0 .. item_count - 1` range.
   */
  'popup/item_{index}/text': string;
  /**
   * If `true`, when the cursor hovers above another {@link MenuButton} within the same parent which also has {@link switch_on_hover} enabled, it will close the current {@link MenuButton} and open the other one.
   */
  switch_on_hover: boolean;
  toggle_mode: boolean;
  set_item_count(value: int): void;
  get_item_count(): int;
  set_switch_on_hover(value: boolean): void;
  is_switch_on_hover(): boolean;

  /**
   * Returns the {@link PopupMenu} contained in this button.
   * **Warning:** This is a required internal node, removing and freeing it may cause a crash. If you wish to hide it or any of its children, use their {@link Window.visible} property.
   */
  get_popup(): PopupMenu;
  /** If `true`, shortcuts are disabled and cannot be used to trigger the button. */
  set_disable_shortcuts(disabled: boolean): void;
  /**
   * Adjusts popup position and sizing for the {@link MenuButton}, then shows the {@link PopupMenu}. Prefer this over using `get_popup().popup()`.
   */
  show_popup(): void;

  /** Emitted when the {@link PopupMenu} of this MenuButton is about to show. */
  about_to_popup: Signal<[]>;
}
