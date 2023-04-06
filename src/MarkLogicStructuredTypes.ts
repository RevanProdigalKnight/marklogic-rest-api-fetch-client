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

export interface AlertConfig {
  readonly id?: string | number;
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly trigger: string[];
  readonly domain: string[];
  readonly option: string[];
  readonly action: string[];
}

export interface AlertTriggerEvent {
  readonly 'data-event': {
    readonly 'document-scope': { readonly uri: string; };
    readonly 'collection-scope': { readonly uri: string; };
    readonly 'directory-scope': { readonly uri: string; readonly depth: number; };
    readonly 'document-content': { readonly 'update-kind': string; };
    readonly 'any-property-content': unknown;
    readonly 'any-custom-property-content': unknown;
    readonly 'property-content': { readonly 'property-name': { readonly 'namespace-uri': string; readonly localname: unknown; }; };
    readonly when: unknown;
  };
  readonly 'database-online-event': {
    readonly user: string | number;
    readonly 'user-id': string | number;
    readonly 'user-name': string;
  };
}

export interface Permission {
  readonly permission: {
    readonly 'role-name': string;
    readonly capability: string;
  };
}

export interface AlertTrigger {
  readonly id?: string | number;
  readonly name: string;
  readonly description: string;
  readonly event: AlertTriggerEvent;
  readonly module: string;
  readonly 'module-db': string;
  readonly 'module-root': string;
  readonly enabled: boolean;
  readonly recursive: boolean;
  readonly 'task-priority': unknown;
  readonly permissions: Permission;
}

export interface CpfConfig {
  readonly 'domain-name': string;
  readonly 'restart-user-name': string;
  readonly 'eval-module': string;
  readonly 'eval-root': string;
  readonly 'conversion-enabled': boolean;
  readonly permissions: Permission;
}

export interface CpfDomain {
  readonly 'domain-name': string;
  readonly 'description': string;
  readonly scope: string;
  readonly uri: string;
  readonly depth: number;
  readonly 'eval-module': string;
  readonly 'eval-root': string;
  readonly pipelines: { readonly pipeline: unknown; };
  readonly permissions: Permission;
}

export interface CpfPipelineTransitionExecute {
  readonly annotation: string;
  readonly condition: unknown;
  readonly action: unknown;
}

export interface CpfPipelineBaseTransition {
  readonly annotation: string;
  readonly priority: unknown;
  readonly 'default-action': unknown;
  readonly execute: CpfPipelineTransitionExecute;
}

export interface CpfPipelineStatusOrStateTransition extends CpfPipelineBaseTransition {
  readonly status: unknown;
  readonly 'on-success': unknown;
  readonly 'on-failure': unknown;
  readonly always: boolean;
}

export interface CpfPipelineEventTransition extends CpfPipelineBaseTransition {
  readonly event: unknown;
}

export interface CpfPipeline {
  readonly annotation: string;
  readonly 'pipeline-id': string | number;
  readonly 'pipeline-name': string;
  readonly 'pipeline-description': string;
  readonly 'success-action': unknown;
  readonly 'failure-action': unknown;
  readonly 'status-transition': CpfPipelineStatusOrStateTransition;
  readonly 'state-transition': CpfPipelineStatusOrStateTransition;
  readonly 'event-transition': CpfPipelineEventTransition;
}

export interface DatabaseAssignmentPolicy {
  readonly 'assignment-policy-name': string;
  readonly 'partition-key': { readonly 'cts:base-reference': unknown; };
  readonly 'lower-bound-included': boolean;
  readonly 'default-partition': boolean;
}

