// deno-lint-ignore-file no-empty-interface
import {
	CategoryType,
	GraphCategoryType,
	ReturnFormatType,
	SparqlOptimizeLevel,
} from './MarkLogicStructuredTypes.ts';

export type MaybeArray<T> = T | T[];

export type primitive = string | bigint | number | boolean | null | undefined;
/** Alias for data that should be a well-formatted XML string */
export type XML = string;

export type Parameters = Record<string, MaybeArray<primitive>>;

type TimestampType = string | bigint;

/** Query configuration */
export interface BaseConfigQueryOptions extends Parameters {
	readonly name: string;
}

export interface DeleteConfigQueryOptions extends BaseConfigQueryOptions {}
export interface GetConfigQueryOptions extends BaseConfigQueryOptions {
	readonly format?: ReturnFormatType;
}
export interface PostConfigQueryOptions extends BaseConfigQueryOptions {
	readonly format?: ReturnFormatType;
}
export interface PutConfigQueryOptions extends BaseConfigQueryOptions {
	readonly format?: ReturnFormatType;
}

/** Query configuration element modification */
export interface BaseConfigQueryElementOptions extends Parameters {
	readonly name: string;
	readonly 'child-element': string;
}

export interface DeleteConfigQueryElementOptions extends BaseConfigQueryElementOptions {}
export interface GetConfigQueryElementOptions extends BaseConfigQueryElementOptions {
	readonly format?: ReturnFormatType;
}
export interface PostConfigQueryElementOptions extends BaseConfigQueryElementOptions {
	readonly format?: ReturnFormatType;
}
export interface PutConfigQueryElementOptions extends BaseConfigQueryElementOptions {
	readonly format?: ReturnFormatType;
}

/** Document management */
export interface BaseDocumentsOptions extends Parameters {
	readonly database?: string;
	readonly txid?: primitive;
}

export interface DeleteDocumentsOptions extends BaseDocumentsOptions {
	readonly uri: MaybeArray<string>;

	readonly category?: MaybeArray<CategoryType>;
	readonly 'temporal-collection'?: string;
	readonly 'system-time'?: primitive;
	readonly 'result=wiped'?: boolean;
	readonly result?: 'wiped';
}
export interface GetDocumentsOptions extends BaseDocumentsOptions {
	readonly uri: MaybeArray<string>;

	readonly category?: MaybeArray<CategoryType>;
	readonly format?: ReturnFormatType;
	readonly timestamp?: TimestampType;
	readonly transform?: string;
}
export interface HeadDocumentsOptions extends BaseDocumentsOptions {
	readonly uri: string;

	readonly category?: MaybeArray<CategoryType>;
	readonly format?: ReturnFormatType;
}
export interface PatchDocumentsOptions extends BaseDocumentsOptions {
	readonly uri: string;

	readonly category?: MaybeArray<CategoryType>;
	readonly format?: ReturnFormatType;
	readonly 'temporal-collection'?: string;
	readonly 'temporal-document'?: string;
	readonly 'source-document'?: string;
	readonly 'system-time'?: primitive;
}
export interface PostDocumentsOptions extends BaseDocumentsOptions {
	readonly 'temporal-collection'?: string;
	readonly transform?: string;
	readonly 'system-time'?: primitive;
}
export interface PutDocumentsOptions extends BaseDocumentsOptions {
	readonly uri: string;

	readonly category?: MaybeArray<CategoryType>;
	readonly collection?: string;
	readonly extract?: 'properties' | 'document';
	readonly 'forest-name'?: string;
	readonly format?: ReturnFormatType;
	readonly lang?: string;
	readonly quality?: number;
	readonly repair?: 'none' | 'full';
	readonly 'temporal-collection'?: string;
	readonly 'temporal-document'?: string;
	readonly transform?: string;
	readonly 'system-time'?: primitive;
}

/** Search */
export interface BaseSearchOptions extends Parameters {
	readonly collection?: string;
	readonly database?: string;
	readonly directory?: string;
	readonly txid?: primitive;
}

export interface DeleteSearchOptions extends BaseSearchOptions {}
export interface GetSearchOptions extends BaseSearchOptions {
	readonly 'forest-name'?: MaybeArray<string>;
	readonly category?: MaybeArray<CategoryType>;
	readonly format?: ReturnFormatType;
	readonly options?: string;
	readonly pageLength?: number;
	readonly q?: string;
	readonly start?: number;
	readonly structuredQuery?: string;
	readonly timestamp?: TimestampType;
	readonly transform?: string;
	readonly view?: 'facets' | 'results' | 'metadata' | 'all';
}
export interface PostSearchOptions extends GetSearchOptions {
	readonly structuredQuery?: never;
}

/** Transaction Management */
export interface BaseTransactionOptions extends Parameters {
	readonly database?: string;
	readonly txid: primitive;
}

export interface GetTransactionOptions extends BaseTransactionOptions {
	readonly format?: ReturnFormatType;
}
export interface PostTransactionOptions extends BaseTransactionOptions {
	readonly result: 'commit' | 'rollback';
}

/** Semantic Graph Management */
export interface BaseGraphOptions extends Parameters {
	readonly database?: string;
	readonly graph?: string;
	readonly default?: boolean;
	readonly category?: GraphCategoryType;
	readonly txid?: primitive;
}

