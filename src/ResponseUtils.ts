const decoder = new TextDecoder();

const cr = '\r'.charCodeAt(0);
const lf = '\n'.charCodeAt(0);

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

	      	if (buf[end] !== cr || buf [end + 1] !== lf) {
	      		console.warn('Expected CRLF after raw content!');
	      	}

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

export function parseMultipartMixed(boundary: string, body: ArrayBuffer) {
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
