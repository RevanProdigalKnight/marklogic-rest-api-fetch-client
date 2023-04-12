import { describe, it, beforeEach } from 'https://deno.land/std@0.182.0/testing/bdd.ts';
import { expect } from 'https://deno.land/x/expect@v0.3.0/expect.ts';

import EndpointBuilder, {
  EndpointWithDelete,
  EndpointWithGet,
  EndpointWithHead,
  EndpointWithPatch,
  EndpointWithPost,
  EndpointWithPut,
} from '../src/EndpointBuilder.ts';

describe('EndpointBuilder', () => {
  it('creates an endpoint which only allows the specified methods to be called', async () => {
    const endpoint = new EndpointBuilder('').build();

    // @ts-ignore: Intentional for unit tests
    expect(endpoint.get).toBeDefined();
    // @ts-ignore: Intentional for unit tests
    await expect(endpoint.get()).rejects.toThrow('Method not allowed');
  });

  it('uses a default implementation if one is not provided', async () => {
    const endpoint = new EndpointBuilder('').withGet().build();

    expect(endpoint.get).toBeDefined();
    await expect(endpoint.get()).rejects.toThrow('Not implemented');
  });

  describe('default methods', () => {
    let endpoint: EndpointWithDelete & EndpointWithGet & EndpointWithHead & EndpointWithPatch & EndpointWithPost & EndpointWithPut;

    beforeEach(() => {
      endpoint = new EndpointBuilder('', () => Promise.resolve(new Response(null)))
        .withDelete()
        .withGet()
        .withHead()
        .withPatch()
        .withPost()
        .withPut()
        .build();
    });

    it('delete uses given default implementation', async () => {
      await expect(endpoint.delete({}).then(resp => resp.status)).resolves.toBe(200);
    });

    it('get uses given default implementation', async () => {
      await expect(endpoint.get({}).then(resp => resp.status)).resolves.toBe(200);
    });

    it('head uses given default implementation', async () => {
      await expect(endpoint.head({}).then(resp => resp.status)).resolves.toBe(200);
    });

    it('patch uses given default implementation', async () => {
      await expect(endpoint.patch({}).then(resp => resp.status)).resolves.toBe(200);
    });

    it('post uses given default implementation', async () => {
      await expect(endpoint.post({}).then(resp => resp.status)).resolves.toBe(200);
    });

    it('put uses given default implementation', async () => {
      await expect(endpoint.put({}).then(resp => resp.status)).resolves.toBe(200);
    });
  });

  it('individual methods can be overridden', async () => {
    const endpoint = new EndpointBuilder('', () => Promise.resolve(new Response(null, { status: 500 })))
      .withGet(() => Promise.resolve(new Response(null)))
      .build();

    await expect(endpoint.get().then(resp => resp.status)).resolves.toBe(200);
  });
});
