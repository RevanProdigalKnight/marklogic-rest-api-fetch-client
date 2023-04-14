import {
	JsonPatchDescriptor,
	JsonXmlValue,
	PatchContent,
	PatchElement,
	PatchPositionSelector,
	PermissionCapability,
	XmlAttributes,
	XmlPatchDelete,
	XmlPatchInsert,
	XmlPatchReplace,
	XmlPatchReplaceInsert,
	XmlPatchReplaceLibrary,
} from './MarkLogicStructuredTypes.ts';
import type { MaybeArray } from './UtilityTypes.ts';

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

  /** Document metadata shortcuts */
  addCollections(...collections: string[]) {
    return this.insert(...collections.map(collection => ({ context: '/array-node("collections")', content: collection })));
  }

  removeCollections(...collections: string[]) {
    return this.delete(...collections.map(collection => ({ select: `/collections[. eq "${collection}"]` })));
  }

  addPermission(roleName: string, capabilities: MaybeArray<PermissionCapability>) {
    return this.insert({ context: '/array-node("permissions")', content: { 'role-name': roleName, capabilities: Array<string>().concat(capabilities) } });
  }

  replacePermission(roleName: string, capabilities: MaybeArray<PermissionCapability>) {
    return this.replace({ select: `/permissions[node("role-name") eq "${roleName}"]`, content: Array<string>().concat(capabilities) });
  }

  removePermission(roleName: string) {
    return this.delete({ select: `/permissions[node("role-name") eq "${roleName}"]` });
  }

  addProperty(name: string, value: string | number | boolean | null) {
    return this.insert({ context: '/object-node("properties")', content: { [name]: value } });
  }

  replaceProperty(name: string, value: string | number | boolean | null) {
    return this.replace({ select: `/properties/node("${name}")`, content: value });
  }

  removeProperty(name: string) {
    return this.delete({ select: `/properties/node("${name}")` });
  }

  setQuality(quality: number) {
    return this.replace({ select: '/quality', content: quality });
  }

  addMetadataValue(name: string, value: string) {
    return this.insert({ context: '/object-node("metadataValues")', content: { [name]: value } });
  }

  replaceMetadataValue(name: string, value: string) {
    return this.replace({ select: `/metadataValues/node("${name}")`, content: value });
  }

  removeMetadataValue(name: string) {
    return this.delete({ select: `/metadataValues/node("${name}")` });
  }

  /** Replacement shortcuts */
  add(selector: string, n: number) {
    return this.#apply(selector, 'ml.add', n);
  }

  subtract(selector: string, n: number) {
    return this.#apply(selector, 'ml.subtract', n);
  }

  multiply(selector: string, n: number) {
    return this.#apply(selector, 'ml.multiply', n);
  }

  divide(selector: string, n: number) {
    return this.#apply(selector, 'ml.divide', n);
  }

  prepend(selector: string, content: string) {
    return this.#apply(selector, 'ml.concat-before', content);
  }

  append(selector: string, content: string) {
    return this.#apply(selector, 'ml.concat-after', content);
  }

  concat(selector: string, prepended: string, appended: string) {
    return this.#apply(selector, 'ml.concat-between', prepended, appended);
  }

  substringAfter(selector: string, position: number) {
    return this.#apply(selector, 'ml.substring-after', position);
  }

  substringBefore(selector: string, position: number) {
    return this.#apply(selector, 'ml.substring-before', position);
  }

  replaceRegex(selector: string, match: string, replace: string, flags?: string) {
    return this.#apply(selector, 'ml.replace-regex', match, replace, flags);
  }

  #apply(select: string, apply: string, ...args: unknown[]) {
    return this.replace({ select, apply, content: args.filter(Boolean).map(arg => ({ $value: arg })) });
  }
}

export class JsonPatchBuilder extends PatchBuilder {
	readonly #descriptors: JsonPatchDescriptor[] = [];

	build() {
		return { patch: this.#descriptors };
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
			throw new Error('replaceLibrary can only be used once per patch');
		}
		this.replaceLibraryUsed = true;

		this.#descriptors.push({ 'replace-library': element });

		return this;
	}
}

export class XmlPatchBuilder extends PatchBuilder {
	static #getXmlElementDetails(value: JsonXmlValue | JsonXmlValue[]) {
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			const { '@attributes': attributes, '@text': text, ...rest } = value;

			return { attributes, content: text ?? rest };
		}

		return { content: value };
	}

  // NOTE: Create serializer on a per-instance basis so that unit tests in Deno don't fail
	readonly #serializer = new XMLSerializer();

	readonly #document = document.implementation.createDocument('http://marklogic.com/rest-api', 'rapi:patch');
	readonly #root = this.#document.documentElement;

	build() {
		return this.#serializer.serializeToString(this.#document);
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
