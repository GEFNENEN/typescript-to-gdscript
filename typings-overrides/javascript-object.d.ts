/**
 * Override: JavaScriptObject — declaration merging for third-party JS bridges.
 *
 * `JavaScriptBridge.get_interface()` returns a `JavaScriptObject` wrapping an
 * arbitrary host object, so the engine docs cannot describe its members. The
 * project's WeChat bridges read a handful of `wx.*` entries off it; declaring
 * them here keeps those access sites type-checked without loosening
 * `JavaScriptObject` itself to an index signature (which would silently accept
 * any typo anywhere else).
 *
 * Every member is `any`: the underlying values are host JavaScript objects or
 * functions whose shapes the engine cannot represent.
 */
declare class JavaScriptObject {
  /** WeChat mini-game: filesystem bridge readiness flag. */
  p7FsReady: any;
  /** WeChat mini-game: synchronous file existence check. */
  p7FsExists: any;
  /** WeChat mini-game: synchronous UTF-8 text read. */
  p7FsReadText: any;
  /** WeChat mini-game: synchronous UTF-8 text write. */
  p7FsWriteText: any;
  /** WeChat mini-game: `wx.env` host object (carries `USER_DATA_PATH`). */
  env: any;
  /** WeChat mini-game: app-hide lifecycle hook registration. */
  onHide: any;
  /** WeChat mini-game: rewarded-ad bridge availability flag. */
  p7RewardedAdReady: any;
  /** WeChat mini-game: create a rewarded-ad handle. */
  p7RewardedAdCreate: any;
  /** WeChat mini-game: show a rewarded-ad handle. */
  p7RewardedAdShow: any;
  /** WeChat mini-game: destroy a rewarded-ad handle. */
  p7RewardedAdDestroy: any;
}
