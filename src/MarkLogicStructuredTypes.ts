import type Query from './QueryBuilder.ts';

export type GraphCategoryType = 'content' | 'permissions' | 'metadata';
export type CategoryType = GraphCategoryType | 'metadata-values' | 'collections' | 'properties' | 'quality';
export type ReturnFormatType = 'json' | 'xml';
export type SparqlOptimizeLevel = 0 | 1 | 2;

export interface DataHubHeadersSource {
	readonly name: string;
}

export interface DataHubMergeOptions {
	readonly lang: string;
	readonly value: string;
}

export interface DataHubMerge {
	readonly 'document-uri': string;
	/** ISO-8601 microsecond-accuracy timestamp */
	readonly 'last-merge': string;
}

export interface DataHubHeaders {
	readonly sources: DataHubHeadersSource[];
	/** ISO-8601 microsecond-accuracy timestamp */
	readonly createdOn: string | string[];
	readonly createdBy: string;
	/** ISO-8601 microsecond-accuracy timestamp */
	readonly harmonizedOn: string;
	readonly harmonizedBy: string;
	readonly 'merge-options'?: DataHubMergeOptions;
	readonly merges?: DataHubMerge[];
	readonly id?: string;
}

export interface TripleObject {
	readonly datatype: string;
	readonly value: string;
}

export interface Triple<O = string | TripleObject> {
	readonly subject: string;
	readonly predicate: string;
	readonly object: O;
}

export interface DataHubInstanceInfo {
	readonly title: string;
	readonly version: string;
	readonly baseUri: string;
}

export interface DataHubInstance {
	readonly info: DataHubInstanceInfo;
}

export interface DataHubEnvelope<T extends Record<string, unknown> = Record<never, never>, A = unknown> {
	readonly headers: DataHubHeaders;
	readonly triples: { readonly triple: Triple }[];
	readonly instance: DataHubInstance & T;
	readonly attachments: null | A[];
}

export interface DataHubDocument<T extends Record<string, unknown> = Record<never, never>, A = unknown, C = Record<never, never>> {
	readonly envelope: DataHubEnvelope<T, A> & C;
}

export interface SearchMatch {
	readonly path: string;
	readonly 'match-text': (string | { highlight: string; })[];
}

export interface SearchResult {
	readonly index: number;
	readonly uri: string;
	readonly path: string;
	readonly score: number;
	readonly confidence: number;
	readonly fitness: number;
	readonly matches: SearchMatch[];
}

export interface SearchMetrics {
	readonly 'query-resolution-time': string;
	readonly 'facet-resolution-time': string;
	readonly 'snippet-resolution-time': string;
	readonly 'total-time': string;
}

export interface SearchFacetValue {
	readonly name: string;
	readonly count: number;
	readonly value: string;
}

export interface SearchFacet {
	readonly type: string;
	readonly facetValues: SearchFacetValue[];
}

export interface SearchResults {
	readonly 'snippet-format': string;
	readonly total: number;
	readonly start: number;
	readonly 'page-length': number;
	readonly results: SearchResult[];
	readonly qtext: string;
	readonly metrics: SearchMetrics;
	readonly facets: Record<string, SearchFacet>;
}

// NOTE: Documentation on JSON query config is shit (completely nonexistent in some cases)
// export interface QueryConfigBaseConstraint {
// 	readonly name: string;
// }

// export interface QueryConfigCollectionConstraint extends QueryConfigBaseConstraint {
// 	readonly collection: {
// 		readonly prefix?: string;
// 		readonly facet?: boolean;
// 		readonly 'facet-option'?: string[];
// 	};
// }
// export interface QueryConfigRangeConstraint extends QueryConfigBaseConstraint {
// 	readonly range: {
// 		readonly type?: 'xs:string' | 'xs:int'; // TODO: add additional data types from xs namespace
// 		readonly facet?: boolean;
// 		readonly collation?: string;
// 	};
// }

// export type QueryConfigConstraint =
// 	| QueryConfigCollectionConstraint
// 	| QueryConfigRangeConstraint
// 	// TODO: Add additional constraint types
// 	;

