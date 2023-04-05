# MarkLogic REST API fetch client

A client for the MarkLogic REST API using the browser `fetch` API, intended to be run in modern web browsers/Deno.

This library is not feature complete, but should be capable of performing the most common MarkLogic REST API operations, including basic searches and document retrieval/modification. It is also capable of performing some less-used tasks which were prioritized by an internal project, including but not limited to setting/up modifying Flexible Replication and Alert configurations.

Pull requests to add missing functionality are welcome.

Documentation is unfortunately sparse at the moment as I was a bit rushed turning this into a public project compared to what I had originally planned.

## Usage

Basic usage is as simple as importing the main `mod.ts` file and creating a client instance

```ts
import MarkLogicRestAPIClient, { Region } from 'https://github.com/RevanProdigalKnight/marklogic-rest-api-fetch-client/src/mod.ts';

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

MarkLogic Server offers the ability to extend the standard REST API with custom endpoints.

In order to facilitate communicating with custom REST endpoints, the client is equipped with a `.withCustomEndpoint` method, which takes two arguments:

1. The path to the custom endpoint; and
2. A function which takes an EndpointBuilder object (which is pre-initialized with the path given as the first argument) and returns an object containing methods

The methods contained in the return value are added to the `customMethods` member of the client. This method is chainable.

Usage is as follows:

```ts
import MarkLogicRestAPIClient, { EndpointBuilder } from 'https://github.com/RevanProdigalKnight/marklogic-rest-api-fetch-client/src/mod.ts';

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
