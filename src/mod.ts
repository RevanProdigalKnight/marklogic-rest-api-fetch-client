import * as StructuredType from './MarkLogicStructuredTypes.ts';
import * as RestAPIType from './MarkLogicRestAPITypes.ts';

import { XML } from './MarkLogicRestAPITypes.ts';

import { AuthClient, AuthClientMethod } from './AuthClient.ts';
import PatchBuilder from './PatchBuilder.ts';
import QueryBuilder from './QueryBuilder.ts';
import { homogenizeBodyData, parseMultipartMixed } from './HttpBodyUtils.ts';

export type { AuthClientMethod } from './AuthClient.ts';
export * from './MarkLogicStructuredTypes.ts';
export * from './MarkLogicRestAPITypes.ts';
export { default as PatchBuilder } from './PatchBuilder.ts';
export { default as QueryBuilder } from './QueryBuilder.ts';
export * from './QueryBuilder.ts';

import EndpointBuilder, { EndpointMethodImplementation, ExtendedRequestInit } from './EndpointBuilder.ts';
import { SimpleConsole } from './UtilityTypes.ts';
export { default as EndpointBuilder } from './EndpointBuilder.ts';

export type ArrayType<T> = T extends unknown[] ? T : never;

export interface AuthOptions {
  readonly method?: AuthClientMethod;
  readonly username?: string;
  readonly password?: string;
  readonly options?: Record<string, unknown>;
}

export interface MarkLogicRestAPIClientOptions {
  readonly auth?: AuthClientMethod | AuthOptions;
  readonly baseURI?: string;
  readonly defaultHeaders?: HeadersInit;
  readonly logger?: SimpleConsole;
}

export default class MarkLogicRestAPIClient<CE extends Record<string, unknown> = Record<string, never>> {
  readonly #defaultImplementation: EndpointMethodImplementation = (init => this.#fetch(init));

  readonly #baseURI: string;
  readonly #authClient: AuthClient;
  readonly #defaultHeaders: HeadersInit;
  readonly #logger?: SimpleConsole;

	public readonly PatchBuilder = PatchBuilder;
	public readonly QueryBuilder = QueryBuilder;
	public readonly QB = QueryBuilder;

	public readonly customMethods = {} as CE;

	public constructor(options: MarkLogicRestAPIClientOptions = {}) {
    this.#baseURI = options.baseURI ?? '/';
    this.#defaultHeaders = options.defaultHeaders ?? {};
    this.#logger = options.logger;

    const auth = typeof options.auth === 'string'
      ? { method: options.auth as AuthClientMethod }
      : { method: 'none' as AuthClientMethod, ...options.auth }
      ;
    this.#authClient = AuthClient.create(auth.method, { logger: this.#logger, ...auth.options });
	}

	public get fetch() {
		return this.#fetch;
	}

  public get isLoggedIn() {
    return this.#authClient.isLoggedIn;
  }