// export interface QueryConfigOptions {
// 	readonly constraint?: QueryConfigConstraint[];
// 	readonly operator?: QueryConfigOperator[];
// 	readonly term?: QueryConfigTerm[];
// 	readonly tuples?: QueryConfigTuples[];
// 	readonly values?: QueryConfigValues[];
// 	readonly 'search-option'?: 'filtered' | 'unfiltered';
// 	readonly 'extract-document-data'?: QueryConfigExtractPath[];
// 	readonly 'return-facets'?: boolean;
// 	readonly 'return-query'?: boolean;
// 	readonly 'transform-results'?: QueryConfigTransformResults;
// }

// export interface QueryConfig {
// 	readonly options: QueryConfigOptions;
// }

export interface SparqlResultHead {
	readonly vars: string[];
}

export interface SparqlResultBinding {
	readonly type: string;
	readonly value: string;
}

export interface SparqlResultResults {
	readonly bindings: Record<string, SparqlResultBinding>[];
}

export interface SparqlResult {
	readonly head: SparqlResultHead;
	readonly results: SparqlResultResults;
}

export type XmlAttributes = Record<string, string | number | boolean | null>;

/** Any valid JavaScript object can be used here, it has specially named @attributes and @text properties to contain XML Attributes/text content in the case of XML patch */
export interface JsonXmlRepresentation extends Record<string, JsonXmlValue | JsonXmlValue[]> {
  /** Special property to hold XML element attributes if they are needed */
  // @ts-ignore: Intentional signature mismatch, XML Attributes have restrictions
  readonly '@attributes'?: XmlAttributes;
  /** Special property to hold XML text content if also using @attributes on a property. If @text exists in an object all properties aside from @attributes and @text are ignored. */
  // @ts-ignore: Intentional signature mismatch, XML Attributes have restrictions
  readonly '@text'?: string | number | boolean;
}

export type JsonXmlValue = string | number | boolean | null | JsonXmlRepresentation;

export type TopLevelJsonXmlRepresentation = Record<string, JsonXmlValue | JsonXmlValue[]>;

// deno-lint-ignore ban-types
export type PatchElement = string | number | boolean | object | null | TopLevelJsonXmlRepresentation;
export type PatchContent = PatchElement | PatchElement[];

export type PatchPositionSelector =
  | "before"
  | "after"
  | "last-child";

export type PatchCardinality =
  | '?'
  | '.'
  | '*'
  | '+';

export interface XmlPatchInsert {
  /** A JSONPath expression that selects an existing JSON property or array element on which to operate. The expression can select multiple terms. */
  readonly context: string;
  /** The new content to be inserted. If an object is passed it is automatically converted to a series of XML Nodes equivalent to the JSON passed in. Attributes can be specified using a property named `@attributes` */
  readonly content: PatchContent;

  /** Where to insert the content relative to the JSON property selected by `context`. Default: "last-child" */
  readonly position?: PatchPositionSelector;
  /** The required occurrence of matches to `position`. If the number of matches does not meet the expectation, the operation fails. */
  readonly cardinality?: PatchCardinality;
}

export interface XmlPatchReplaceBase {
  /** A JSONPath expression that selects an existing JSON property or array element to replace. If no matches are found for the `select` expression, the operation is silently ignored. */
  readonly select: string;

  /** The required occurrence of matches to `position`. If the number of matches does not meet the expectation, the operation fails. */
  readonly cardinality?: PatchCardinality;
  /** The local name of a replacement content generation function. If you do not specify a function, the operation must include a `content` property. */
  readonly apply?: string;
}

export interface XmlPatchReplaceNoContent extends XmlPatchReplaceBase {
  /** The local name of a replacement content generation function. If you do not specify a function, the operation must include a `content` property. */
  readonly apply: string;

  readonly content: never;
}

export interface XmlPatchReplaceWithContent extends XmlPatchReplaceBase {
  /** The replacement value. */
  readonly content: PatchContent;
}

export type XmlPatchReplace = XmlPatchReplaceNoContent | XmlPatchReplaceWithContent;

export type XmlPatchReplaceInsert = (XmlPatchReplaceNoContent | XmlPatchReplaceWithContent) & {
  /** A JSONPath expression that selects an existing JSON property or array element on which to operate. The expression can select multiple terms. */
  readonly context: string;

  /** Where to insert the content relative to the JSON property selected by `context`. Default: "last-child" */
  readonly position?: PatchPositionSelector;
};

