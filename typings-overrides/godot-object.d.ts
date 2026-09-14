/**
 * Override: GodotObject — typed get_meta, call, emit_signal.
 */
declare class GodotObject {
  get_meta<T = unknown>(name: string, default_?: T): T;
  call<N extends string, A extends any[], R>(
    this: Record<N, (...args: A) => R>,
    method: N,
    ...args: A
  ): R;
  call(method: string, ...args: any[]): unknown;
  call_deferred<N extends string, A extends any[], R>(
    this: Record<N, (...args: A) => R>,
    method: N,
    ...args: A
  ): R;
  call_deferred(method: string, ...args: any[]): unknown;
  callv<N extends string, A extends any[], R>(
    this: Record<N, (...args: A) => R>,
    method: N,
    args: A,
  ): R;
  callv(method: string, args: any[]): unknown;
  emit_signal<const N extends string, A extends any[]>(
    this: Record<N, Signal<A>>,
    signal: N,
    ...args: A
  ): Error.OK | Error.ERR_UNAVAILABLE;
  emit_signal(signal: string, ...args: any[]): Error.OK | Error.ERR_UNAVAILABLE;
  /**
   * Override: `get_script()` is documented as returning `Variant`, so the
   * generator maps it to `unknown` and every `.resource_path` / `.source_code`
   * read on the result fails. At runtime it returns the attached `Script`, or
   * `null` when there is none.
   */
  get_script(): Script | null;
  /**
   * Override: `Object.xml` states the `script` property "is not exposed like
   * most properties" and never lists it as a `<member>`, so the generated
   * typings omit it — yet GDScript accepts `node.script` directly (verified at
   * runtime), and the project reads it to assert a scene node is scripted.
   */
  script: Script | null;
  get<P extends keyof this>(property: P): this[P];
  get(property: string): unknown;
}
