export type MaybeArray<T> = T | T[];

export type primitive = string | bigint | number | boolean | null | undefined;

export interface SimpleConsole {
  readonly log: Console['log'];
  readonly info: Console['info'];
  readonly warn: Console['warn'];
  readonly error: Console['error'];
  readonly debug: Console['debug'];
  readonly trace?: Console['trace'];
}