export interface XmlPatchDelete {
  /** A JSONPath expression that selects an existing JSON property or array element to remove. If no matches are found for the `select` expression, the operation is silently ignored. */
  readonly select: string;

  /** The required occurrence of matches to `position`. If the number of matches does not meet the expectation, the operation fails. */
  readonly cardinality?: PatchCardinality;
}

export interface XmlPatchReplaceLibrary {
  /** The path to the XQuery library module containing user-defined replacement content generation functions. The module *must* be installed in the modules database associated with the REST API instance. */
  readonly at?: string;
  /** The module namespace alias defined by the `at` module */
  readonly ns?: string;
}

export interface JsonPatchInsert {
  readonly insert: XmlPatchInsert;
}

export interface JsonPatchReplace {
  readonly replace: XmlPatchReplaceNoContent | XmlPatchReplaceWithContent;
}

export interface JsonPatchReplaceInsert {
  readonly 'replace-insert': XmlPatchReplaceInsert;
}

export interface JsonPatchDelete {
  readonly delete: XmlPatchDelete;
}

export interface JsonPatchReplaceLibrary {
  readonly 'replace-library': XmlPatchReplaceLibrary;
}

export type JsonPatchDescriptor =
  | JsonPatchInsert
  | JsonPatchReplace
  | JsonPatchReplaceInsert
  | JsonPatchDelete
  | JsonPatchReplaceLibrary;

export interface PushFlexrepPropertyConfig {
  readonly 'domain-name': string;
}

export interface PushFlexrepConfig extends PushFlexrepPropertyConfig {
  readonly 'alerting-uri': string;
}

export interface FlexrepConfigHttpOptions {
  readonly username: string;
  readonly password: string;

  readonly 'client-cert'?: string;
  readonly 'client-key'?: string;
  readonly 'client-pass-phrase'?: string;
  readonly 'credential-id'?: string;
  readonly 'kerberos-ticket-forwarding'?: 'disabled' | 'required' | 'optional';
  readonly 'verify-cert'?: boolean;
  readonly method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'PATCH' | 'get' | 'post' | 'put' | 'delete' | 'head' | 'patch';
  readonly proxy?: string;
}

export interface PushFlexrepTargetConfig {
  readonly 'documents-per-batch': number;
  readonly 'http-options': FlexrepConfigHttpOptions;
  readonly 'target-name': string;
  readonly url: string[];
  readonly user: string;

  readonly 'filter-module'?: string;
  readonly 'filter-options'?: unknown;
  readonly 'immediate-push'?: boolean;
  readonly 'replicate-cpf'?: boolean;
  readonly 'retry-seconds-max'?: number;
  readonly 'retry-seconds-min'?: number;
  readonly enabled?: boolean;
}

export interface InboundFlexrepProperties {
  readonly 'alerting-uri'?: string;
  readonly 'extusr:external-user'?: string;
  readonly 'inbound-filter-module'?: string;
  readonly 'inbound-filter-options'?: string;
}

export interface FlexrepPullConfig {
  readonly 'domain-id': string;
  readonly 'http-options': FlexrepConfigHttpOptions;
  readonly 'pull-name': string;
  readonly 'target-id': string;
  readonly enabled: boolean;
  readonly url: string[];
}

export interface FlexrepDomainTargetRule {
  readonly id: string | number;
  readonly name: string;
  readonly description: string;
  readonly 'user-id': string;
  readonly query: Query;
  readonly 'action-name': string;
  readonly 'external-security-id': string;
  readonly 'external-user-name': string;
  // NOTE: No documentation in example rule given on docs site
  // deno-lint-ignore ban-types
  readonly options: object;
}

export interface AlertAction {
  readonly name: string;
  readonly description: string;
  readonly module?: string;
  readonly 'module-db'?: string | number;
  readonly 'module-root'?: string;
  readonly option: string[];
}

export interface AlertActionRule {
  readonly name: string;
  readonly desrciption: string;
  readonly 'user-id': string;
  readonly query: Query;
  readonly 'action-name': string;
  readonly 'external-security-id'?: string;
  readonly 'user-name'?: string;
  readonly option: string[];
}
