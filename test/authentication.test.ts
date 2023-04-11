import { beforeEach, afterEach, beforeAll, afterAll, describe, it } from 'https://deno.land/std@0.182.0/testing/bdd.ts';
import { assertSpyCalls, assertSpyCallArgs, stub, Stub } from 'https://deno.land/std@0.182.0/testing/mock.ts';
import { expect } from "https://deno.land/x/expect@v0.3.0/mod.ts";

import MarkLogicRestAPIClient, { AuthClientMethod, MarkLogicRestAPIClientOptions } from '../src/mod.ts';

const db_username = 'admin';
const db_password = 'admin';
const db_host = 'http://localhost:8011/';

const documentUri = 'THIS_DOCUMENT_SHOULDNT_EXIST_IN_THE_DATABASE_ALREADY_IF_IT_DOES_SOMETHING_WENT_WRONG.json';

/**
 * NOTE: Deno automatically opens response bodies upon receiving them, which goes against the `fetch` spec.
 *
 * The following automatically closes any unread response bodies when a test finishes.
 */
let fetchStub: Stub;
let responses: Response[];

beforeAll(() => {
  const globalFetch = fetch;

  fetchStub = stub(self, 'fetch', async (...a) => {
    const resp = await globalFetch(...a);

    responses.push(resp);

    return resp;
  });
});

afterAll(() => {
  fetchStub.restore();
});

beforeEach(() => {
  responses = [];
});

afterEach(() => {
  responses.forEach(resp => {
    if (!resp.bodyUsed) {
      resp.body?.cancel();
    }
  })
});
/* END - Automatic closing of unread response bodies */

describe('null auth client', () => {
  let client: MarkLogicRestAPIClient;

  beforeEach(async () => {
    client = new MarkLogicRestAPIClient({ baseURI: db_host });

    await client.login(db_username, db_password);
  });

  afterEach(async () => {
    await client.logout();
  });

  it('does not actually log in to db', async () => {
    const resp = await client.search('test');

    expect(resp.status).toBe(401);

    await resp.body?.cancel();
  });
});

const authClientSuite = (method: AuthClientMethod) => () => {
  it('refuses to construct if username or password are not given', () => {
    expect(() => new MarkLogicRestAPIClient({ auth: { method } })).toThrow('Missing username or password required in order to create auth client!');
    expect(() => new MarkLogicRestAPIClient({ auth: { method, username: 'test' } })).toThrow('Missing username or password required in order to create auth client!');
    expect(() => new MarkLogicRestAPIClient({ auth: { method, password: 'test' } })).toThrow('Missing username or password required in order to create auth client!');
  });

  it('fails to log in if username/password are invalid', async () => {
    const client = new MarkLogicRestAPIClient({ baseURI: db_host, auth: { method, username: 'test', password: 'test' } });

    await expect(client.login()).rejects.toThrow('Incorrect username/password!');
  });

  describe('with username/password provided', () => {
    let client: MarkLogicRestAPIClient;

    beforeEach(() => {
      client = new MarkLogicRestAPIClient({
        auth: { method, username: db_username, password: db_password, options: { logger: console } },
        baseURI: db_host,
        defaultHeaders: { Accept: 'application/json' },
      });
    });

    afterEach(async () => {
      await client.logout();
    });

    it('logs in to the database correctly', () => expect(client.login()).resolves.toBe(undefined));

    describe('when logged in', () => {
      beforeEach(async () => {
        await client.login();
      });

      it('is capable of running basic operations until logged out', async () => {
        const searchResultsResponse = await client.search('test');
        expect(searchResultsResponse.status).toBe(200);

        const searchResults = await searchResultsResponse.json();

        expect(searchResults.total).toBeGreaterThanOrEqual(0);
        if (searchResults.total) {
          expect(searchResults.results.length).toBeLessThanOrEqual(searchResults['page-length']);
        } else {
          expect(searchResults.results.length).toBe(0);
        }

        expect((await client.getDocument(documentUri)).status).toBe(404);

        const createDocumentResponse = await client.insertDocument(documentUri, { testDocument: true });
        expect(createDocumentResponse.status).toBe(201);

        const createdDocumentResponse = await client.getDocument(documentUri).then(resp => resp.json());
        expect(createdDocumentResponse).toEqual({ testDocument: true });

        const updateDocumentResponse = await client.updateDocument(documentUri, { testDocument: false });
        expect(updateDocumentResponse.status).toBe(204);

        const updatedDocumentResponse = await client.getDocument(documentUri).then(resp => resp.json());
        expect(updatedDocumentResponse).toEqual({ testDocument: false });

        const deleteDocumentResponse = await client.deleteDocument(documentUri);
        expect(deleteDocumentResponse.status).toBe(204);

        const deletedDocumentResponse = await client.getDocument(documentUri);
        expect(deletedDocumentResponse.status).toBe(404);
      });
    });

    it('logs out immediately when logout is called', async () => {
      await client.login();

      const resp1 = await client.search('test');
      expect(resp1.status).toBe(200);

      await client.logout();

      const resp2 = await client.search('test');
      expect(resp2.status).toBe(401);
    });
  });
};

describe('basic auth client', authClientSuite('basic'));
describe('digest auth client', authClientSuite('digest'));

describe('warnings', () => {
  let consoleWarnStub: Stub;

  beforeEach(() => {
    consoleWarnStub = stub(console, 'warn', () => {});
  });

  afterEach(() => {
    consoleWarnStub.restore();
  });

  const createClient = (auth: MarkLogicRestAPIClientOptions['auth']) => new MarkLogicRestAPIClient({
    auth: { username: 'test', password: 'test', ...auth, options: { logger: console, ...auth?.options } }
  });

  it('warns if trying to use an unknown auth method', () => {
    // @ts-ignore: Intentionally using unknown method to test warning
    createClient({ method: 'unknown' });

    assertSpyCalls(consoleWarnStub, 1);
    assertSpyCallArgs(consoleWarnStub, 0, ['Unknown auth method "unknown". Using null auth client.']);
  });

  it('digest client warns if trying to use an unknown algorithm', () => {
    createClient({ method: 'digest', options: { algorithm: 'unknown' } });

    assertSpyCalls(consoleWarnStub, 1);
    assertSpyCallArgs(consoleWarnStub, 0, ['Unsupported algorithm "unknown", will use MD5 instead']);
  });
});