  public login(username: string, password: string) {
    return Promise.resolve(this.#authClient.login(this.#getRequestURL('.', {}), username, password));
  }

  public logout() {
    return Promise.resolve(this.#authClient.logout());
  }

	#configQuery = this.#endpoint('./v1/config/query/:name')
		.withDelete<RestAPIType.DeleteConfigQueryOptions>()
		.withGet<RestAPIType.GetConfigQueryOptions>()
		.withPost<RestAPIType.PostConfigQueryOptions>()
		.withPut<RestAPIType.PutConfigQueryOptions>()
		.build();

	// NOTE: For now limit to using XML query options because documentation on JSON query options is shit
	public createQueryConfig<T extends RestAPIType.PostConfigQueryOptions>(name: NonNullable<T['name']>, config: XML/*StructuredType.QueryConfig*/, options?: Omit<T, 'name'>) {
		return this.#configQuery.post({ ...options, name }, { data: config });
	}

	// NOTE: For now limit to using XML query options because documentation on JSON query options is shit
	public createDefaultQueryConfig<T extends RestAPIType.PostConfigQueryOptions>(config: XML/*StructuredType.QueryConfig*/, options?: Omit<T, 'name'>) {
		return this.#configQuery.post({ ...options, name: 'default' }, { data: config });
	}

	public deleteQueryConfig<T extends RestAPIType.DeleteConfigQueryOptions>(name: NonNullable<T['name']>, options?: Omit<T, 'name'>) {
		return this.#configQuery.delete({ ...options, name });
	}

	public deleteDefaultQueryConfig<T extends RestAPIType.DeleteConfigQueryOptions>(options?: Omit<T, 'name'>) {
		return this.#configQuery.delete({ ...options, name: 'default' });
	}

	public getQueryConfig<T extends RestAPIType.GetConfigQueryOptions>(name: NonNullable<T['name']>, options?: Omit<T, 'name'>) {
		return this.#configQuery.get({ ...options, name });
	}

	public getDefaultQueryConfig<T extends RestAPIType.GetConfigQueryOptions>(options?: Omit<T, 'name'>) {
		return this.#configQuery.get({ ...options, name: 'default' });
	}

	// NOTE: For now limit to using XML query options because documentation on JSON query options is shit
	public updateQueryConfig<T extends RestAPIType.PutConfigQueryOptions>(name: NonNullable<T['name']>, config: XML/*StructuredType.QueryConfig*/, options?: Omit<T, 'name'>) {
		return this.#configQuery.put({ ...options, name }, { data: config });
	}

	// NOTE: For now limit to using XML query options because documentation on JSON query options is shit
	public updateDefaultQueryConfig<T extends RestAPIType.PutConfigQueryOptions>(config: XML/*StructuredType.QueryConfig*/, options?: Omit<T, 'name'>) {
		return this.#configQuery.put({ ...options, name: 'default' }, { data: config });
	}

	#configQueryElement = this.#endpoint('./v1/config/query/:name/:child-element')
		.withDelete<RestAPIType.DeleteConfigQueryElementOptions>()
		.withGet<RestAPIType.GetConfigQueryElementOptions>()
		.withPost<RestAPIType.PostConfigQueryElementOptions>()
		.withPut<RestAPIType.PutConfigQueryElementOptions>()
		.build();

	// NOTE: For now limit to using XML query options because documentation on JSON query options is shit
	public createQueryConfigElement<T extends RestAPIType.PostConfigQueryElementOptions>(name: NonNullable<T['name']>, element: NonNullable<T['child-element']>, config: XML/*StructuredType.QueryConfig*/, options?: Omit<T, 'name' | 'child-element'>) {
		return this.#configQueryElement.post({ ...options, name, 'child-element': element }, { data: config });
	}

	// NOTE: For now limit to using XML query options because documentation on JSON query options is shit
	public createDefaultQueryConfigElement<T extends RestAPIType.PostConfigQueryElementOptions>(element: NonNullable<T['child-element']>, config: XML/*StructuredType.QueryConfig*/, options?: Omit<T, 'name' | 'child-element'>) {
		return this.#configQueryElement.post({ ...options, name: 'default', 'child-element': element }, { data: config });
	}

	public deleteQueryConfigElement<T extends RestAPIType.DeleteConfigQueryElementOptions>(name: NonNullable<T['name']>, element: NonNullable<T['child-element']>, options?: Omit<T, 'name' | 'child-element'>) {
		return this.#configQueryElement.delete({ ...options, name, 'child-element': element });
	}

	public deleteDefaultQueryConfigElement<T extends RestAPIType.DeleteConfigQueryElementOptions>(element: NonNullable<T['child-element']>, options?: Omit<T, 'name' | 'child-element'>) {
		return this.#configQueryElement.delete({ ...options, name: 'default', 'child-element': element });
	}

	public getQueryConfigElement<T extends RestAPIType.GetConfigQueryElementOptions>(name: NonNullable<T['name']>, element: NonNullable<T['child-element']>, options?: Omit<T, 'name' | 'child-element'>) {
		return this.#configQueryElement.get({ ...options, name, 'child-element': element });
	}

	public getDefaultQueryConfigElement<T extends RestAPIType.GetConfigQueryElementOptions>(element: NonNullable<T['child-element']>, options?: Omit<T, 'name' | 'child-element'>) {
		return this.#configQueryElement.get({ ...options, name: 'default', 'child-element': element });
	}

	// NOTE: For now limit to using XML query options because documentation on JSON query options is shit
	public updateQueryConfigElement<T extends RestAPIType.PutConfigQueryElementOptions>(name: NonNullable<T['name']>, element: NonNullable<T['child-element']>, config: XML/*StructuredType.QueryConfig*/, options?: Omit<T, 'name' | 'child-element'>) {
		return this.#configQueryElement.put({ ...options, name, 'child-element': element }, { data: config });
	}

	// NOTE: For now limit to using XML query options because documentation on JSON query options is shit
	public updateDefaultQueryConfigElement<T extends RestAPIType.PutConfigQueryElementOptions>(element: NonNullable<T['child-element']>, config: XML/*StructuredType.QueryConfig*/, options?: Omit<T, 'name' | 'child-element'>) {
		return this.#configQueryElement.put({ ...options, name: 'default', 'child-element': element }, { data: config });
	}

	#documents = this.#endpoint('./v1/documents')
		.withDelete<RestAPIType.DeleteDocumentsOptions>()
		.withGet<RestAPIType.GetDocumentsOptions>()
		.withHead<RestAPIType.HeadDocumentsOptions>()
		.withPatch<RestAPIType.PatchDocumentsOptions>()
		.withPost<RestAPIType.PostDocumentsOptions>()
		.withPut<RestAPIType.PutDocumentsOptions>()
		.build();

	public deleteDocument<T extends RestAPIType.DeleteDocumentsOptions>(uri: NonNullable<T['uri']>, options?: Omit<T, 'uri'>) {
		return this.#documents.delete({ ...options, uri });
	}

	public deleteDocumentMetadata<T extends RestAPIType.DeleteDocumentsOptions>(uri: NonNullable<T['uri']>, options?: Omit<T, 'uri' | 'category'>) {
		return this.#documents.delete({ ...options, uri, category: 'metadata' });
	}

	public deleteDocuments<T extends RestAPIType.DeleteDocumentsOptions>(uris: ArrayType<NonNullable<T['uri']>>, options?: Omit<T, 'uri'>) {
		return this.deleteDocument(uris, options);
	}

	public getDocument<T extends RestAPIType.GetDocumentsOptions>(uri: NonNullable<T['uri']>, options?: Omit<T, 'uri'>) {
		return this.#documents.get({ ...options, uri });
	}

	public getDocuments<T extends RestAPIType.GetDocumentsOptions>(uris: ArrayType<NonNullable<T['uri']>>, options?: Omit<T, 'uri'>) {
    if (uris.length === 1) {
      return this.getDocument(uris[0] as NonNullable<T['uri']>, options).then(doc => [doc]);
    }

		return this.#documents
			.get({ ...options, uri: uris }, { headers: { Accept: 'multipart/mixed' } })
			.then(async resp => [resp.headers.get('Content-Type'), await resp.arrayBuffer()] as [string, ArrayBuffer])
			.then(([contentType, body]) => {
				const boundary = (contentType.match(/(?<=boundary=)"?(.*?)(?=[";]|$)/) ?? []).pop();

				if (!boundary) {
					throw new Error('Unable to parse boundary from Content-Type header!');
				}

				return parseMultipartMixed(boundary, body);
			});
	}

	public getDocumentHeaders<T extends RestAPIType.HeadDocumentsOptions>(uri: NonNullable<T['uri']>, options?: Omit<T, 'uri'>) {
		return this.#documents.head({ ...options, uri });
	}

  // NOTE: Alias for insertDocument
  public createDocument<T extends RestAPIType.PutDocumentsOptions>(uri: NonNullable<T['uri']>, document: NonNullable<ExtendedRequestInit['data']>, options?: Omit<T, 'uri'>) {
    return this.insertDocument(uri, document, options);
  }

	public insertDocument<T extends RestAPIType.PutDocumentsOptions>(uri: NonNullable<T['uri']>, document: NonNullable<ExtendedRequestInit['data']>, options?: Omit<T, 'uri'>) {
    // NOTE: Multi-document insert uses POST, single-document uses PUT
		return this.#documents.put({ ...options, uri }, { data: document });
	}

	public patchDocument<T extends RestAPIType.PatchDocumentsOptions>(uri: NonNullable<T['uri']>, patch: string | { readonly patch: StructuredType.JsonPatchDescriptor[] }, options?: Omit<T, 'uri'>) {
		return this.#documents.patch({ ...options, uri }, { data: patch, headers: { 'Content-Type': typeof patch === 'string' ? 'application/xml' : 'application/json' } });
	}

	public updateDocument<T extends RestAPIType.PutDocumentsOptions>(uri: NonNullable<T['uri']>, document: NonNullable<ExtendedRequestInit['data']>, options?: Omit<T, 'uri'>) {
		return this.#documents.put({ ...options, uri }, { data: document });
	}

	#search = this.#endpoint('./v1/search')
		.withDelete<RestAPIType.DeleteSearchOptions>()
		.withGet<RestAPIType.GetSearchOptions, StructuredType.SearchResults>()
		.withPost<RestAPIType.PostSearchOptions, StructuredType.SearchResults>()
		.build();

  // NOTE: Commented because of function name conflict with POST /manage/v2/databases/:db { operation: 'clear-database' }
	// public clearDatabase<T extends RestAPIType.DeleteSearchOptions>(database: NonNullable<T['database']>, options?: Omit<T, 'database'>) {
	// 	return this.#search.delete({ ...options, database });
	// }

	public deleteCollection<T extends RestAPIType.DeleteSearchOptions>(collection: NonNullable<T['collection']>, options?: Omit<T, 'collection'>) {
		return this.#search.delete({ ...options, collection });
	}

	public deleteDirectory<T extends RestAPIType.DeleteSearchOptions>(directory: NonNullable<T['directory']>, options?: Omit<T, 'directory'>) {
		return this.#search.delete({ ...options, directory });
	}

	public search<T extends RestAPIType.GetSearchOptions>(query: NonNullable<T['q']>, options?: Omit<T, 'q'>) {
		return this.#search.get({ ...options, q: query });
	}