export interface DatabaseBackup {
  readonly 'database-backup': {
    readonly 'backup-id': string | number;
    readonly 'backup-enabled': boolean;
    readonly 'backup-directory': string;
    readonly 'backup-kek-id': string;
    readonly 'backup-type': unknown;
    readonly 'backup-period': unknown;
    readonly 'backup-month-day': unknown;
    readonly 'backup-days': { readonly day: unknown; };
    readonly 'backup-start-date': string;
    readonly 'backup-start-time': string;
    readonly 'backup-timestamp': string;
    readonly 'max-backups': number | string;
    readonly 'backup-schemas-database'?: boolean;
    readonly 'backup-security-database'?: boolean;
    readonly 'backup-triggers-database'?: boolean;
    readonly 'include-replicas'?: boolean;
    readonly 'journal-archiving'?: boolean;
    readonly 'journal-archive-path'?: string;
    readonly 'journal-archive-lag-limit'?: string | number;
    readonly 'incremental-backup'?: boolean;
    readonly 'purge-journal-archive'?: boolean;
  };
}

export interface DatabaseField {
  readonly field: {
    readonly 'field-name': string;
    readonly 'include-root': boolean;
    readonly 'field-path': { readonly path: string; readonly weight: number; };
    readonly metadata: unknown;

    readonly 'excluded-elements'?: ExcludedElement[];
    readonly 'included-elements'?: IncludedElement[];
    readonly 'tokenizer-overrides'?: TokenizerOverride[];
    readonly 'word-lexicons'?: WordLexicon[];

    readonly 'stemmed-searches'?: boolean;
    readonly 'word-searches'?: boolean;
    readonly 'field-value-searches'?: boolean;
    readonly 'field-value-positions'?: boolean;
    readonly 'fast-phrase-searches'?: boolean;
    readonly 'fast-case-sensitive-searches'?: boolean;
    readonly 'fast-diacritic-sensitive-searches'?: boolean;
    readonly 'trailing-wildcard-searches'?: boolean;
    readonly 'trailing-wildcard-word-searches'?: boolean;
    readonly 'three-character-searches'?: boolean;
    readonly 'two-character-searches'?: boolean;
    readonly 'one-character-searches'?: boolean;
  }
}

export interface DatabaseForeignMaster {
  readonly 'foreign-cluster-name': string;
  readonly 'foreign-database-name': string;
  readonly 'connect-forests-by-name': boolean;
}

export interface DatabaseForeignReplica {
  readonly 'foreign-replica': {
    readonly 'foreign-cluster-name': string;
    readonly 'foreign-database-name': string;
    readonly 'connect-forests-by-name': boolean;
    readonly 'lag-limit': number | string;
    readonly 'replication-enabled': boolean;
    readonly 'queue-size': number | string;
  };
}

export interface DatabaseForest {
  readonly forest: string | number;
}

export interface DatabaseReference {
  readonly 'database-reference': {
    readonly 'reference-cluster-name': string;
    readonly 'reference-database-name': string;
  };
}

export interface DatabaseReplication {
  readonly 'foreign-replicas': DatabaseForeignReplica[];
  readonly 'foreign-master': DatabaseForeignMaster;
}

export interface DefaultRuleset {
  readonly 'default-ruleset': {
    readonly location: unknown;
  };
}

export interface ElementAttributeWordLexicon {
  readonly 'element-attribute-word-lexicon': {
    readonly 'parent-namespace-uri': string;
    readonly 'parent-localname': string;
    readonly 'namespace-uri': string;
    readonly localname: string;
    readonly collation: string;
  };
}

export interface ElementWordLexicon {
  readonly 'element-word-lexicon': {
    readonly 'namespace-uri': string;
    readonly localname: string;
    readonly collation: string;
  };
}

export interface ElementWordQueryThrough {
  readonly 'element-word-query-through': {
    readonly 'namespace-uri': string;
    readonly localname: string;
  };
}

export interface ExcludedElement {
  readonly 'excluded-element': {
    readonly 'namespace-uri': string;
    readonly localname: string;
    readonly 'attribute-namespace-uri': string;
    readonly 'attributelocalname': string;
    readonly 'attribute-value': boolean;
  };
}

export interface FragmentRoot {
  readonly 'fragment-root': {
    readonly 'namespace-uri': string;
    readonly localname: string;
  };
}

export interface FragmentParent {
  readonly 'fragment-parent': {
    readonly 'namespace-uri': string;
    readonly localname: string;
  };
}

