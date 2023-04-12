import { describe, it } from 'https://deno.land/std@0.182.0/testing/bdd.ts';
import { expect } from 'https://deno.land/x/expect@v0.3.0/expect.ts';

import { getMimetypeForFilename } from '../src/MimetypeUtils.ts';

describe('getMimetypeForFilename', () => {
  it('returns the correct common-usage mimetype for a given filename', () => {
    expect(getMimetypeForFilename('image.png')).toBe('image/png');
    expect(getMimetypeForFilename('some.filename.with.lots.of.periods.json')).toBe('application/json');
    expect(getMimetypeForFilename('somefilenamewithlotsofdots..........gif')).toBe('image/gif');
  });

  it('returns application/octet-stream for unknown file types', () => {
    expect(getMimetypeForFilename('.bashrc')).toBe('application/octet-stream');
    expect(getMimetypeForFilename('somecustomfiletype.customfileextension')).toBe('application/octet-stream');
  });
});
