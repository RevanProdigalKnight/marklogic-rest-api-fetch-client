import { Md5 } from 'md5';

import type { SimpleConsole } from './UtilityTypes.ts';

export type AuthClientMethod = 'none' | 'basic' | 'digest';

export abstract class AuthClient {
  static create(method: AuthClientMethod, username = '', password = '', options?: DigestAuthClientOptions) {
    if (method !== 'none' && (!username || !password)) {
      throw new Error('Missing username or password required in order to create auth client!');
    }

    switch (method) {
      case 'basic': return new BasicAuthClient(username, password);
      case 'digest': return new DigestAuthClient(username, password, options as DigestAuthClientOptions);
      default:
        console.warn(`Unknown auth method "${method}". Using null auth client.`);
        /* falls through */
      case 'none': return new NullAuthClient();
    }
  }

  constructor(protected username = '', protected password = '') {}

  get isLoggedIn(): boolean {
    return false;
  }

  abstract login(uri: string | URL, username?: string, password?: string): void | Promise<void>;
  abstract logout(): void | Promise<void>;

  abstract getAuthHeader(uri: string | URL, method?: string, body?: string | ArrayBuffer | null): string | undefined;
  abstract parseAuthResponse(h?: string | null): boolean;
}

/** BEGIN - Null Auth Client */
class NullAuthClient extends AuthClient {
  get isLoggedIn() { return true; }

  login() {
    /* Do nothing */
  }

  logout() {
    /* Do nothing */
  }

  getAuthHeader() {
    return undefined;
  }

  parseAuthResponse() {
    return true;
  }
}
/** END - Null Auth Client */

/** BEGIN - Basic Auth Client */
class BasicAuthClient extends AuthClient {
  #auth = '';

  constructor(username: string, password: string) {
    super(username, password);

    this.#updateAuth(username, password);
  }

  get isLoggedIn() {
    return this.#auth !== '';
  }

  async login(uri: string | URL, username = this.username, password = this.password) {
    if (username !== this.username || password !== this.password) {
      this.username = username;
      this.password = password;

      this.#updateAuth(username, password);
    }

    const resp = await fetch(uri, { headers: { Authorization: this.#auth } });

    if (resp.status === 401) {
      this.logout();

      throw new Error('Incorrect username/password!');
    } else if (!resp.ok) {
      throw new Error(`An error occurred while attempting to log in: ${resp.statusText}`);
    }
  }

  logout() {
    this.username = '';
    this.password = '';
    this.#auth = '';
  }

  getAuthHeader() {
    return this.#auth;
  }

  parseAuthResponse() {
    return true;
  }

  #updateAuth(username: string, password: string) {
    this.#auth = `Basic ${btoa([username, password].join(':'))}`;
  }
}
/** END - Basic Auth Client */

/** BEGIN - Digest Auth Client */
function md5(data: string | ArrayBuffer) {
  const hasher = new Md5();

  hasher.update(data);

  return hasher.toString('hex');
}

type Algorithm = 'MD5' | 'MD5-sess';

const SUPPORTED_ALGORITHMS: Algorithm[] = ['MD5', 'MD5-sess'];

function parseFields(fields: string) {
  const res: string[] = [];

  let start = 0;
  let end = 0;

  const l = fields.length;

  while (end < l) {
    const c = fields.charAt(end);

    if (c === '"') {
      end = fields.indexOf('"', end + 1) + 1;
      const field = fields.slice(start, end);
      res.push(field);
      while ([',', ' '].includes(fields.charAt(++end)));
      start = end;
    } else if (c === ',') {
      const field = fields.slice(start, end);
      res.push(field);
      while ([',', ' '].includes(fields.charAt(++end)));
      start = end;
    }

    end++;
  }

  const finalField = fields.slice(start, end);
  if (finalField.length) {
    res.push(finalField);
  }

  return res;
}

function getField(fields: string[], field: string) {
  const rawField = fields.find(f => f.startsWith(field));

  if (!rawField) {
    return '';
  }

  const value = rawField.substring(field.length + 1);

  return value.startsWith('"')
    ? value.slice(value.indexOf('"') + 1, value.length - 1).trim()
    : value;
}

function field(fieldName: string, fieldValue = '') {
  return `${fieldName}="${fieldValue}"`;
}

const NONCE_CHARS = 'abcdef0123456789';

class Digest {
  static #parseQop(qop?: string) {
    if (qop) {
      const qops = qop.split(',');
      if (qops.includes('auth')) {
        return 'auth';
      }
      if (qops.includes('auth-int')){
        return 'auth-int';
      }
    }

    return undefined;
  }

  static #makeNonce(size: number) {
    const nonce: string[] = [];

    for (let i = 0; i < size; i++) {
      nonce.push(NONCE_CHARS[Math.floor(Math.random() * NONCE_CHARS.length)]);
    }

    return nonce.join('');
  }