export interface GeospatialElementIndex {
  readonly 'geospatial-element-index': {
    readonly 'namespace-uri': string;
    readonly localname: string;
    readonly 'coordinate-system': string;
    readonly 'point-format': unknown;
    readonly 'range-value-positions': boolean;
    readonly 'invalid-values': boolean;
  };
}

export interface GeospatialElementChildIndex {
  readonly 'geospatial-element-child-index': {
    readonly 'parent-namespace-uri': string;
    readonly 'parent-localname': string;
    readonly 'namespace-uri': string;
    readonly localname: string;
    readonly 'coordinate-system': string;
    readonly 'point-format': unknown;
    readonly 'range-value-positions': boolean;
    readonly 'invalid-values': boolean;
  };
}

export interface GeospatialElementPairIndex {
  readonly 'geospatial-element-pair-index': {
    readonly 'parent-namespace-uri': string;
    readonly 'parent-localname': string;
    readonly 'latitude-namespace-uri': string;
    readonly 'latitude-localname': string;
    readonly 'longitude-namespace-uri': string;
    readonly 'longitude-localname': string;
    readonly 'coordinate-system': string;
    readonly 'point-format': unknown;
    readonly 'range-value-positions': boolean;
    readonly 'invalid-values': boolean;
  };
}

export interface GeospatialElementAttributePairIndex {
  readonly 'geospatial-element-attribute-pair-index': {
    readonly 'parent-namespace-uri': string;
    readonly 'parent-localname': string;
    readonly 'latitude-namespace-uri': string;
    readonly 'latitude-localname': string;
    readonly 'longitude-namespace-uri': string;
    readonly 'longitude-localname': string;
    readonly 'coordinate-system': string;
    readonly 'point-format': unknown;
    readonly 'range-value-positions': boolean;
    readonly 'invalid-values': boolean;
  };
}

export interface GeospatialPathIndex {
  readonly 'geospatial-path-index': {
    readonly 'path-expression': string;
    readonly 'coordinate-system': string;
    readonly 'point-format': unknown;
    readonly 'range-value-positions': boolean;
    readonly 'invalid-values': boolean;
  };
}

export interface GeospatialRegionPathIndex {
  readonly 'geospatial-region-path-index': {
    readonly 'path-expression': string;
    readonly 'coordinate-system': string;
    readonly 'point-format': unknown;
    readonly 'range-value-positions': boolean;
    readonly 'invalid-values': boolean;
  };
}

export interface IncludedElement {
  readonly 'included-element': {
    readonly 'namespace-uri': string;
    readonly localname: string;
    readonly weight: number;
    readonly 'attribute-namespace-uri': string;
    readonly 'attributelocalname': string;
    readonly 'attribute-value': boolean;
  };
}

export interface MergeBlackout {
  readonly 'merge-blackout': {
    readonly 'blackout-type': unknown;
    readonly limit: string | number;
    readonly 'merge-priority': unknown;
    readonly days: { readonly day: unknown; };
    readonly period: {
      readonly 'start-date'?: string;
      readonly 'start-time'?: string;
      readonly duration?: string;
      readonly 'end-date'?: string;
      readonly 'end-time'?: string;
    };
  };
}

export interface PathNamespace {
  readonly 'path-namespace': {
    readonly prefix: string;
    readonly 'namespace-uri': string;
  };
}

export interface PhraseThrough {
  readonly 'phrase-through': {
    readonly 'namespace-uri': string;
    readonly localname: string;
  };
}

export interface PhraseAround {
  readonly 'phrase-around': {
    readonly 'namespace-uri': string;
    readonly localname: string;
  };
}

export interface RangeElementIndex {
  readonly 'range-element-index': {
    readonly 'scalar-type': unknown;
    readonly 'namespace-uri': string;
    readonly localname: string;
    readonly collation: string;
    readonly 'range-value-positions': unknown;
    readonly 'invalid-values': boolean;
  };
}

