
export interface SimpleConsole {
  readonly log: Console['log'];
  readonly info: Console['info'];
  readonly warn: Console['warn'];
  readonly error: Console['error'];
  readonly debug: Console['debug'];
  readonly trace?: Console['trace'];
}
