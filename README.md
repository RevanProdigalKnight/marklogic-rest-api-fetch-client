# MarkLogic REST API fetch client

A client for the MarkLogic Server REST API using the browser `fetch` API, intended to be run in modern web browsers/Deno.

This library is not feature complete, but should be capable of performing the most common MarkLogic REST API operations, including basic searches and document retrieval/modification. It is also capable of performing some less-used tasks which were prioritized by an internal project, including but not limited to setting/up modifying Flexible Replication and Alert configurations.

Pull requests to add missing functionality are welcome.

Documentation and unit tests are unfortunately sparse at the moment as I was a bit rushed turning this into a public project compared to what I had originally planned.

## Usage

Basic usage is as simple as importing the main `mod.ts` file and creating a client instance

```ts
import MarkLogicRestAPIClient, { Region } from 'https://raw.githubusercontent.com/RevanProdigalKnight/marklogic-rest-api-fetch-client/main/src/mod.ts';

const client = new MarkLogicRestAPIClient();

async function simpleWordQueryWithDocumentsAttachedToResults(query: string) {
  const page = await client.search(query, { pageLength: 20, start: 21 }).then(resp => resp.json());

  const resultDocuments = await client.getDocuments(page.results.map(result => result.uri)).then(docs => docs.map(doc => doc.json()));

  return [...page.results.map((result, idx) => ({
    ...result,

    document: resultDocuments[idx],
  }))];
}

async function geoQueryWithDocumentsAttachedToResults(query: string, regions: Region[]) {
  const qb = new api.QueryBuilder();

  const geoQuery = qb.where(qb.or(...regions.map(region => qb.geospatial(
    qb.geoPropertyPair('Location', 'latitude', 'longitude'),
    undefined,
    undefined,
    undefined,
    region,
  ))));

  const page = await client.structuredQuery(geoQuery, { pageLength: 20, start: 21, q: query });

  const resultDocuments = await client.getDocuments(page.results.map(result => result.uri)).then(docs => docs.map(doc => doc.json()));

  return [...page.results.map((result, idx) => ({
    ...result,

    document: resultDocuments[idx],
  }))];
}
```

## Advanced Usage

### Client Options

All client constructor options are optional.