export interface RangeFieldIndex {
  readonly 'range-field-index': {
    readonly 'scalar-type': unknown;
    readonly 'field-name': string;
    readonly collation: string;
    readonly 'range-value-positions': unknown;
    readonly 'invalid-values': boolean;
  };
}

export interface RangePathIndex {
  readonly 'range-path-index': {
    readonly 'scalar-type': unknown;
    readonly 'path-expression': string;
    readonly collation: string;
    readonly 'range-value-positions': unknown;
    readonly 'invalid-values': boolean;
  };
}

export interface RangeElementAttributeIndex {
  readonly 'range-element-attribute-index': {
    readonly 'scalar-type': unknown;
    readonly 'parent-namespace-uri': string;
    readonly 'parent-localname': string;
    readonly 'namespace-uri': string;
    readonly localname: string;
    readonly collation: string;
    readonly 'range-value-positions': unknown;
    readonly 'invalid-values': boolean;
  };
}

export interface RetiredForest {
  readonly 'retired-forest': string | number;
}

export interface Subdatabase {
  readonly subdatabase: {
    readonly 'cluster-name': string;
    readonly 'database-name': string;
  };
}

export interface TokenizerOverride {
  readonly 'tokenizer-override': {
    readonly character: string;
    readonly 'tokenizer-class': unknown;
  };
}

export interface WordLexicon {
  readonly 'word-lexicon': boolean;
}

export interface Database {
  readonly 'database-name': string;
  readonly enabled: boolean;
  readonly 'security-database': string | number;
  readonly 'schema-database': string | number;
  readonly 'triggers-database': string | number;
  readonly 'data-encryption': boolean;
  readonly 'backup-encryption-key': string;
  readonly forests: DatabaseForest;
  readonly subdatabases: Subdatabase;
  readonly 'retired-forests': RetiredForest;
  readonly 'retired-forest-count': number;
  readonly language: string;

  readonly 'assignment-policy'?: DatabaseAssignmentPolicy;
  readonly 'database-backups'?: DatabaseBackup[];
  readonly 'database-references'?: DatabaseReference[];
  readonly 'database-replication'?: DatabaseReplication;
  readonly 'default-rulesets'?: DefaultRuleset[];
  readonly 'element-word-lexicons'?: ElementWordLexicon[];
  readonly 'element-attribute-word-lexicons'?: ElementAttributeWordLexicon[];
  readonly 'element-word-query-throughs'?: ElementWordQueryThrough[];
  readonly fields?: DatabaseField[];
  readonly 'fragment-roots'?: FragmentRoot[];
  readonly 'fragment-parents'?: FragmentParent[];
  readonly 'geospatial-element-indexes'?: GeospatialElementIndex[];
  readonly 'geospatial-element-child-indexes'?: GeospatialElementChildIndex[];
  readonly 'geospatial-element-pair-indexes'?: GeospatialElementPairIndex[];
  readonly 'geospatial-element-attribuet-pair-indexes'?: GeospatialElementAttributePairIndex[];
  readonly 'geospatial-path-indexes'?: GeospatialPathIndex[];
  readonly 'geospatial-region-path-indexes'?: GeospatialRegionPathIndex[];
  readonly 'merge-blackouts'?: MergeBlackout[];
  readonly 'path-namespaces'?: PathNamespace[];
  readonly 'phrase-around'?: PhraseAround[];
  readonly 'phrase-word-query-throughs'?: PhraseThrough[];
  readonly 'range-element-indexes'?: RangeElementIndex[];
  readonly 'range-element-attribute-indexes'?: RangeElementAttributeIndex[];
  readonly 'range-field-indexes'?: RangeFieldIndex[];
  readonly 'range-path-indexes'?: RangePathIndex[];
  readonly 'word-lexicons'?: WordLexicon[];