  readonly #cnonceSize: number;

  nc = 0;
  realm = '';

  nonce?: string;
  cnonce?: string;
  qop?: string;
  opaque?: string;
  scheme?: string;

  constructor(readonly algorithm: Algorithm, cnonceSize: number) {
    this.#cnonceSize = cnonceSize;
  }

  update(h?: string | null) {
    if (h) {
      const [scheme, allFields] = h.split(/(?<!,) /);
      const fields = parseFields(allFields);

      this.scheme = scheme;
      this.realm = getField(fields, 'realm');
      this.qop = Digest.#parseQop(getField(fields, 'qop'));
      this.opaque = getField(fields, 'opaque');
      this.nonce = getField(fields, 'nonce');
      this.cnonce = Digest.#makeNonce(this.#cnonceSize);
    }

    this.nc++;
  }

  reset() {
    this.nc = 0;
    this.realm = '';

    this.nonce = undefined;
    this.cnonce = undefined;
    this.qop = undefined;
    this.opaque = undefined;
    this.scheme = undefined;
  }
}

interface DigestAuthClientOptions {
  readonly logger?: SimpleConsole;
  readonly precomputedHash?: boolean;
  readonly algorithm?: Algorithm;
  readonly cnonceSize?: number;
}

class DigestAuthClient extends AuthClient {
  static #hash(...fields: (string | undefined)[]) {
    return md5(fields.filter(Boolean).join(':'));
  }

  readonly #digest: Digest;
  readonly #logger?: SimpleConsole;
  readonly #precomputedHash: boolean;

  #hasAuth = false;

  constructor(user: string, password: string, options?: DigestAuthClientOptions) {
    super(user, password);

    this.#logger = options?.logger;
    this.#precomputedHash = options?.precomputedHash ?? false;

    let algorithm = options?.algorithm ?? 'MD5';
    if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
      this.#logger?.warn(`Unsupported algorithm "${algorithm}", will use MD5 instead`);
      algorithm = 'MD5';
    }

    this.#digest = new Digest(algorithm, Math.floor(options?.cnonceSize ?? 32));
  }

  get isLoggedIn() {
    return this.#hasAuth;
  }

  async login(uri: string | URL, username = this.username, password = this.password) {
    if (username !== this.username && password !== this.password) {
      this.username = username;
      this.password = password;

      this.#hasAuth = false;
    }

    const initResp = await fetch(uri);

    this.parseAuthResponse(initResp.headers.get('WWW-Authenticate'));

    if (initResp.status === 401) {
      if (this.#hasAuth) {
        const finalResp = await fetch(uri, { headers: { Authorization: this.getAuthHeader(uri) } });

        if (finalResp.status === 401) {
          this.logout();

          throw new Error('Incorrect username/password!');
        } else if (!finalResp.ok) {
          throw new Error(`An error occurred while attempting to log in: ${finalResp.statusText}`);
        }

        this.#digest.update();
      }
    }
  }

  logout() {
    this.username = '';
    this.password = '';
    this.#digest.reset();
  }

  getAuthHeader(uri: string | URL, method?: string, body: string | ArrayBuffer = '') {
    const hash = DigestAuthClient.#hash;

    const { pathname, search } = new URL(uri);
    const path = pathname + search;

    let ha1 = this.#precomputedHash ? this.password : hash(this.username, this.#digest.realm, this.password);
    if (this.#digest.algorithm === 'MD5-sess') {
      ha1 = hash(ha1, this.#digest.nonce, this.#digest.cnonce);
    }

    const hashedBody = this.#digest.qop === 'auth-int' ? md5(body) : '';
    const ha2 = hash(method?.toUpperCase() ?? 'GET', path, hashedBody);

    const ncString = this.#digest.nc.toString().padStart(8, '0');

    const response = hash(...this.#digest.qop
      ? [ha1, this.#digest.nonce, ncString, this.#digest.cnonce, this.#digest.qop, ha2]
      : [ha1, this.#digest.nonce, ha2]
    );

    return [
      this.#digest.scheme,
      [
        field('username', this.username),
        field('realm', this.#digest.realm),
        field('nonce', this.#digest.nonce),
        field('uri', path),
        this.#digest.opaque ? field('opaque', this.#digest.opaque) : '',
        this.#digest.qop ? field('qop', this.#digest.qop) : '',
        field('algorithm', this.#digest.algorithm),
        field('response', response),
        `nc=${ncString}`,
        field('cnonce', this.#digest.cnonce),
      ].filter(Boolean).join(','),
    ].join(' ');
  }

  parseAuthResponse(h?: string | null) {
    if (h && h.length < 5) {
      this.#hasAuth = false;
    } else {
      this.#hasAuth = true;

      this.#digest.update(h);
    }

    return this.#hasAuth;
  }
}
/** END - Digest Auth Client */
