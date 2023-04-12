import { getMimetypeForFilename } from './MimetypeUtils.ts';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const crlf = '\r\n';

const cr = crlf.charCodeAt(0);
const lf = crlf.charCodeAt(1);

const headerBodyBoundary = encoder.encode(crlf.repeat(2));

const boundaryGenerationBuffer = new Uint8Array(16);

export function homogenizeBodyData(body?: BodyInit | null, data?: unknown): Promise<ArrayBuffer | Uint8Array | null> {
  if (typeof body === 'string') {
    return Promise.resolve(encoder.encode(body));
  } else if (body) {
    return new Response(body).arrayBuffer();
  } else if (typeof data === 'string') {
    return Promise.resolve(encoder.encode(data));
  } else if (
    ArrayBuffer.isView(data) ||
    data instanceof ReadableStream ||
    data instanceof ArrayBuffer ||
    data instanceof Blob ||
    data instanceof File ||
    data instanceof FormData
  ) {
    return new Response(body).arrayBuffer();
  } else if (data !== undefined) {
    return Promise.resolve(encoder.encode(JSON.stringify(data)));
  }

  return Promise.resolve(null);
}

export function *httpBodyLineReader(buf: Uint8Array): Generator<Uint8Array, Uint8Array, number | undefined> {
  let start = 0;
  let end = 0;

  const l = buf.length;

  while (end < l) {
    if (buf[end] === cr && buf[end + 1] === lf) {
      const length = yield buf.subarray(start, end);

      start = end + 2;
      end = start;

      if (length) {
	      if (start + length < l) {
	      	end = start + length;

	        yield buf.subarray(start, end);

	        start = end + 2;
	        end = start;
	      } else {
	        throw new Error(`Cannot return next ${length} bytes, not enough remaining in buffer!`);
	      }
	    }
    } else {
      end++;
    }
  }

  return buf.subarray(start, end);
}

export function parseMultipartMixedBody(boundary: string, body: ArrayBuffer) {
  const buf = new Uint8Array(body);
  const attachments = [];

  let contentLength = 0;
  let rawHeaders = [];
  let rawBody: Uint8Array | null = null;

  const lineReader = httpBodyLineReader(buf);
  let lineNo = 0;
  for (const rawLine of lineReader) {
    const line = decoder.decode(rawLine);
    lineNo++;

    if (line.startsWith('--' + boundary)) { // Boundary between attachments
      if (lineNo === 1) {
        continue;
      }

      attachments.push(new Response(rawBody, { headers: new Headers(rawHeaders) }));
      rawHeaders = [];
      contentLength = 0;
      rawBody = null;

      if (line.endsWith('--')) { // End of multipart/mixed
      	break;
      }
    } else if (line === '') { // Blank line between headers and content
      rawBody = lineReader.next(contentLength).value;
    } else { // Attachment header
    	const colonIdx = line.indexOf(':');
    	const headerName = line.slice(0, colonIdx).trim();
    	const headerValue = line.slice(colonIdx + 1).trim();

      rawHeaders.push([headerName, headerValue]);

      if (headerName.toLowerCase() === 'content-length') {
        contentLength = Number.parseInt(headerValue, 10);
      }
    }
  }

  return attachments;
}

export async function parseMultipartMixed(resp: Response) {
  const contentType = resp.headers.get('Content-Type');

  if (!contentType?.startsWith('multipart/mixed')) {
    throw new Error(`Expected multipart/mixed response, got "${contentType}"!`);
  }

  const boundary = (contentType.match(/(?<=boundary=)"?(.*?)(?=[";]|$)/) ?? []).pop();

  if (!boundary) {
    throw new Error(`Unable to parse boundary from Content-Type header "${contentType}"`);
  }

  const body = await resp.arrayBuffer();

  return parseMultipartMixedBody(boundary, body);
}

function concatBuffers(...buffers: ArrayBufferView[]) {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.byteLength, 0);
  const res = new Uint8Array(totalLength);

  let offset = 0;
  for (const buffer of buffers) {
    res.set(new Uint8Array(buffer.buffer), offset);

    offset += buffer.byteLength;
  }

  return res;
}

export async function createMultipartMixed(parts: Record<string, unknown>) {
  const boundary = btoa([...crypto.getRandomValues(boundaryGenerationBuffer)].join(''));

  const contentTypeHeader = `multipart/mixed; boundary="${boundary}"`;
  const bodyBoundary = encoder.encode(`${crlf}--${boundary}${crlf}`);

  let multipartMixedBody = new Uint8Array(0);

  const bodyParts: (Uint8Array | undefined)[] = await Promise.all(
    Object.entries(parts)
      .map(async ([filename, document]) => {
        if (!document) {
          return undefined;
        }

        const contentDisposition = `Content-Disposition: attachment; filename="${filename}"`;
        const contentType = `Content-Type: ${getMimetypeForFilename(filename)}`;
        const body = (await homogenizeBodyData(undefined, document))!;
        const contentLength = `Content-Length: ${body.byteLength}`;

        const headers = encoder.encode([contentDisposition, contentType, contentLength].join(crlf));

        return concatBuffers(headers, headerBodyBoundary, new Uint8Array(body));
      }, []),
  );

  for (const part of bodyParts) {
    if (!part) {
      continue;
    }

    multipartMixedBody = concatBuffers(
      multipartMixedBody,
      bodyBoundary,
      part,
    );
  }

  return { contentType: contentTypeHeader, data: concatBuffers(multipartMixedBody, encoder.encode(`${crlf}--${boundary}--${crlf}`)) };
}