	public structuredQuery<T extends RestAPIType.PostSearchOptions>(query: QueryBuilder, options?: /*Omit<*/T/*, 'structuredQuery'>*/) {
		const builtQuery = query.build();

		// deno-lint-ignore ban-types
		return this.#search.post({ ...options, format: builtQuery.queryFormat }, { data: builtQuery.whereClause! as object, headers: { 'Content-Type': 'application/json' } });
	}

	#graphs = this.#endpoint('./v1/graphs')
		.withDelete<RestAPIType.DeleteGraphOptions>()
		.withGet<RestAPIType.GetGraphOptions>()
		.withHead<RestAPIType.HeadGraphOptions>()
		.withPost<RestAPIType.PostGraphOptions>()
		.withPut<RestAPIType.PutGraphOptions>()
		.build();

	public createGraph<T extends RestAPIType.DeleteGraphOptions>(graph: NonNullable<T['graph']>, options?: Omit<T, 'graph' | 'default'>) {
		return this.#graphs.post({ ...options, graph });
	}

	public createDefaultGraph<T extends RestAPIType.DeleteGraphOptions>(options?: Omit<T, 'graph' | 'default'>) {
		return this.#graphs.post({ ...options, default: true });
	}

	public deleteGraph<T extends RestAPIType.DeleteGraphOptions>(graph: NonNullable<T['graph']>, options?: Omit<T, 'graph' | 'default'>) {
		return this.#graphs.delete({ ...options, graph });
	}

	public deleteDefaultGraph<T extends RestAPIType.DeleteGraphOptions>(options?: Omit<T, 'graph' | 'default'>) {
		return this.#graphs.delete({ ...options, default: true });
	}

	public getGraph<T extends RestAPIType.GetGraphOptions>(graph: NonNullable<T['graph']>, options?: Omit<T, 'graph' | 'default'>) {
		return this.#graphs.get({ ...options, graph });
	}

	public getDefaultGraph<T extends RestAPIType.GetGraphOptions>(options?: Omit<T, 'graph' | 'default'>) {
		return this.#graphs.get({ ...options, default: true });
	}

	public updateGraph<T extends RestAPIType.PutGraphOptions>(graph: NonNullable<T['graph']>, options?: Omit<T, 'graph' | 'default'>) {
		return this.#graphs.put({ ...options, graph });
	}

	public updateDefaultGraph<T extends RestAPIType.PutGraphOptions>(options?: Omit<T, 'graph' | 'default'>) {
		return this.#graphs.put({ ...options, default: true });
	}

	#sparql = this.#endpoint('./v1/graphs/sparql')
		.withGet<RestAPIType.GetSparqlOptions, StructuredType.SparqlResult>()
		.withPost<RestAPIType.PostSparqlOptions>()
		.build();

	public sparqlAsk<T extends RestAPIType.GetSparqlOptions>(query: NonNullable<T['query']>, options?: Omit<T, 'query'>) {
		return this.#sparql.get({ ...options, query }, { headers: { Accept: 'application/sparql-results+json' } });
	}

	public sparqlSelect<R = Record<string, unknown>, T extends RestAPIType.GetSparqlOptions = RestAPIType.GetSparqlOptions>(query: NonNullable<T['query']>, options?: Omit<T, 'query'>) {
		return this.#sparql
			.get({ ...options, query }, { headers: { Accept: 'application/sparql-results+json' } })
			.then(resp => resp.json())
			.then(result => result.results.bindings
				.map(binding => Object.fromEntries(Object.entries(binding)
				.map(([key, value]) => [key, value.value]))) as unknown[] as R[]
    );
	}

	public sparqlUpdate<T extends RestAPIType.PostSparqlOptions>(update: NonNullable<T['update']>, options?: Omit<T, 'update'>) {
		return this.#sparql.post({ ...options }, { headers: { Accept: 'application/sparql-results+json', 'Content-Type': 'application/sparql-update' }, data: update });
	}

	#things = this.#endpoint('./v1/graphs/things')
		.withGet<RestAPIType.GetGraphThingsOptions>()
		.build();

	public getThing<T extends RestAPIType.GetGraphThingsOptions>(iri: NonNullable<T['iri']>, options?: Omit<T, 'iri'>) {
		return this.#things.get({ ...options, iri });
	}

	public getThings<T extends RestAPIType.GetGraphThingsOptions>(iris?: ArrayType<T['iri']>, options?: Omit<T, 'iri'>) {
		return this.#things.get({ ...options, iri: iris });
	}

	#createTransaction = this.#endpoint('./v1/transactions').withPost<void>().build();

	public createTransaction() {
		return this.#createTransaction.post();
	}

	#transactions = this.#endpoint('./v1/transactions/:txid')
		.withGet<RestAPIType.GetTransactionOptions>()
		.withPost<RestAPIType.PostTransactionOptions>()
		.build();

	public getTransactionStatus<T extends RestAPIType.GetTransactionOptions>(txid: T['txid'], database?: T['database'], format?: T['format']) {
		return this.#transactions.get({ txid, database, format });
	}

	public commitTransaction<T extends RestAPIType.PostTransactionOptions>(txid: T['txid'], database?: T['database']) {
		return this.#transactions.post({ txid, database, result: 'commit' });
	}

	public rollbackTransaction<T extends RestAPIType.PostTransactionOptions>(txid: T['txid'], database?: T['database']) {
		return this.#transactions.post({ txid, database, result: 'rollback' });
	}

  #alerts = this.#endpoint<RestAPIType.BaseAlertOptions>('./manage/v2/databases/:db/alert')
    .withGet()
    .build();