| Name             | Type                    | Default     | Description                                                                                      |
| ----------------:|:-----------------------:|:-----------:|:------------------------------------------------------------------------------------------------ |
| `auth`           | `string \| AuthOptions` | `'none'`    | Authorization method/options. More below under [Authorization Handlers](#authorization-handlers) |
| `baseURI`        | `string`                | `'/'`       | The base URI to use in order to construct dynamic paths                                          |
| `defaultHeaders` | `HeadersInit`           | `{}`        | Default headers to include on all requests                                                       |
| `logger`         | `ConsoleLike`           |             | Logger object with `log`, `info`, `warn`, `error`, `debug`, and `trace` methods                  |

In order to use client options, pass an object containing the keys you want to use something other than the default, e.g.:

```ts
import MarkLogicRestAPIClient from 'https://raw.githubusercontent.com/RevanProdigalKnight/marklogic-rest-api-fetch-client/main/src/mod.ts';

const client = new MarkLogicRestAPIClient({
  baseURI: 'https://some.hostname/mldb:8011',     // Interact with a MarkLogic Server instance running on a different host
  defaultHeaders: { Accept: 'application/json' }, // Try to get response as JSON whenever possible, by default
  logger: new Logger({ level: 'info' }),          // Custom logger instance
});

```

### Authorization Handlers

By default, the `MarkLogicRestAPIClient` does not attempt to add authorization to any of the requests it makes. It was originally intended to only run in a browser against a server which would proxy API requests using a JWT.

As part of the separation effort where I am bringing this client out of the project it was developed as a part of, I have added authorization handling for Basic and Digest authorization schemes; this is meant primarily for running the client directly in Deno, but can be used in the browser as well.

#### Basic Authorization Example

```ts
import MarkLogicRestAPIClient from 'https://raw.githubusercontent.com/RevanProdigalKnight/marklogic-rest-api-fetch-client/main/src/mod.ts';

const client = new MarkLogicRestAPIClient({ auth: 'basic' });

await client.login('your_username', 'your_password');

// Client operations...

await client.logout(); // Forgets the session
```

#### Digest Authorization Example

```ts
import MarkLogicRestAPIClient from 'https://raw.githubusercontent.com/RevanProdigalKnight/marklogic-rest-api-fetch-client/main/src/mod.ts';

const client = new MarkLogicRestAPIClient({
  auth: {
    method: 'digest',
    options: { // This and all sub-properties are entirely optional. Defaults are shown here.
      algorithm:       'MD5',     // or 'MD5-sess'. Any other value here will be ignored and MD5 will be used instead
      cnonceSize:      32,        // Any integer (floating-point numbers are coerced to integers)
      logger:          undefined, // Any Console-like object offering the following methods: `log`, `info`, `warn`, `error`, `debug`, and `trace`
      precomputedHash: false,
    },
  },
});

// Alternatively, if you don't want/need to provide custom options:
const client = new MarkLogicRestAPIClient({ auth: 'digest' });

await client.login('your_username', 'your_password');

// Client operations...

await client.logout(); // Forgets the session, username, and password
```

### Custom Endpoint Handlers

MarkLogic Server offers the ability to extend the standard REST API with custom endpoints.

In order to facilitate communicating with custom REST endpoints, the client is equipped with a `.withCustomEndpoint` method, which takes two arguments:

1. The path to the custom endpoint; and
2. A function which takes an EndpointBuilder object (which is pre-initialized with the path given as the first argument) and returns an object containing methods

The methods contained in the return value are added to the `customMethods` member of the client. This method is chainable.

Usage is as follows:

```ts
import MarkLogicRestAPIClient, { EndpointBuilder } from 'https://raw.githubusercontent.com/RevanProdigalKnight/marklogic-rest-api-fetch-client/main/src/mod.ts';

const client = new MarkLogicRestAPIClient()
  .withCustomEndpoint('./countDocumentsInDb.xqy', function(this: MarkLogicRestAPIClient, endpointBuilder: EndpointBuilder) {
    interface CountDocumentsParameters {
      readonly db: number | string;
    }

    // Example custom endpoint: ./countDocumentsInDb.xqy
    //   Parameters:
    //     - database name/ID
    //   Returns:
    //     - count of documents in that database
    //
    //   Example call:
    //     GET   https://your.hostname:port/countDocumentsInDb.xqy?db=18765787687 => 5287697
    const endpoint = endpointBuilder
      .withGet<CountDocumentsParameters, number>()
      .build();

    return {
      countDocuments(db: CountDocumentsParameters['db']): Promise<number> {
        return endpoint.get({ db }).then(resp => resp.json());
      },
    };
  })
  .withCustomEndpoint('./performWorkOnDocument.sjs', function(this: MarkLogicRestAPIClient, endpointBuilder: EndpointBuilder) {
    interface Work { /* ... */ }

    interface PerformWorkOnDocumentsParameters {
      readonly db: number | string;
      readonly documents: string[] | void;
    }

    // Example custom endpoint: ./performWorkOnDocument.sjs
    //   Parameters:
    //     - database name/id
    //     - document URI or multiple document URIs. If no document URIs specified, creates a new document using `work` as the basis
    //     - work to perform on document(s), taken from request body
    //   Returns:
    //     - nothing if document URIs were specified, otherwise the new document URI
    //
    //   Example call:
    //     PATCH https://your.hostname:port/performWorkOnDocument.sjs?db=Documents&documents=test.json&documents=config.json&...&documents=documentN.json { ...work... }
    //     POST  https://your.hostname:port/performWorkOnDocument.sjs?db=Modules { ...work... } => /some/new/document.json
    const endpoint = endpointBuilder
      .withPatch<PerformWorkOnDocumentsParameters, void>()
      .withPost<PerformWorkOnDocumentsParameters, string>()
      .build();

    const performWork = async (work: Work, db: PerformWorkOnDocumentsParameters['db'] = 'Documents', documents: string[]) Promise<unknown[]> => {
      let docs = documents;

      if (!documents.length) {
        docs = [await endpoint.post({ db }, { data: work }).then(resp => resp.json())];
      } else {
        await endpoint.patch({ db, documents }, { data: work });
      }

      return this.getDocuments(docs).then(docs => docs.map(doc => doc.json()));
    }

    return {
      performWorkOnDocuments(work: Work, ...documents: string[]): Promise<unknown[]> {
        return performWork(work, undefined, documents);
      },
      performWorkOnDocumentsInDatabase(database: PerformWorkOnDocumentsParameters['db'], work: Work, ...documents): Promise<unknown[]> {
        return performWork(work, database, documents);
      }
    };
  });

client.customMethods.countDocuments('Documents');
client.customMethods.performWorkOnDocuments({ /* ... */ }, ['test.json']);
client.customMethods.performWorkOnDocumentsInDatabase('Modules', { /* ... */ }, ['config.json']);
```

## Areas for improvement/expansion

As noted above, this library is not feature-complete across the entire MarkLogic Server REST API, and many endpoints have not been implemented. The following categories have limited support:

- [Search](https://docs.marklogic.com/REST/client/search) (Has: Search; Missing: QBE, Suggest, Values)

And these have no implementation at all:

- [Alerting](https://docs.marklogic.com/REST/client/alerting)
- [Configuration](https://docs.marklogic.com/REST/client/configuration)
- [Row Management](https://docs.marklogic.com/REST/client/row-management)
- [Service Extensions](https://docs.marklogic.com/REST/client/service-extension)
- [Service Management](https://docs.marklogic.com/REST/client/service-management)
- [Configuration Management API](https://docs.marklogic.com/REST/configuration-management-api)
- [Management API](https://docs.marklogic.com/REST/management)
  - [Admin](https://docs.marklogic.com/REST/management/admin)
  - [App Servers](https://docs.marklogic.com/REST/management/app-servers)
  - [Clusters](https://docs.marklogic.com/REST/management/clusters)
  - [Database Rebalancer](https://docs.marklogic.com/REST/management/database-rebalancer)
  - [Forests](https://docs.marklogic.com/REST/management/forests)
  - [Groups](https://docs.marklogic.com/REST/management/groups)
  - [Hosts](https://docs.marklogic.com/REST/management/hosts)
  - [Meters](https://docs.marklogic.com/REST/management/meters)
  - [Mimetypes](https://docs.marklogic.com/REST/management/mimetypes)
  - [Requests](https://docs.marklogic.com/REST/management/requests)
  - [Scheduled Tasks](https://docs.marklogic.com/REST/management/scheduled-tasks)
  - [Security](https://docs.marklogic.com/REST/management/security)
  - [SQL Schemas and Views](https://docs.marklogic.com/REST/management/sql-schemas-and-views)
  - [Support](https://docs.marklogic.com/REST/management/support)
  - [Temporal](https://docs.marklogic.com/REST/management/temporal)
  - [Tickets](https://docs.marklogic.com/REST/management/tickets)
  - [Transactions](https://docs.marklogic.com/REST/management/transactions)

In addition to the broad API categories that have not yet been implemented, there are known deficiencies in some of the library's utility classes:

- Query Builder, which is only partially completed
- CTS Query Builder, Plan Builder, Values Builder (& their respective utilities) have not been implemented at all
- XML Patch builder is currently only compatible with browsers - [`XMLSerializer`](https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer) does not exist in Deno (yet?)