export interface DeleteGraphOptions extends BaseGraphOptions {}
export interface GetGraphOptions extends BaseGraphOptions {
	readonly timestamp?: TimestampType;
}
export interface HeadGraphOptions extends BaseGraphOptions {
	readonly category: never;
}
export interface PostGraphOptions extends BaseGraphOptions {
	readonly repair?: boolean;
}
export interface PutGraphOptions extends BaseGraphOptions {
	readonly repair?: boolean;
}

/** SPARQL Queries */
export interface BaseSparqlOptions extends Parameters {
	readonly 'default-graph-uri'?: MaybeArray<string>;
	readonly 'named-graph-uri'?: MaybeArray<string>;
	readonly database?: string;
	readonly dedup?: 'on' | 'off';
	readonly base?: string;
	readonly txid?: primitive;
	readonly start?: number;
	readonly pageLength?: number;
	readonly q?: string;
	readonly structuredQuery?: string;
	readonly options?: string;
	readonly collection?: MaybeArray<string>;
	readonly directory?: string;
	readonly optimize?: SparqlOptimizeLevel;
	readonly ruleset?: MaybeArray<string>;
	readonly 'default-rulesets'?: 'include' | 'exclude';
	readonly timestamp?: TimestampType;
}

export interface GetSparqlOptions extends BaseSparqlOptions {
	readonly query: string;
}
export interface PostSparqlOptions extends BaseSparqlOptions {
	readonly query?: string;
	readonly update?: string;
	readonly 'using-graph-uri'?: MaybeArray<string>;
	readonly 'using-named-graph-uri'?: MaybeArray<string>;
	/** @deprecated */
	readonly 'default-permissions'?: string;
}

/** Semantic Graph Things */
export interface BaseGraphThingsOptions extends Parameters {
	readonly database?: string;
}

export interface GetGraphThingsOptions extends BaseGraphThingsOptions {
	readonly iri?: MaybeArray<string>;
}

/** Alerts */
export interface BaseAlertOptions extends Parameters {
  readonly db: string | number;

  readonly format?: 'html' | 'json' | 'xml';
}

export interface AlertActionsOptions extends BaseAlertOptions {
  readonly uri?: string;
  readonly name?: string;
}

export interface AlertActionOptions extends BaseAlertOptions {
  readonly action: string;
  readonly uri: string;
}

export interface AlertActionRulesOptions extends AlertActionsOptions {
  readonly action: string;
}

export interface AlertActionRuleOptions extends AlertActionOptions {
  readonly rule: string;
}

export interface AlertPropertiesOptions extends BaseAlertOptions {
  readonly uri?: string;
  readonly name?: string;
}

export interface AlertConfigOptions extends AlertPropertiesOptions {
  readonly uri: string;
}

export interface AlertPropertiesDeleteConfigOptions extends AlertConfigOptions {
  readonly 'delete-triggers'?: boolean;
}

export interface AlertTriggersOptions extends BaseAlertOptions {
  readonly uri?: string;
  readonly name?: string;
}

export interface AlertTriggerOptions extends BaseAlertOptions {
  readonly trigger: string | number;
}

/** Content Processing Framework */
export interface BaseCpfOptions extends Parameters {
  readonly db: string | number;

  readonly format?: 'html' | 'json' | 'xml';
}

export type CpfConfigsOptions = BaseCpfOptions;

export interface CpfConfigDomainOptions extends CpfConfigsOptions {
  readonly domain: string | number;
}

export interface CpfConfigPipelineOptions extends CpfConfigsOptions {
  readonly pipeline: string | number;
}

/** Databases */

export interface BaseDatabaseOptions extends Parameters {
  readonly format?: 'html' | 'json' | 'xml';
}

export interface DatabasesOptions extends BaseDatabaseOptions {
  readonly view?: 'schema' | 'metrics' | 'package' | 'default';
}

export interface DatabaseOptions extends BaseDatabaseOptions {
  readonly db: string | number;

  readonly view?: 'counts' | 'edit' | 'status' | 'package' | 'default';
}

export interface DeleteDatabaseOptions extends DatabaseOptions {
  readonly 'forest-delete'?: boolean;
}

export interface JobCreatedResponse {
  readonly 'job-id': string | number;
  readonly 'host-name': string;
}

export interface JobStatusResponse extends JobCreatedResponse {
  readonly status: string;
}

export interface CancelJobResponse {
  readonly 'job-id': string | number;
  readonly canceled: boolean;
}

/** Flexible Replication */
export interface BaseFlexrepOptions extends Parameters {
  readonly format?: 'html' | 'json' | 'xml';
}

export interface DbFlexrepOptions extends BaseFlexrepOptions {
  readonly db: string | number;
}

export interface DbFlexrepPropertiesOptions extends DbFlexrepOptions {
  readonly config: string | number;
}

export interface DbFlexrepTargetOptions extends DbFlexrepPropertiesOptions {
  readonly target: string | number;
}

export interface DbFlexrepPullConfigOptions extends DbFlexrepOptions {
  readonly pull: string | number;
}

export interface BaseFlexrepDomainOptions extends BaseFlexrepOptions {
  readonly domain: string | number;
}

export interface FlexrepDomainStatusOptions extends BaseFlexrepDomainOptions {
  readonly 'with-targets'?: boolean;
}

export interface FlexrepDomainTargetOptions extends BaseFlexrepDomainOptions {
  readonly target: string | number;
}

export interface FlexrepDomainTargetRuleOptions extends FlexrepDomainTargetOptions {
  readonly rule: string | number;
}