  public getAlerts<T extends RestAPIType.BaseAlertOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#alerts.get({ db, ...options });
  }

  #alertActions = this.#endpoint<RestAPIType.AlertActionsOptions>('./manage/v2/databases/:db/alert/actions')
    .withGet()
    .withPost()
    .build();

  public getAlertActions<T extends RestAPIType.AlertActionsOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#alertActions.get({ db, ...options });
  }

  public createAlertAction<T extends RestAPIType.AlertActionsOptions>(db: T['db'], action: StructuredType.AlertAction, options?: Omit<T, 'db'>) {
    return this.#alertActions.post({ db, ...options }, { data: action });
  }

  #alertAction = this.#endpoint<RestAPIType.AlertActionOptions>('./manage/v2/databases/:db/alert/actions/:action')
    .withGet()
    .withDelete()
    .build();

  public getAlertAction<T extends RestAPIType.AlertActionOptions>(db: T['db'], action: T['action'], uri: T['uri'], options?: Omit<T, 'db' | 'action' | 'uri'>) {
    return this.#alertAction.get({ db, action, uri, ...options });
  }

  public deleteAlertAction<T extends RestAPIType.AlertActionOptions>(db: T['db'], action: T['action'], uri: T['uri'], options?: Omit<T, 'db' | 'action' | 'uri'>) {
    return this.#alertAction.delete({ db, action, uri, ...options });
  }

  #alertActionProperties = this.#endpoint<RestAPIType.AlertActionOptions>('./manage/v2/databases/:db/alert/actions/:action/properties')
    .withGet()
    .withPut()
    .build();

  public getAlertActionProperties<T extends RestAPIType.AlertActionOptions>(db: T['db'], action: T['action'], uri: T['uri'], options?: Omit<T, 'db' | 'action' | 'uri'>) {
    return this.#alertActionProperties.get({ db, action, uri, ...options });
  }

  public updateAlertActionProperties<T extends RestAPIType.AlertActionOptions>(db: T['db'], action: T['action'], uri: T['uri'], newAction: StructuredType.AlertAction, options?: Omit<T, 'db' | 'action' | 'uri'>) {
    return this.#alertActionProperties.get({ db, action, uri, ...options }, { data: newAction });
  }

  #alertActionRules = this.#endpoint<RestAPIType.AlertActionRulesOptions>('./manage/v2/databases/:db/alert/actions/:action/rules')
    .withGet()
    .withPost()
    .build();

  public getAlertActionRules<T extends RestAPIType.AlertActionRulesOptions>(db: T['db'], action: T['action'], options?: Omit<T, 'db' | 'action'>) {
    return this.#alertActionRules.get({ db, action, ...options });
  }

  public createAlertActionRule<T extends RestAPIType.AlertActionRulesOptions>(db: T['db'], action: T['action'], rule: StructuredType.AlertActionRule, options?: Omit<T, 'db' | 'action'>) {
    return this.#alertActionRules.post({ db, action, ...options }, { data: rule });
  }

  #alertActionRule = this.#endpoint<RestAPIType.AlertActionRuleOptions>('./manage/v2/databases/:db/alert/actions/:action/rules/:rule')
    .withGet()
    .withDelete()
    .build();

  public getAlertActionRule<T extends RestAPIType.AlertActionRuleOptions>(db: T['db'], action: T['action'], uri: T['uri'], rule: T['rule'], options: Omit<T, 'db' | 'action' | 'rule' | 'uri'>) {
    return this.#alertActionRule.get({ db, action, uri, rule, ...options });
  }

  public deleteAlertActionRule<T extends RestAPIType.AlertActionRuleOptions>(db: T['db'], action: T['action'], uri: T['uri'], rule: T['rule'], options: Omit<T, 'db' | 'action' | 'rule' | 'uri'>) {
    return this.#alertActionRule.delete({ db, action, uri, rule, ...options });
  }

  #alertActionRuleProperties = this.#endpoint<RestAPIType.AlertActionRuleOptions>('./manage/v2/databases/:db/alert/actions/:action/rules/:rule/properties')
    .withGet()
    .withPut()
    .build();

  public getAlertActionRuleProperties<T extends RestAPIType.AlertActionRuleOptions>(db: T['db'], action: T['action'], uri: T['uri'], rule: T['rule'], options: Omit<T, 'db' | 'action' | 'rule' | 'uri'>) {
    return this.#alertActionRuleProperties.get({ db, action, uri, rule, ...options });
  }

  public updateAlertActionRuleProperties<T extends RestAPIType.AlertActionRuleOptions>(db: T['db'], action: T['action'], uri: T['uri'], rule: T['rule'], properties: StructuredType.AlertActionRule, options: Omit<T, 'db' | 'action' | 'rule' | 'uri'>) {
    return this.#alertActionRuleProperties.put({ db, action, uri, rule, ...options }, { data: properties });
  }

  #alertConfigs = this.#endpoint<RestAPIType.AlertPropertiesOptions>('./manage/v2/databases/:db/alert/configs')
    .withGet()
    .withPost()
    .withDelete<RestAPIType.AlertPropertiesDeleteConfigOptions>()
    .build();

  public getAlertConfigs<T extends RestAPIType.AlertPropertiesOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#alertConfigs.get({ db, ...options });
  }

  public createAlertConfig<T extends RestAPIType.AlertPropertiesOptions>(db: T['db'], config: StructuredType.AlertConfig, options?: Omit<T, 'db'>) {
    return this.#alertConfigs.post({ db, ...options }, { data: config });
  }

  public deleteAlertConfig<T extends RestAPIType.AlertPropertiesDeleteConfigOptions>(db: T['db'], uri: T['uri'], options?: Omit<T, 'db' | 'uri'>) {
    return this.#alertConfigs.delete({ db, uri, ...options });
  }

  #alertConfigProperties = this.#endpoint<RestAPIType.AlertConfigOptions>('./manage/v2/databases/:db/alert/configs/properties')
    .withGet()
    .withPut()
    .build();

  public getAlertConfig<T extends RestAPIType.AlertConfigOptions>(db: T['db'], uri: T['uri'], options?: Omit<T, 'db' | 'uri'>) {
    return this.#alertConfigProperties.get({ db, uri, ...options });
  }

  public updateAlertConfig<T extends RestAPIType.AlertConfigOptions>(db: T['db'], uri: T['uri'], config: StructuredType.AlertConfig, options?: Omit<T, 'db' | 'uri'>) {
    return this.#alertConfigProperties.put({ db, uri, ...options }, { data: config });
  }

  #alertTriggers = this.#endpoint<RestAPIType.AlertTriggersOptions>('./manage/v2/databases/:db/triggers')
    .withGet()
    .withPost()
    .build();

  public getAlertTriggers<T extends RestAPIType.AlertTriggersOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#alertTriggers.get({ db, ...options });
  }

  public createAlertTrigger<T extends RestAPIType.AlertTriggersOptions>(db: T['db'], trigger: StructuredType.AlertTrigger, options?: Omit<T, 'db'>) {
    return this.#alertTriggers.post({ db, ...options }, { data: trigger });
  }

  #alertTrigger = this.#endpoint<RestAPIType.AlertTriggerOptions>('./manage/v2/databases/:db/triggers/:trigger')
    .withGet()
    .withDelete()
    .build();

  public getAlertTrigger<T extends RestAPIType.AlertTriggerOptions>(db: T['db'], trigger: T['trigger'], options?: Omit<T, 'db' | 'trigger'>) {
    return this.#alertTrigger.get({ db, trigger, ...options });
  }

  public deleteAlertTrigger<T extends RestAPIType.AlertTriggerOptions>(db: T['db'], trigger: T['trigger'], options?: Omit<T, 'db' | 'trigger'>) {
    return this.#alertTrigger.delete({ db, trigger, ...options });
  }

  #alertTriggerProperties = this.#endpoint<RestAPIType.AlertTriggerOptions>('./manage/v2/databases/:db/triggers/:trigger/properties')
    .withGet()
    .withPut()
    .build();

  public getAlertTriggerProperties<T extends RestAPIType.AlertTriggerOptions>(db: T['db'], trigger: T['trigger'], options?: Omit<T, 'db' | 'trigger'>) {
    return this.#alertTriggerProperties.get({ db, trigger, ...options });
  }

  public updateAlertTriggerProperties<T extends RestAPIType.AlertTriggerOptions>(db: T['db'], trigger: T['trigger'], properties: StructuredType.AlertTrigger, options?: Omit<T, 'db' | 'trigger'>) {
    return this.#alertTriggerProperties.put({ db, trigger, ...options }, { data: properties });
  }

  #cpfConfigs = this.#endpoint<RestAPIType.CpfConfigsOptions>('./manage/v2/databases/:db/cpf-configs')
    .withGet()
    .withPost()
    .build();

  public getCpfConfigs<T extends RestAPIType.CpfConfigsOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#cpfConfigs.get({ db, ...options });
  }

  public createCpfConfig<T extends RestAPIType.CpfConfigsOptions>(db: T['db'], config: StructuredType.CpfConfig, options?: Omit<T, 'db'>) {
    return this.#cpfConfigs.post({ db, ...options }, { data: config });
  }

  #cpfConfigDomain = this.#endpoint<RestAPIType.CpfConfigDomainOptions>('./manage/v2/databases/:db/cpf-configs/:domain')
    .withGet()
    .withDelete()
    .build();

  public getCpfDomainConfig<T extends RestAPIType.CpfConfigDomainOptions>(db: T['db'], domain: T['domain'], options?: Omit<T, 'db' | 'domain'>) {
    return this.#cpfConfigDomain.get({ db, domain, ...options });
  }

  public deleteCpfDomainConfig<T extends RestAPIType.CpfConfigDomainOptions>(db: T['db'], domain: T['domain'], options?: Omit<T, 'db' | 'domain'>) {
    return this.#cpfConfigDomain.delete({ db, domain, ...options });
  }

  #cpfConfigDomainProperties = this.#endpoint<RestAPIType.CpfConfigDomainOptions>('./manage/v2/databases/:db/cpf-configs/:domain/properties')
    .withGet()
    .withPut()
    .build();

  public getCpfDomainConfigProperties<T extends RestAPIType.CpfConfigDomainOptions>(db: T['db'], domain: T['domain'], options?: Omit<T, 'db' | 'domain'>) {
    return this.#cpfConfigDomainProperties.get({ db, domain, ...options });
  }

  public updateCpfDomainConfigProperties<T extends RestAPIType.CpfConfigDomainOptions>(db: T['db'], domain: T['domain'], properties: StructuredType.CpfConfig, options?: Omit<T, 'db' | 'domain'>) {
    return this.#cpfConfigDomainProperties.put({ db, domain, ...options }, { data: properties });
  }

  #cpfDomains = this.#endpoint<RestAPIType.CpfConfigsOptions>('./manage/v2/databases/:db/domains')
    .withGet()
    .withPost()
    .build();

  public getCpfDomains<T extends RestAPIType.CpfConfigsOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#cpfDomains.get({ db, ...options });
  }

  public createCpfDomain<T extends RestAPIType.CpfConfigsOptions>(db: T['db'], domain: StructuredType.CpfDomain, options?: Omit<T, 'db'>) {
    return this.#cpfDomains.post({ db, ...options }, { data: domain });
  }

  #cpfDomain = this.#endpoint<RestAPIType.CpfConfigDomainOptions>('./manage/v2/databases/:db/domains/:domain')
    .withGet()
    .withDelete()
    .build();

  public getCpfDomain<T extends RestAPIType.CpfConfigDomainOptions>(db: T['db'], domain: T['domain'], options?: Omit<T, 'db' | 'domain'>) {
    return this.#cpfDomain.get({ db, domain, ...options });
  }

  public deleteCpfDomain<T extends RestAPIType.CpfConfigDomainOptions>(db: T['db'], domain: T['domain'], options?: Omit<T, 'db' | 'domain'>) {
    return this.#cpfDomain.delete({ db, domain, ...options });
  }

  #cpfDomainProperties = this.#endpoint<RestAPIType.CpfConfigDomainOptions>('./manage/v2/databases/:db/domains/:domain/properties')
    .withGet()
    .withPut()
    .build();

  public getCpfDomainProperties<T extends RestAPIType.CpfConfigDomainOptions>(db: T['db'], domain: T['domain'], options?: Omit<T, 'db' | 'domain'>) {
    return this.#cpfDomainProperties.get({ db, domain, ...options });
  }

  public updateCpfDomainProperties<T extends RestAPIType.CpfConfigDomainOptions>(db: T['db'], domain: T['domain'], properties: StructuredType.CpfDomain, options?: Omit<T, 'db' | 'domain'>) {
    return this.#cpfDomainProperties.put({ db, domain, ...options }, { data: properties });
  }

  #cpfPipelines = this.#endpoint<RestAPIType.CpfConfigsOptions>('./manage/v2/databases/:db/pipelines')
    .withGet()
    .withPost()
    .build();

  public getCpfPipelines<T extends RestAPIType.CpfConfigsOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#cpfPipelines.get({ db, ...options });
  }

  public createCpfPipeline<T extends RestAPIType.CpfConfigsOptions>(db: T['db'], pipeline: StructuredType.CpfPipeline, options?: Omit<T, 'db'>) {
    return this.#cpfPipelines.post({ db, ...options }, { data: pipeline });
  }

  #cpfPipeline = this.#endpoint<RestAPIType.CpfConfigPipelineOptions>('./manage/v2/databases/:db/pipelines/:pipeline')
    .withGet()
    .withDelete()
    .build();

  public getCpfPipeline<T extends RestAPIType.CpfConfigPipelineOptions>(db: T['db'], pipeline: T['pipeline'], options?: Omit<T, 'db' | 'pipeline'>) {
    return this.#cpfPipeline.get({ db, pipeline, ...options });
  }

  public deleteCpfPipeline<T extends RestAPIType.CpfConfigPipelineOptions>(db: T['db'], pipeline: T['pipeline'], options?: Omit<T, 'db' | 'pipeline'>) {
    return this.#cpfPipeline.delete({ db, pipeline, ...options });
  }

  #cpfPipelineProperties = this.#endpoint<RestAPIType.CpfConfigPipelineOptions>('./manage/v2/databases/:db/pipelines/:pipeline/properties')
    .withGet()
    .withPut()
    .build();

  public getCpfPipelineProperties<T extends RestAPIType.CpfConfigPipelineOptions>(db: T['db'], pipeline: T['pipeline'], options?: Omit<T, 'db' | 'pipeline'>) {
    return this.#cpfPipelineProperties.get({ db, pipeline, ...options });
  }

  public updateCpfPipelineProperties<T extends RestAPIType.CpfConfigPipelineOptions>(db: T['db'], pipeline: T['pipeline'], properties: StructuredType.CpfPipeline, options?: Omit<T, 'db' | 'pipeline'>) {
    return this.#cpfPipelineProperties.put({ db, pipeline, ...options }, { data: properties });
  }

  #databases = this.#endpoint('./manage/v2/databases')
    .withGet<RestAPIType.DatabasesOptions>()
    .withPost<RestAPIType.BaseDatabaseOptions>()
    .build();

  public getDatabases<T extends RestAPIType.DatabasesOptions>(options?: T) {
    return this.#databases.get({ ...options });
  }

  public createDatabase<T extends RestAPIType.BaseDatabaseOptions>(db: StructuredType.Database, options?: T) {
    return this.#databases.post({ ...options }, { data: db });
  }

  #database = this.#endpoint<RestAPIType.DatabaseOptions>('./manage/v2/databases/:db')
    .withGet()
    .withPost()
    .withDelete<RestAPIType.DeleteDatabaseOptions>()
    .build();

  public getDatabase<T extends RestAPIType.DatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#database.get({ db, ...options });
  }

  public clearDatabase<T extends RestAPIType.DatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#database.post({ db, ...options }, { data: { operation: 'clear-database' } });
  }

  public backupDatabase<T extends RestAPIType.DatabaseOptions>(db: T['db'], backupOptions: StructuredType.DatabaseBackupOptions, options?: Omit<T, 'db'>) {
    return this.#database.post<RestAPIType.JobCreatedResponse>({ db, ...options }, { data: { operation: 'backup-database', ...backupOptions } });
  }

  public validateDatabaseBackup<T extends RestAPIType.DatabaseOptions>(db: T['db'], backupOptions: StructuredType.DatabaseBackupOptions, options?: Omit<T, 'db'>) {
    return this.#database.post({ db, ...options }, { data: { operation: 'backup-validate', ...backupOptions } });
  }

  public getDatabaseBackupStatus<T extends RestAPIType.DatabaseOptions, K extends RestAPIType.JobCreatedResponse>(db: T['db'], jobId: K['job-id'], hostName?: K['host-name'], options?: Omit<T, 'db'>) {
    return this.#database.post<RestAPIType.JobStatusResponse>({ db, ...options }, { data: { operation: 'backup-status', 'job-id': jobId, 'host-name': hostName } });
  }

  public cancelDatabaseBackup<T extends RestAPIType.DatabaseOptions>(db: T['db'], jobId: RestAPIType.JobCreatedResponse['job-id'], options?: Omit<T, 'db'>) {
    return this.#database.post<RestAPIType.CancelJobResponse>({ db, ...options }, { data: { operation: 'backup-cancel', 'job-id': jobId } });
  }

  public purgeBackups<T extends RestAPIType.DatabaseOptions>(db: T['db'], backupDir: string, keepNumBackups: number, options?: Omit<T, 'db'>) {
    return this.#database.post<{ readonly purged: boolean }>({ db, ...options }, { data: { operation: 'backup-purge', 'backup-dir': backupDir, 'keep-num-backups': keepNumBackups } });
  }

  public restoreDatabase<T extends RestAPIType.DatabaseOptions>(db: T['db'], restoreOptions: StructuredType.DatabaseRestoreOptions, options?: Omit<T, 'db'>) {
    return this.#database.post<RestAPIType.JobCreatedResponse>({ db, ...options }, { data: { operation: 'restore-database', ...restoreOptions } });
  }

  public validateDatabaseRestore<T extends RestAPIType.DatabaseOptions>(db: T['db'], restoreOptions: StructuredType.DatabaseRestoreOptions, options?: Omit<T, 'db'>) {
    return this.#database.post({ db, ...options }, { data: { operation: 'restore-validate', ...restoreOptions } });
  }

  public getDatabaseRestoreStatus<T extends RestAPIType.DatabaseOptions>(db: T['db'], jobId: RestAPIType.JobCreatedResponse['job-id'], options?: Omit<T, 'db'>) {
    return this.#database.post<RestAPIType.JobStatusResponse>({ db, ...options }, { data: { operation: 'restore-status', 'job-id': jobId } });
  }

  public cancelDatabaseRestore<T extends RestAPIType.DatabaseOptions>(db: T['db'], jobId: RestAPIType.JobCreatedResponse['job-id'], options?: Omit<T, 'db'>) {
    return this.#database.post<RestAPIType.CancelJobResponse>({ db, ...options }, { data: { operation: 'restore-cancel', 'job-id': jobId } });
  }

  public mergeDatabase<T extends RestAPIType.DatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#database.post<void>({ db, ...options }, { data: { operation: 'merge-database' } });
  }

  public reindexDatabase<T extends RestAPIType.DatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#database.post<void>({ db, ...options }, { data: { operation: 'reindex-database' } });
  }

  public setDatabaseDefaults<T extends RestAPIType.DatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#database.post<void>({ db, ...options }, { data: { operation: 'set-database-defaults' } });
  }

  public addForeignReplicas<T extends RestAPIType.DatabaseOptions>(db: T['db'], foreignReplicas: StructuredType.DatabaseForeignReplica['foreign-replica'][], options?: Omit<T, 'db'>) {
    return this.#database.post({ db, ...options }, { data: { operation: 'add-foreign-replicas', 'foreign-replica': foreignReplicas } });
  }

  public removeForeignReplicas<T extends RestAPIType.DatabaseOptions>(db: T['db'], foreignDatabases: StructuredType.DatabaseForeignReplica['foreign-replica']['foreign-database-name'][], options?: Omit<T, 'db'>) {
    return this.#database.post({ db, ...options }, { data: { operation: 'remove-foreign-replicas', 'foreign-database-name': foreignDatabases } });
  }

  public setForeignMaster<T extends RestAPIType.DatabaseOptions>(db: T['db'], foreignMaster: StructuredType.DatabaseForeignMaster, options?: Omit<T, 'db'>) {
    return this.#database.post({ db, ...options }, { data: { operation: 'set-foreign-master', 'foreign-master': foreignMaster } });
  }

  public removeForeignMaster<T extends RestAPIType.DatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#database.post({ db, ...options }, { data: { operation: 'remove-foreign-master' } });
  }

  public rollbackForestsToNonblockingTimestamp<T extends RestAPIType.DatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#database.post({ db, ...options }, { data: { operation: 'rollback-forests-to-nonblocking-timestamp' } });
  }

  public validateReplicaIndexes<T extends RestAPIType.DatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#database.post({ db, ...options }, { data: { operation: 'validate-replica-indexes' } });
  }

  public suspendDatabaseReplication<T extends RestAPIType.DatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#database.post({ db, ...options }, { data: { operation: 'suspend-database-replication' } });
  }

  public resumeDatabaseReplication<T extends RestAPIType.DatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#database.post({ db, ...options }, { data: { operation: 'resume-database-replication' } });
  }

  public deleteDatabase<T extends RestAPIType.DeleteDatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#database.delete({ db, ...options });
  }

  #databaseProperties = this.#endpoint<RestAPIType.DatabaseOptions>('./manage/v2/databases/:db/properties')
    .withGet()
    .withPut()
    .build();

  public getDatabaseProperties<T extends RestAPIType.DatabaseOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#databaseProperties.get({ db, ...options });
  }

  public updateDatabaseProperties<T extends RestAPIType.DatabaseOptions>(db: T['db'], properties: StructuredType.Database, options?: Omit<T, 'db'>) {
    return this.#databaseProperties.put({ db, ...options }, { data: properties });
  }

  #flexrepDomains = this.#endpoint<RestAPIType.BaseFlexrepOptions>('./manage/v1/domains')
    .withGet()
    .build();

  public getFlexrepDomains<T extends RestAPIType.BaseFlexrepOptions>(options?: T) {
    return this.#flexrepDomains.get({ ...options });
  }

  #flexrepConfigs = this.#endpoint<RestAPIType.DbFlexrepOptions>('./manage/v2/databases/:id/flexrep')
    .withGet()
    .build();

  public getFlexrepConfigs<T extends RestAPIType.DbFlexrepOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#flexrepConfigs.get({ db, ...options });
  }

  #pushFlexrepConfigs = this.#endpoint<RestAPIType.DbFlexrepOptions>('./manage/v2/databases/:id/flexrep/configs')
    .withGet()
    .withPost()
    .withDelete()
    .build();

  public getPushFlexrepConfigs<T extends RestAPIType.DbFlexrepOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#pushFlexrepConfigs.get({ db, ...options });
  }

  public createPushFlexrepConfig<T extends RestAPIType.DbFlexrepOptions>(db: T['db'], config: StructuredType.PushFlexrepConfig, options?: Omit<T, 'db'>) {
    return this.#pushFlexrepConfigs.post({ db, ...options }, { data: config });
  }

  public deletePushFlexrepConfig<T extends RestAPIType.DbFlexrepOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#pushFlexrepConfigs.delete({ db, ...options });
  }

  #flexrepConfigProperties = this.#endpoint<RestAPIType.DbFlexrepPropertiesOptions>('./manage/v2/databases/:db/flexrep/configs/:config/properties')
    .withGet()
    .withPut()
    .build();

  public getFlexrepConfigProperties<T extends RestAPIType.DbFlexrepPropertiesOptions>(db: T['db'], config: T['config'], options?: Omit<T, 'db' | 'config'>) {
    return this.#flexrepConfigProperties.get({ db, config, ...options });
  }

  public updateFlexrepConfigProperty<T extends RestAPIType.DbFlexrepPropertiesOptions>(db: T['db'], config: T['config'], properties: StructuredType.PushFlexrepPropertyConfig, options?: Omit<T, 'db' | 'config'>) {
    return this.#flexrepConfigProperties.get({ db, config, ...options }, { data: properties });
  }

  #flexrepConfigTargets = this.#endpoint<RestAPIType.DbFlexrepPropertiesOptions>('./manage/v2/databases/:db/flexrep/configs/:config/targets')
    .withGet()
    .withPost()
    .build();

  public getFlexrepConfigTargets<T extends RestAPIType.DbFlexrepPropertiesOptions>(db: T['db'], config: T['config'], options?: Omit<T, 'db' | 'config'>) {
    return this.#flexrepConfigTargets.get({ db, config, ...options });
  }

  public createFlexrepConfigTarget<T extends RestAPIType.DbFlexrepPropertiesOptions>(db: T['db'], config: T['config'], target: StructuredType.PushFlexrepTargetConfig, options?: Omit<T, 'db' | 'config'>) {
    return this.#flexrepConfigTargets.post({ db, config, ...options }, { data: target });
  }

  #flexrepConfigTarget = this.#endpoint<RestAPIType.DbFlexrepTargetOptions>('./manage/v2/databases/:db/flexrep/configs/:config/targets/:target')
    .withGet()
    .withDelete()
    .build();

  public getFlexrepConfigTarget<T extends RestAPIType.DbFlexrepTargetOptions>(db: T['db'], config: T['config'], target: T['target'], options?: Omit<T, 'db' | 'config' | 'target'>) {
    return this.#flexrepConfigTarget.get({ db, config, target, ...options });
  }

  public deleteFlexrepConfigTarget<T extends RestAPIType.DbFlexrepTargetOptions>(db: T['db'], config: T['config'], target: T['target'], options?: Omit<T, 'db' | 'config' | 'target'>) {
    return this.#flexrepConfigTarget.delete({ db, config, target, ...options });
  }

  #flexrepConfigTargetProperties = this.#endpoint<RestAPIType.DbFlexrepTargetOptions>('./manage/v2/databases/:db/flexrep/configs/:config/targets/:target/properties')
    .withGet()
    .withPut()
    .build();

  public getFlexrepConfigTargetProperties<T extends RestAPIType.DbFlexrepTargetOptions>(db: T['db'], config: T['config'], target: T['target'], options?: Omit<T, 'db' | 'config' | 'target'>) {
    return this.#flexrepConfigTargetProperties.get({ db, config, target, ...options });
  }

  public updateFlexrepConfigTargetProperties<T extends RestAPIType.DbFlexrepTargetOptions>(db: T['db'], config: T['config'], target: T['target'], properties: StructuredType.PushFlexrepTargetConfig, options?: Omit<T, 'db' | 'config' | 'target'>) {
    return this.#flexrepConfigTargetProperties.put({ db, config, target, ...options }, { data: properties });
  }

  #flexrepProperties = this.#endpoint<RestAPIType.DbFlexrepOptions>('./manage/v2/databases/:db/flexrep/properties')
    .withGet()
    .withPut()
    .build();

  public getInboundFlexrepProperties<T extends RestAPIType.DbFlexrepOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#flexrepProperties.get({ db, ...options });
  }

  public updateInboundFlexrepProperties<T extends RestAPIType.DbFlexrepOptions>(db: T['db'], properties: StructuredType.InboundFlexrepProperties, options?: Omit<T, 'db'>) {
    return this.#flexrepProperties.put({ db, ...options }, { data: properties });
  }

  #flexrepPullConfigurations = this.#endpoint<RestAPIType.DbFlexrepOptions>('./manage/v2/databases/:db/flexrep/pulls')
    .withGet()
    .withPost()
    .build();

  public getFlexrepPullConfigurations<T extends RestAPIType.DbFlexrepOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#flexrepPullConfigurations.get({ db, ...options });
  }

  public createFlexrepPullConfiguration<T extends RestAPIType.DbFlexrepOptions>(db: T['db'], config: StructuredType.FlexrepPullConfig, options?: Omit<T, 'db'>) {
    return this.#flexrepPullConfigurations.post({ db, ...options }, { data: config });
  }

  #flexrepPullConfiguration = this.#endpoint<RestAPIType.DbFlexrepPullConfigOptions>('./manage/v2/databases/:db/flexrep/pulls/:pull')
    .withGet()
    .withDelete()
    .build();

  public getFlexrepPullConfiguration<T extends RestAPIType.DbFlexrepPullConfigOptions>(db: T['db'], pull: T['pull'], options?: Omit<T, 'db' | 'pull'>) {
    return this.#flexrepPullConfiguration.get({ db, pull, ...options });
  }

  public deleteFlexrepPullConfiguration<T extends RestAPIType.DbFlexrepPullConfigOptions>(db: T['db'], pull: T['pull'], options?: Omit<T, 'db' | 'pull'>) {
    return this.#flexrepPullConfiguration.delete({ db, pull, ...options });
  }

  #flexrepPullConfigurationProperties = this.#endpoint<RestAPIType.DbFlexrepPullConfigOptions>('./manage/v2/databases/:db/flexrep/pulls/:pull/properties')
    .withGet()
    .withPut()
    .build();

  public getFlexrepPullConfigurationProperties<T extends RestAPIType.DbFlexrepPullConfigOptions>(db: T['db'], pull: T['pull'], options?: Omit<T, 'db' | 'pull'>) {
    return this.#flexrepPullConfigurationProperties.get({ db, pull, ...options });
  }

  public updateFlexrepPullConfigurationProperties<T extends RestAPIType.DbFlexrepPullConfigOptions>(db: T['db'], pull: T['pull'], properties: StructuredType.FlexrepPullConfig, options?: Omit<T, 'db' | 'pull'>) {
    return this.#flexrepPullConfigurationProperties.put({ db, pull, ...options }, { data: properties });
  }

  #flexrepDomainStatus = this.#endpoint<RestAPIType.FlexrepDomainStatusOptions>('./manage/v1/:domain/status')
    .withGet()
    .build();

  public getFlexrepDomainStatus<T extends RestAPIType.FlexrepDomainStatusOptions>(domain: T['domain'], options?: Omit<T, 'domain'>) {
    return this.#flexrepDomainStatus.get({ domain, ...options });
  }

  #flexrepDomainTargets = this.#endpoint<RestAPIType.BaseFlexrepDomainOptions>('./manage/v1/:domain/targets')
    .withGet()
    .build();

  public getFlexrepDomainTargets<T extends RestAPIType.BaseFlexrepDomainOptions>(domain: T['domain'], options?: Omit<T, 'domain'>) {
    return this.#flexrepDomainTargets.get({ domain, ...options });
  }

  #flexrepDomainTarget = this.#endpoint<RestAPIType.FlexrepDomainTargetOptions & RestAPIType.FlexrepDomainStatusOptions>('./manage/v1/:domain/targets/:target')
    .withGet()
    .build();

  public getFlexrepDomainTarget<T extends RestAPIType.FlexrepDomainTargetOptions & RestAPIType.FlexrepDomainStatusOptions>(domain: T['domain'], target: T['target'], options?: Omit<T, 'domain' | 'target'>) {
    return this.#flexrepDomainTarget.get({ domain, target, ...options });
  }

  #flexrepDomainTargetRules = this.#endpoint<RestAPIType.FlexrepDomainTargetOptions>('./manage/v1/:domain/targets/:target/rules')
    .withGet()
    .withPost()
    .build();

  public getFlexrepDomainTargetRules<T extends RestAPIType.FlexrepDomainTargetOptions>(domain: T['domain'], target: T['target'], options?: Omit<T, 'domain' | 'target'>) {
    return this.#flexrepDomainTargetRules.get({ domain, target, ...options });
  }

  public createFlexrepDomainTargetRule<T extends RestAPIType.FlexrepDomainTargetOptions>(domain: T['domain'], target: T['target'], rule: StructuredType.FlexrepDomainTargetRule, options?: Omit<T, 'domain' | 'target'>) {
    return this.#flexrepDomainTargetRules.post({ domain, target, ...options }, { data: rule })
  }

  #flexrepDomainTargetRule = this.#endpoint<RestAPIType.FlexrepDomainTargetRuleOptions>('./manage/v1/:domain/targets/:target/rules/:rule')
    .withGet()
    .withPut()
    .withDelete()
    .build();

  public getFlexrepDomainTargetRule<T extends RestAPIType.FlexrepDomainTargetRuleOptions>(domain: T['domain'], target: T['target'], rule: T['rule'], options?: Omit<T, 'domain' | 'target' | 'rule'>) {
    return this.#flexrepDomainTargetRule.get({ domain, target, rule, ...options });
  }

  public updateFlexrepDomainTargetRule<T extends RestAPIType.FlexrepDomainTargetRuleOptions>(domain: T['domain'], target: T['target'], rule: T['rule'], newRule: StructuredType.FlexrepDomainTargetRule, options?: Omit<T, 'domain' | 'target' | 'rule'>) {
    return this.#flexrepDomainTargetRule.put({ domain, target, rule, ...options }, { data: newRule });
  }

  public deleteFlexrepDomainTargetRule<T extends RestAPIType.FlexrepDomainTargetRuleOptions>(domain: T['domain'], target: T['target'], rule: T['rule'], options?: Omit<T, 'domain' | 'target' | 'rule'>) {
    return this.#flexrepDomainTargetRule.delete({ domain, target, rule, ...options });
  }

  public withCustomEndpoint<T extends Record<string, unknown>>(path: string, additionalMethods: ((this: MarkLogicRestAPIClient<CE>, endpoint: EndpointBuilder) => T), defaultImplementation?: EndpointMethodImplementation) {
    const builder = this.#endpoint(path, defaultImplementation);

    const methods = additionalMethods.call(this, builder);

    if (typeof methods !== 'object' || methods === null || Array.isArray(methods)) {
      throw new TypeError('Expected `additionalMethods` to return a key-value object, got array, null, or primitive value!');
    }

    for (const [key, value] of Object.entries(methods)) {
      if (key in this.customMethods) {
        throw new Error(`Duplicate custom member names are not allowed: "${key}" already exists!`);
      }

      (this.customMethods as Record<string, unknown>)[key] = value;
    }

    return this as unknown as MarkLogicRestAPIClient<CE & T>;
  }

	#endpoint<P extends RestAPIType.Parameters>(path: string, defaultImplementation: EndpointMethodImplementation = this.#defaultImplementation) {
		return new EndpointBuilder<P>(path, defaultImplementation);
	}

	async #fetch({ path, params, data, body, ...init }: ExtendedRequestInit) {
		const url = this.#getRequestURL(path, params);

    const requestBody = await homogenizeBodyData(body, data);

    const authorization = this.#authClient.getAuthHeader(url, init.method, requestBody);

    const requestHeaders = new Headers({ ...this.#defaultHeaders, ...init.headers });
    if (authorization && !requestHeaders.has('Authorization')) {
      requestHeaders.set('Authorization', authorization);
    }

		const resp = await fetch(url, { ...init, headers: requestHeaders, body: requestBody });

    // Update digest auth (basic, null auth clients are no-ops)
	  this.#authClient.parseAuthResponse(resp.headers.get('WWW-Authenticate'));

    // Log request status summary
    this.#logger?.log('MarkLogicRestAPIClient:', resp.status, init.method?.toUpperCase().padEnd(6, ' '), url.toString());

		return resp;
	}

	#getRequestURL(path: string, parameters: RestAPIType.Parameters) {
		const pathname = path.replace(/:(.+?)(?=\/|$)/g, (_: string, name: string) => {
			const value = parameters[name];
			parameters[name] = undefined; // NOTE: Ensure this parameter doesn't show up in the query string

			return value?.toString() ?? 'null';
		});

    // DENO_BROWSER_COMPAT
		const result = new URL(this.#baseURI + pathname, typeof Deno === 'undefined' ? document.URL : undefined);

		for (const [key, value] of Object.entries(parameters)) {
			if (Array.isArray(value)) {
				for (const v of value) {
					if (v !== null && v !== undefined) { // NOTE: Don't ignore `false` values in an array
						result.searchParams.append(key, v.toString());
					}
				}
			} else if (value === true) {
				result.searchParams.set(key, '');
			} else if (value !== null && value !== undefined && value !== false) {
				result.searchParams.set(key, value.toString());
			}
		}

		return result;
	}
}
