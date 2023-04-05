import {
	JsonPatchDescriptor,
	JsonXmlValue,
	PatchContent,
	PatchElement,
	PatchPositionSelector,
	XmlAttributes,
	XmlPatchDelete,
	XmlPatchInsert,
	XmlPatchReplace,
	XmlPatchReplaceInsert,
	XmlPatchReplaceLibrary,
} from './MarkLogicStructuredTypes.ts';

const PatchBuilderLock = Symbol('PatchBuilder');

export default abstract class PatchBuilder {
	static for(uri: string): PatchBuilder {
		const format = uri.slice(uri.lastIndexOf('.') + 1);

		switch (format) {
			case 'xml':
				return new XmlPatchBuilder(PatchBuilderLock);
			case 'json':
				return new JsonPatchBuilder(PatchBuilderLock);
			default:
				throw new Error(`Unknown document format "${format}". Known formats: "xml", "json".`);
		}
	}

	protected replaceLibraryUsed = false;

	protected constructor(lock: symbol) {
		if (lock !== PatchBuilderLock) {
			throw new Error('Use PatchBuilder.for(<uri>) instead of directly instantiating a Patch Builder.');
		}
	}

	abstract build(): string | { readonly patch: JsonPatchDescriptor[] };

	abstract delete(...elements: XmlPatchDelete[]): this;
	abstract insert(...elements: XmlPatchInsert[]): this;
	abstract replace(...elements: XmlPatchReplace[]): this;
	abstract replaceInsert(...elements: XmlPatchReplaceInsert[]): this;
	abstract replaceLibrary(element: XmlPatchReplaceLibrary): this;
}

class JsonPatchBuilder extends PatchBuilder {
	readonly #descriptors: JsonPatchDescriptor[] = [];

	build() {
		return { patch: this.#descriptors };
		// return JSON.stringify(this.#descriptors);
	}

	delete(...elements: XmlPatchDelete[]) {
		this.#descriptors.push(...elements.map(element => ({ delete: element })));

		return this;
	}

	insert(...elements: XmlPatchInsert[]) {
		this.#descriptors.push(...elements.map(element => ({ insert: { position: 'last-child' as PatchPositionSelector, ...element } })));

		return this;
	}

	replace(...elements: XmlPatchReplace[]) {
		this.#descriptors.push(...elements.map(element => ({ replace: element })));

		return this;
	}

	replaceInsert(...elements: XmlPatchReplaceInsert[]) {
		this.#descriptors.push(...elements.map(element => ({ 'replace-insert': element })));

		return this;
	}

	replaceLibrary(element: XmlPatchReplaceLibrary) {
		if (this.replaceLibraryUsed) {
			throw new Error('replaceLibrary can only used once per patch');
		}
		this.replaceLibraryUsed = true;

		this.#descriptors.push({ 'replace-library': element });

		return this;
	}
}

class XmlPatchBuilder extends PatchBuilder {
	static readonly #serializer = new XMLSerializer();

	static #getXmlElementDetails(value: JsonXmlValue | JsonXmlValue[]) {
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			const { '@attributes': attributes, '@text': text, ...rest } = value;

			return { attributes, content: text ?? rest };
		}

		return { content: value };
	}

	readonly #document = document.implementation.createDocument('http://marklogic.com/rest-api', 'rapi:patch');
	readonly #root = this.#document.documentElement;

	build() {
		return XmlPatchBuilder.#serializer.serializeToString(this.#document);
	}

	delete(...elements: XmlPatchDelete[]) {
		for (const element of elements) {
			this.#root.appendChild(this.#createPatchElement('rapi:delete', element as unknown as XmlAttributes));
		}

		return this;
	}

	insert(...elements: XmlPatchInsert[]) {
		for (const { content, ...attrs } of elements) {
			this.#root.appendChild(this.#createPatchElement('rapi:insert', { position: 'last-child', ...attrs as unknown as XmlAttributes }, content));
		}

		return this;
	}

	replace(...elements: XmlPatchReplace[]) {
		for (const { content, ...attrs } of elements) {
			this.#root.appendChild(this.#createPatchElement('rapi:replace', attrs as unknown as XmlAttributes, content));
		}

		return this;
	}

	replaceInsert(...elements: XmlPatchReplaceInsert[]) {
		for (const { content, ...attrs } of elements) {
			this.#root.appendChild(this.#createPatchElement('rapi:replace-insert', attrs as unknown as XmlAttributes, content));
		}

		return this;
	}

	replaceLibrary(element: XmlPatchReplaceLibrary) {
		if (this.replaceLibraryUsed) {
			throw new Error('replaceLibrary can only be used once per patch');
		}
		this.replaceLibraryUsed = true;

		this.#root.appendChild(this.#createPatchElement('rapi:replace-library', element as unknown as XmlAttributes));

		return this;
	}

	#createXmlElement(tagName: string, attrs: XmlAttributes = {}) {
		const element = this.#document.createElement(tagName);

		for (const [key, value] of Object.entries(attrs)) {
			element.setAttribute(key, value?.toString() ?? 'null');
		}

		return element;
	}

	#createPatchElement(tagName: string, attrs: XmlAttributes = {}, content?: PatchContent) {
		const element = this.#createXmlElement(tagName, attrs);

		this.#insertContent(element, content);

		return element;
	}

	#insertContent(parent: HTMLElement, content?: PatchContent) {
		if (content === null || content === undefined) {
			return;
		}

		if (typeof content === 'object') {
			if (Array.isArray(content)) {
				content.forEach(el => { this.#insertContent(parent, el); });
			} else {
				for (const [key, value] of Object.entries(content)) {
					const { attributes, content } = XmlPatchBuilder.#getXmlElementDetails(value);

					for (const elementContent of ([] as PatchElement[]).concat(content)) {
						const element = this.#createXmlElement(key, attributes);

						this.#insertContent(element, elementContent);

						parent.appendChild(element);
					}
				}
			}
		} else {
			parent.appendChild(this.#document.createTextNode(content.toString(10)));
		}
	}
}