  readonly 'stemmed-searches'?: boolean;
  readonly 'word-searches'?: boolean;
  readonly 'word-positions'?: boolean;
  readonly 'fast-phrase-searches'?: boolean;
  readonly 'fast-reverse-searches'?: boolean;
  readonly 'triple-index'?: boolean;
  readonly 'triple-positions'?: boolean;
  readonly 'fast-case-sensitive-searches'?: boolean;
  readonly 'fast-diacritic-sensitive-searches'?: boolean;
  readonly 'fast-element-word-searches'?: boolean;
  readonly 'fast-word-searches'?: boolean;
  readonly 'element-word-searches'?: boolean;
  readonly 'fast-element-phrase-searches'?: boolean;
  readonly 'element-value-positions'?: boolean;
  readonly 'field-value-searches'?: boolean;
  readonly 'field-value-positions'?: boolean;
  readonly 'three-character-searches'?: boolean;
  readonly 'two-character-searches'?: boolean;
  readonly 'one-character-searches'?: boolean;
  readonly 'fast-element-character-searches'?: boolean;
  readonly 'trailing-wildcard-searches'?: boolean;
  readonly 'trailing-wildcard-word-positions'?: boolean;
  readonly 'fast-element-trailing-wildcard-searches'?: boolean;
  readonly 'uri-lexicon'?: boolean;
  readonly 'collection-lexicon'?: boolean;
  readonly 'reindexer-enable'?: boolean;
  readonly 'reindexer-throttle'?: number;
  readonly 'reindexer-timestamp'?: number | string;
  readonly 'directory-creation'?: boolean;
  readonly 'maintain-last-modified'?: boolean;
  readonly 'maintain-directory-last-modified'?: boolean;
  readonly 'inherit-permissions'?: boolean;
  readonly 'inherit-collections'?: boolean;
  readonly 'inherit-quality'?: boolean;
  readonly 'preallocate-journals'?: boolean;
  readonly 'preload-mapped-data'?: boolean;
  readonly 'preload-replica-mapped-data'?: boolean;
  readonly 'range-index-optimize'?: boolean;
  readonly 'positions-list-max-size'?: number | string;
  readonly 'in-memory-limit'?: number | string;
  readonly 'in-memory-list-size'?: number | string;
  readonly 'in-memory-tree-size'?: number | string;
  readonly 'in-memory-range-index-size'?: number | string;
  readonly 'in-memory-reverse-index-size'?: number | string;
  readonly 'in-memory-triple-index-size'?: number | string;
  readonly 'in-memory-geospatial-region-index-size'?: number | string;
  readonly 'triple-index-geohash-precision'?: number | string;
  readonly 'large-size-threshold'?: number | string;
  readonly 'journal-size'?: number | string;
  readonly 'journal-count'?: number | string;
  readonly locking?: unknown;
  readonly journaling?: unknown;
  readonly 'format-compatibility'?: unknown;
  readonly 'index-detection'?: unknown;
  readonly 'expunge-locks'?: unknown;
  readonly 'tf-normalization'?: unknown;
  readonly 'merge-priority'?: unknown;
  readonly 'merge-max-size'?: number | string;
  readonly 'merge-min-size'?: number | string;
  readonly 'merge-min-ratio'?: number | string;
  readonly 'merge-timestamp'?: number | string;
  readonly 'retain-until-backup'?: boolean;
  readonly 'rebalancer-enable'?: boolean;
  readonly 'rebalancer-throttle'?: number | string;
  readonly 'shutdown-on-storage-failure'?: boolean;
  readonly 'storage-failure-timeout'?: number | string;
}

export interface BaseDatabaseBackupOrRestoreOptions {
  readonly forest: string[];
  readonly 'backup-dir': string;
  readonly incremental: boolean;
  readonly 'incremental-dir': string;
  readonly 'journal-archiving': boolean;
  readonly 'journal-archive-path': string;
  readonly 'include-replicas': boolean;
  readonly password: string;
}

export interface DatabaseBackupOptions extends BaseDatabaseBackupOrRestoreOptions {
  readonly 'lag-limit': number | string;
}

export interface DatabaseRestoreOptions extends BaseDatabaseBackupOrRestoreOptions {
  readonly 'restore-to-time': string;
}
