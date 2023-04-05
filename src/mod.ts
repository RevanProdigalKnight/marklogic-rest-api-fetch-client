import * as StructuredType from './MarkLogicStructuredTypes.ts';
import * as RestAPIType from './MarkLogicRestAPITypes.ts';

import { ReturnFormatType } from './MarkLogicStructuredTypes.ts';
import { XML } from './MarkLogicRestAPITypes.ts';

import PatchBuilder from './PatchBuilder.ts';
import QueryBuilder from './QueryBuilder.ts';
import { parseMultipartMixed } from './ResponseUtils.ts';

export * from './MarkLogicStructuredTypes.ts';
export * from './MarkLogicRestAPITypes.ts';
export { default as PatchBuilder } from './PatchBuilder.ts';
export { default as QueryBuilder } from './QueryBuilder.ts';
export * from './QueryBuilder.ts';

import EndpointBuilder, { EndpointMethodImplementation, ExtendedRequestInit } from './EndpointBuilder.ts';
export { default as EndpointBuilder } from './EndpointBuilder.ts';

export type ArrayType<T> = T extends unknown[] ? T : never;

export default class MarkLogicRestAPI<CE extends Record<string, unknown> = Record<string, never>> {
	readonly #baseURI: string;
	readonly #defaultImplementation: EndpointMethodImplementation = (init => this.#fetch(init));
	readonly #preferredFormat: ReturnFormatType;

	public readonly PatchBuilder = PatchBuilder;
	public readonly QueryBuilder = QueryBuilder;
	public readonly QB = QueryBuilder;

	public readonly customMethods = {} as CE;

	public constructor(baseURI = '/', preferredFormat: ReturnFormatType = 'json') {
		this.#baseURI = baseURI;
		this.#preferredFormat = preferredFormat;
	}

	public get fetch() {
		return this.#fetch;
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

	public insertDocument<T extends RestAPIType.PostDocumentsOptions>(uri: NonNullable<T['uri']>, document: NonNullable<ExtendedRequestInit['data']>, options?: Omit<T, 'uri'>) {
		return this.#documents.post({ ...options, uri }, { data: document });
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

	public clearDatabase<T extends RestAPIType.DeleteSearchOptions>(database: NonNullable<T['database']>, options?: Omit<T, 'database'>) {
		return this.#search.delete({ ...options, database });
	}

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

  #alertConfigs = this.#endpoint<RestAPIType.AlertActionsOptions>('./manage/v2/databases/:db/alert/configs')
    .withGet()
    .withPost()
    .withDelete()
    .build();

  public getAlertConfigs<T extends RestAPIType.AlertActionsOptions>(db: T['db'], options?: Omit<T, 'db'>) {
    return this.#alertConfigs.get({ db, ...options });
  }

  // public createAlertConfigs<T extends RestAPIType.AlertActionsOptions>(db: T['db'], config: StructuredType., options?: Omit<T, 'db'>) {
  //   return this.#alertConfigs.post({ db, ...options });
  // }

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

  public withCustomEndpoint<T extends Record<string, unknown>>(path: string, additionalMethods: ((this: MarkLogicRestAPI<CE>, endpoint: EndpointBuilder) => T), defaultImplementation?: EndpointMethodImplementation) {
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

    return this as unknown as MarkLogicRestAPI<CE & T>;
  }

	#endpoint<P extends RestAPIType.Parameters>(path: string, defaultImplementation: EndpointMethodImplementation = this.#defaultImplementation) {
		return new EndpointBuilder<P>(path, defaultImplementation);
	}

	async #fetch({ path, params, data, body, ...init }: ExtendedRequestInit) {
		const url = this.#getRequestURL(path, params);

		let requestBody = body;

		if (
			ArrayBuffer.isView(data) ||
			data instanceof ArrayBuffer ||
			data instanceof Blob ||
			data instanceof File ||
			data instanceof FormData ||
			data instanceof ReadableStream ||
			typeof data === 'string'
		) {
			requestBody = data;
		} else if (data !== undefined) {
			requestBody = JSON.stringify(data);
		}

		const resp = await fetch(url, { ...init, body: requestBody });

		// TODO: Additional logic

		return resp;
	}

	#getRequestURL(path: string, parameters: RestAPIType.Parameters) {
		const pathname = path.replace(/:(.+?)(?=\/|$)/g, (_: string, name: string) => {
			const value = parameters[name];
			parameters[name] = undefined; // NOTE: Ensure this parameter doesn't show up in the query string

			return value?.toString() ?? 'null';
		});

		const result = new URL(this.#baseURI + pathname, document.URL);

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

		if (!result.searchParams.has('format')) {
			result.searchParams.set('format', this.#preferredFormat);
		}

		return result;
	}
}
