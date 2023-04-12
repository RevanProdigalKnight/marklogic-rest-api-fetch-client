import { /*beforeEach, afterEach, */describe, it } from 'https://deno.land/std@0.182.0/testing/bdd.ts';
import { expect } from 'https://deno.land/x/expect@v0.3.0/mod.ts';

import * as httpBodyUtils from '../src/HttpBodyUtils.ts';

const encoder = new TextEncoder();

/* START - IMPORTANT - DO NOT MODIFY THIS */
const knownGoodMultipartMixedBody = `
--BOUNDARY\r
Content-Type: application/xml\r
Content-Disposition: attachment; filename="doc1.xml"\r
Content-Length: 60\r
\r
<?xml version="1.0" encoding="UTF-8"?>
<root>some xml</root>\r
--BOUNDARY\r
Content-Type: application/json\r
Content-Disposition: attachment; filename="doc2.json"\r
Content-Length: 22\r
\r
{ "key": "some json" }\r
--BOUNDARY\r
Content-Type: application/xml\r
Content-Disposition: attachment; filename="doc3.xml"\r
Content-Length: 70\r
\r
<?xml version="1.0" encoding="UTF-8"?>
<root>some different xml</root>\r
--BOUNDARY--\r
`;
/* END - IMPORTANT - DO NOT MODIFY THIS */

async function expectDocumentToEqual(resp: Response, filename: string, textContent: string, subHeaders?: HeadersInit) {
  const contentDisposition = resp.headers.get('Content-Disposition');
  const expectedSubheaders = new Headers(subHeaders);

  expect(contentDisposition).toMatch(new RegExp(`^attachment; filename="${filename}"$`));
  expectedSubheaders.forEach((value, header) => {
    expect(resp.headers.get(header)).toEqual(value);
  });

  await expect(resp.text()).resolves.toEqual(textContent);
}

describe('parseMultipartMixed', () => {
  it('refuses to process non-multipart/mixed responses', async () => {
    const promise = httpBodyUtils.parseMultipartMixed(new Response(null, { headers: { 'Content-Type': 'application/json' } }));

    await expect(promise).rejects.toThrow('Expected multipart/mixed response, got "application/json"!');
  });

  it('rejects if the boundary cannot be determined from the Content-Type header', async () => {
    const promise = httpBodyUtils.parseMultipartMixed(new Response(null, { headers: { 'Content-Type': 'multipart/mixed' } }));

    await expect(promise).rejects.toThrow('Unable to parse boundary from Content-Type header "multipart/mixed"');
  });

  it('parses multipart/mixed response into multiple sub-responses containing data from parts', async () => {
    const documents = await httpBodyUtils.parseMultipartMixed(new Response(knownGoodMultipartMixedBody, { headers: { 'Content-Type': 'multipart/mixed; boundary="BOUNDARY"' } }));

    expect(documents).toHaveLength(3);

    const [doc1, doc2, doc3] = documents;

    await expectDocumentToEqual(doc1, 'doc1.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<root>some xml</root>', { 'Content-Type': 'application/xml', 'Content-Length': '60' });
    await expectDocumentToEqual(doc2, 'doc2.json', '{ "key": "some json" }', { 'Content-Type': 'application/json', 'Content-Length': '22' });
    await expectDocumentToEqual(doc3, 'doc3.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<root>some different xml</root>', { 'Content-Type': 'application/xml', 'Content-Length': '70' });
  });
});

describe('createMultipartMixed', () => {
  it('takes multiple parts and creates a single body containing all of them if they are not empty', async () => {
    const { contentType, data } = await httpBodyUtils.createMultipartMixed({
      'doc1.json': { docNumber: 1 },
      'doc2.json': { docNumber: 2 },
    });

    expect(contentType).toMatch(/^multipart\/mixed; boundary=".*?"$/);
    expect(data).toBeInstanceOf(Uint8Array);

    const asResponse = new Response(data, { headers: { 'Content-Type': contentType } });
    const documents = await httpBodyUtils.parseMultipartMixed(asResponse);

    expect(documents).toHaveLength(2);

    const [doc1, doc2] = documents;

    await expectDocumentToEqual(doc1, 'doc1.json', JSON.stringify({ docNumber: 1 }), { 'Content-Type': 'application/json', 'Content-Length': '15' });
    await expectDocumentToEqual(doc2, 'doc2.json', JSON.stringify({ docNumber: 2 }), { 'Content-Type': 'application/json', 'Content-Length': '15' });
  });

  it('excludes empty keys from the object passed to it', async () => {
    const { contentType, data } = await httpBodyUtils.createMultipartMixed({
      'doc1.json': undefined,
      'doc2.json': null,
      'doc3.txt': 'some text',
      'empty.txt': '',
    });

    const asResponse = new Response(data, { headers: { 'Content-Type': contentType } });
    const documents = await httpBodyUtils.parseMultipartMixed(asResponse);

    expect(documents).toHaveLength(1);

    await expectDocumentToEqual(documents[0], 'doc3.txt', 'some text', { 'Content-Type': 'text/plain', 'Content-Length': '9' });
  });
});

describe('homogenizeBodyData', () => {
  it('prioritizes the `fetch` api\'s `body` property if present', async () => {
    const expectedBuf = new TextEncoder().encode('body').buffer;
    const actualBuf = await httpBodyUtils.homogenizeBodyData(expectedBuf, 'data');

    expect(actualBuf).toEqual(expectedBuf);

    const actualText = await httpBodyUtils.homogenizeBodyData('body', 'data');

    expect(actualText).toEqual(encoder.encode('body'));
  });

  it('does not modify string data', async () => {
    const expectedBuf = new TextEncoder().encode('data').buffer;
    const actualBuf = await httpBodyUtils.homogenizeBodyData(undefined, expectedBuf);

    expect(actualBuf).toEqual(expectedBuf);

    const actualText = await httpBodyUtils.homogenizeBodyData(undefined, 'data');

    expect(actualText).toEqual(encoder.encode('data'));
  });

  it('stringifies raw objects to JSON', async () => {
    const obj = { object: true, hasData: true, data: [1, 2, 3] };

    const actual = await httpBodyUtils.homogenizeBodyData(undefined, obj);

    expect(actual).toEqual(encoder.encode(JSON.stringify(obj)));
  });

  it('returns null if no valid body data was passed', async () => {
    expect(await httpBodyUtils.homogenizeBodyData(undefined, undefined)).toBe(null);
  });
});
