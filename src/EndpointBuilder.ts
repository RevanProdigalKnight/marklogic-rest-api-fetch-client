import { primitive, Parameters } from './MarkLogicRestAPITypes.ts';

const MethodNotAllowedError = new Error('Method not allowed');
const NotImplementedError = new Error('Not implemented');

const MethodNotAllowed = () => Promise.reject(MethodNotAllowedError);
const NotImplemented = () => Promise.reject(NotImplementedError);

export interface ExtendedRequestInit<P extends Parameters | void = Parameters> extends RequestInit {
	readonly path: string;
	readonly params: P;
	// deno-lint-ignore ban-types
	readonly data?: primitive | Record<string, unknown> | object | ArrayBuffer | ArrayBufferView | FormData | File | Blob | ReadableStream | null;
}

export interface ExtendedResponse<R = unknown> extends Response {
	json(): Promise<R>;
}

export type EndpointMethod<P extends Parameters | void = Parameters, R = unknown> = <R2 = R>(opts: P, init?: Partial<ExtendedRequestInit>) => Promise<ExtendedResponse<R2>>;
export type EndpointMethodImplementation<P extends Parameters | void = Parameters, R = unknown> = <R2 = R>(init: ExtendedRequestInit<P>) => Promise<ExtendedResponse<R2>>;

// deno-lint-ignore no-empty-interface
export interface EmptyEndpoint {}
export interface EndpointWithDelete<P extends Parameters | void = Parameters, R = unknown> extends EmptyEndpoint {
	readonly delete: EndpointMethod<P, R>;
}
export interface EndpointWithGet<P extends Parameters | void = Parameters, R = unknown> extends EmptyEndpoint {
	readonly get: EndpointMethod<P, R>;
}
export interface EndpointWithHead<P extends Parameters | void = Parameters, R = unknown> extends EmptyEndpoint {
	readonly head: EndpointMethod<P, R>;
}
export interface EndpointWithPatch<P extends Parameters | void = Parameters, R = unknown> extends EmptyEndpoint {
	readonly patch: EndpointMethod<P, R>;
}
export interface EndpointWithPost<P extends Parameters | void = Parameters, R = unknown> extends EmptyEndpoint {
	readonly post: EndpointMethod<P, R>;
}
export interface EndpointWithPut<P extends Parameters | void = Parameters, R = unknown> extends EmptyEndpoint {
	readonly put: EndpointMethod<P, R>;
}

export default class EndpointBuilder<P extends Parameters = Parameters, T extends EmptyEndpoint = EmptyEndpoint> {
	readonly #path: string;
	readonly #defaultImpl: EndpointMethodImplementation;

	#del: EndpointMethodImplementation = MethodNotAllowed;
	#get: EndpointMethodImplementation = MethodNotAllowed;
	#head: EndpointMethodImplementation = MethodNotAllowed;
	#patch: EndpointMethodImplementation = MethodNotAllowed;
	#post: EndpointMethodImplementation = MethodNotAllowed;
	#put: EndpointMethodImplementation = MethodNotAllowed;

	public constructor(path: string, defaultImplementation?: EndpointMethodImplementation) {
		this.#path = path;
		this.#defaultImpl = defaultImplementation ?? NotImplemented;
	}

	public delete(opts: Parameters, init?: Partial<ExtendedRequestInit>) {
		return this.#del({
			...init,

			path: this.#path,
			params: opts,
			method: 'DELETE',
		});
	}

	public get(opts: Parameters, init?: Partial<ExtendedRequestInit>) {
		return this.#get({
			...init,

			path: this.#path,
			params: opts,
			method: 'GET',
		});
	}

	public head(opts: Parameters, init?: Partial<ExtendedRequestInit>) {
		return this.#head({
			...init,

			path: this.#path,
			params: opts,
			method: 'HEAD',
		});
	}

	public patch(opts: Parameters, init?: Partial<ExtendedRequestInit>) {
		return this.#patch({
			...init,

			path: this.#path,
			params: opts,
			method: 'PATCH',
		});
	}

	public post(opts: Parameters, init?: Partial<ExtendedRequestInit>) {
		return this.#post({
			...init,

			path: this.#path,
			params: opts,
			method: 'POST',
		});
	}

	public put(opts: Parameters, init?: Partial<ExtendedRequestInit>) {
		return this.#put({
			...init,

			path: this.#path,
			params: opts,
			method: 'PUT',
		});
	}

	public withDelete<O extends P | void, R = unknown>(del?: EndpointMethodImplementation<O, R>) {
		this.#del = del as EndpointMethodImplementation ?? this.#defaultImpl;

		return this as unknown as EndpointBuilder<P, T & EndpointWithDelete<O, R>>;
	}

	public withGet<O extends P | void, R = unknown>(get?: EndpointMethodImplementation<O, R>) {
		this.#get = get as EndpointMethodImplementation ?? this.#defaultImpl;

		return this as unknown as EndpointBuilder<P, T & EndpointWithGet<O, R>>;
	}

	public withHead<O extends P | void, R = unknown>(head?: EndpointMethodImplementation<O, R>) {
		this.#head = head as EndpointMethodImplementation ?? this.#defaultImpl;

		return this as unknown as EndpointBuilder<P, T & EndpointWithHead<O, R>>;
	}

	public withPatch<O extends P | void, R = unknown>(patch?: EndpointMethodImplementation<O, R>) {
		this.#patch = patch as EndpointMethodImplementation ?? this.#defaultImpl;

		return this as unknown as EndpointBuilder<P, T & EndpointWithPatch<O, R>>;
	}

	public withPost<O extends P | void, R = unknown>(post?: EndpointMethodImplementation<O, R>) {
		this.#post = post as EndpointMethodImplementation ?? this.#defaultImpl;

		return this as unknown as EndpointBuilder<P, T & EndpointWithPost<O, R>>;
	}

	public withPut<O extends P | void, R = unknown>(put?: EndpointMethodImplementation<O, R>) {
		this.#put = put as EndpointMethodImplementation ?? this.#defaultImpl;

		return this as unknown as EndpointBuilder<P, T & EndpointWithPut<O, R>>;
	}

	public build() {
		return this as unknown as T;
	}
}
