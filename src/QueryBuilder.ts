import { ReturnFormatType } from './MarkLogicStructuredTypes.ts';

export type GeospatialRegionOperator =
	| 'disjoint'
	| 'contains'
	| 'covers'
	| 'intersects'
	| 'within'
	| 'covered-by'
	| 'overlaps'
	;

export type xsDataType =
	| 'int'
	| 'unsignedInt'
	| 'long'
	| 'unsignedLong'
	| 'float'
	| 'double'
	| 'decimal'
	| 'dateTime'
	| 'time'
	| 'date'
	| 'gYearMonth'
	| 'gYear'
	| 'gMonth'
	| 'gDay'
	| 'yearMonthDuration'
	| 'dayTimeDuration'
	| 'string'
	| 'anyURI'
	| 'point'
	;

export class Anchor {
	readonly value?: string;
	readonly ge?: string;
	readonly lt?: string;

	constructor(readonly anchor: string, first: string, comparison?: '<' | '>', second?: string) {
		if (!comparison) {
			this.value = first;
		} else if (comparison === '<') {
			this.ge = first;
			this.lt = second;
		} else if (comparison === '>') {
			this.lt = first;
			this.ge = second;
		}
	}
}

export class Attribute {
	constructor(readonly element: QName, readonly attribute: QName) {}
}

export class BindDefault {
	readonly defaultConstraint = true;
}

export class BindEmpty {
	readonly empty: {
		readonly apply: 'all-results' | 'no-results';
	};

	constructor(apply: 'all-results' | 'no-results') {
		this.empty = { apply };
	}
}

export class Binding {
	constructor(readonly constraintName: string) {}
}

export class Bucket {
	static #getParameterType(param: number | string | Date | null | undefined) {
		if (typeof param === 'string' || param instanceof Date) {
			return 2;
		} else if (typeof param === 'number') {
			return 1;
		}

		return 0;
	}

	readonly label: string;

	readonly ge?: number | string | Date;
	readonly lt?: number | string | Date;

	constructor(readonly name: string, lower?: number | string | Date | null | undefined, upper?: number | string | Date | null | undefined) {
		this.label = name;

		const lowerType = Bucket.#getParameterType(lower);
		const upperType = Bucket.#getParameterType(upper);

		if (!lowerType && !upperType) {
			throw new Error('Bucket requires at least one lower or upper bound');
		} else if (!upperType) {
			this.ge = lower!;
		} else if (!lowerType) {
			this.lt = upper!;
		} else if (lowerType === upperType) {
			this.ge = lower!;
			this.lt = upper!;
		} else {
			throw new Error(`Lower & upper bounds must be of same type, got "${typeof lower}" and "${typeof upper}"`);
		}
	}
}

export class ComputedBucket {
	static #getParameterType(param: Anchor | null | undefined) {
		if (param instanceof Anchor) {
			return param.value === null || param.value === undefined ? 1 : 2;
		}

		return 0;
	}

	readonly label: string;

	readonly anchor?: string;
	readonly ge?: string;
	readonly lt?: string;
	readonly 'ge-anchor'?: string;
	readonly 'lt-anchor'?: string;

	constructor(readonly name: string, lower?: Anchor | null | undefined, upper?: Anchor | null | undefined) {
		this.label = name;

		const lowerType = ComputedBucket.#getParameterType(lower);
		const upperType = ComputedBucket.#getParameterType(upper);

		if (!lowerType && !upperType) {
			throw new Error('ComputedBucket requires at least one lower or upper bound');
		} else if (lowerType === 1 && !upperType) {
			this.anchor = lower!.anchor;
			this.ge = lower!.ge;
			this.lt = lower!.lt;
		} else if (upperType === 1 && !lowerType) {
			this.anchor = upper!.anchor;
			this.ge = upper!.ge;
			this.lt = upper!.lt;
		} else if (lowerType === 2 && upperType === 2) {
			this['ge-anchor'] = lower!.anchor;
			this.ge = lower!.value;
			this['lt-anchor'] = upper!.anchor;
			this.lt = upper!.value;
		} else if (lowerType === 2 && !upperType) {
			this.anchor = lower!.anchor;
			this.ge = lower!.value;
		} else if (upperType === 2 && !lowerType) {
			this.anchor = upper!.anchor;
			this.lt = upper!.value;
		} else if (lowerType === 1 && upperType === 1) {
			throw new Error('Multiple ComputedBucket anchors cannot specify both upper & lower bounds');
		}
	}
}

export class CoordSystem {
	constructor(readonly coord: string) {}
}

export class DataType {
	constructor(readonly datatype: xsDataType, readonly collation?: string) {}
}

export class Element {
	constructor(readonly element: QName) {}
}

export class HeatMap {
	readonly heatmap: {
		readonly latdivs: number;
		readonly londivs: number;
		readonly s: number;
		readonly w: number;
		readonly n: number;
		readonly e: number;
	};

	constructor(
		readonly latdivs: number,
		readonly londivs: number,
		readonly s: number,
		readonly w: number,
		readonly n: number,
		readonly e: number,
	) {
		this.heatmap = { latdivs, londivs, s, w, n, e };
	}
}

export class MinDistance {
	constructor(readonly minDistance: number) {}
}

export class Ordered {
	constructor(readonly ordered: boolean) {}
}

export class Period {
	readonly 'period-start': string;
	readonly 'period-end'?: string;

	constructor(startDate: string | Date, endDate?: string | Date) {
		this['period-start'] = typeof startDate === 'string' ? startDate : startDate.toString();
		this['period-end'] = typeof endDate === 'string' ? endDate : endDate?.toString();
	}
}

export class QName {
	static from(name: string | [string, string] | QName | Element | Attribute, useAttributeElement = false) {
		if (name instanceof Element) {
			return name.element;
		}
		if (name instanceof Attribute) {
			return useAttributeElement
				? name.element
				: name.attribute
				;
		}
		if (name instanceof QName) {
			return name;
		}
		if (Array.isArray(name)) {
			return new QName(...name);
		}

		return new QName(null, name);
	}

	constructor(readonly ns: string | null, readonly name: string) {}
}

export class Weight {
	constructor(readonly weight: number) {}
}

export abstract class Options {
	constructor(options: string[]) {
		if (options.length === 0) {
			throw new Error('Empty options list');
		}
		const invalid = options.filter(option => typeof option !== 'string');
		if (invalid.length) {
			throw new Error('Invalid option(s): ' + invalid.join('; '));
		}
	}
}

export class FacetOptions extends Options {
	readonly 'facet-option': string[];

	constructor(options: string[]) {
		super(options);

		this['facet-option'] = options;
	}
}

export class GeoOptions extends Options {
	readonly 'geo-option': string[];

	constructor(options: string[]) {
		super(options);

		this['geo-option'] = options;
	}
}

export class SuggestOptions extends Options {
	readonly 'suggest-option': string[];

	constructor(options: string[]) {
		super(options);

		this['suggest-option'] = options;
	}
}

export class TemporalOptions extends Options {
	readonly 'temporal-option': string[];

	constructor(options: string[]) {
		super(options);

		this['temporal-option'] = options;
	}
}

export class URIList {
	constructor(readonly uris: string[], readonly infinite?: boolean) {
		if (uris.length === 0) {
			throw new Error('No URIs');
		}
	}
}

export class QueryList {
	constructor(
		readonly queries?: Query[],
		readonly ordered?: boolean,
		readonly weight?: number,
		readonly distance?: number,
	) {}
}

export abstract class GeoLocation {}

export class GeoAttributePair extends GeoLocation {
	readonly 'geo-attr-pair': {
		readonly parent: QName;
		readonly latitude: QName;
		readonly longitude: QName;
	};

	constructor(parent: QName, latitude: QName, longitude: QName) {
		super();

		this['geo-attr-pair'] = { parent, latitude, longitude };
	}
}

export class GeoElement extends GeoLocation {
	readonly 'geo-elem': {
		readonly parent: QName;
		readonly element: QName;
	};

	constructor(parent: QName, element: QName) {
		super();

		this['geo-elem'] = { parent, element };
	}
}

export class GeoElementPair extends GeoLocation {
	readonly 'geo-elem-pair': {
		readonly parent: QName;
		readonly lat: QName;
		readonly lon: QName;
	};

	constructor(parent: QName, lat: QName, lon: QName) {
		super();

		this['geo-elem-pair'] = { parent, lat, lon };
	}
}

export class GeoJsonProperty extends GeoLocation {
	readonly 'geo-json-property': {
		readonly 'parent-property': string;
		readonly 'json-property': string;
	};

	constructor(parent: string, property: string) {
		super();

		this['geo-json-property'] = {
			'parent-property': parent,
			'json-property': property,
		};
	}
}

export class GeoJsonPropertyPair extends GeoLocation {
	readonly 'geo-json-property-pair': {
		readonly 'parent-property': string;
		readonly 'lat-property': string;
		readonly 'lon-property': string;
	};

	constructor(parent: string, lat: string, lon: string) {
		super();

		this['geo-json-property-pair'] = {
			'parent-property': parent,
			'lat-property': lat,
			'lon-property': lon,
		};
	}
}

export class GeoPath extends GeoLocation {
	readonly 'geo-path': {
		readonly 'path-index': PathIndex['path-index'];
		readonly coordSystem?: CoordSystem;
		readonly coord?: CoordSystem;
	};

	constructor(pathIndex: PathIndex['path-index'], coordSystem?: CoordSystem, coord?: CoordSystem) {
		super();

		this['geo-path'] = {
			'path-index': pathIndex,
			coordSystem,
			coord,
		};
	}
}

export interface BoxLikeFull {
	readonly north: number;
	readonly south: number;
	readonly east: number;
	readonly west: number;
}

export interface BoxLikeShort {
	readonly n: number;
	readonly s: number;
	readonly e: number;
	readonly w: number;
}

export type BoxLike = BoxLikeFull | BoxLikeShort;

export abstract class Region {
	abstract toRegion(): Record<string, unknown>;
}

export class Box extends Region {
	static isBox(value: unknown): value is Box {
		return value instanceof Box || (
			value !== null &&
			typeof value === 'object' &&
			['north', 'east', 'south', 'west'].every(prop => typeof (value as Box)[prop as keyof Box] === 'number')
		);
	}

	constructor (
		readonly south: number,
		readonly west: number,
		readonly north: number,
		readonly east: number,
	) {
		super();
	}

	toRegion() {
		return {
			box: {
				north: this.north,
				east: this.east,
				south: this.south,
				west: this.west,
			},
		};
	}
}

export class Circle extends Region {
	static isCircle(value: unknown): value is Circle {
		return value instanceof Circle || (
			value !== null &&
			typeof value === 'object' &&
			typeof (value as Circle).radius === 'number' &&
			Array.isArray((value as Circle).point) &&
			(value as Circle).point.length === 1 &&
			LatLong.isLatLong((value as Circle).point[0])
		);
	}

	constructor(
		readonly radius: number,
		readonly point: [LatLong],
	) {
		super();
	}

	toRegion() {
		return {
			circle: {
				radius: this.radius,
				point: this.point.map(point => point.toRegion()),
			},
		};
	}
}

export class LatLong extends Region {
	static isLatLong(value: unknown): value is LatLong {
		return value instanceof LatLong || (
			value !== null &&
			typeof value === 'object' &&
			['latitude', 'longitude'].every(prop => typeof (value as LatLong)[prop as keyof LatLong] === 'number')
		);
	}

	constructor(
		readonly latitude: number,
		readonly longitude: number,
	) {
		super();
	}

	toRegion() {
		return {
			latitude: this.latitude,
			longitude: this.longitude,
		};
	}
}

export class Point extends Region {
	static isPoint(value: unknown): value is Point {
		return value instanceof Point || (
			value !== null &&
			typeof value === 'object' &&
			Array.isArray((value as Point).point) &&
			(value as Point).point.length === 1 &&
			LatLong.isLatLong((value as Point).point[0])
		);
	}

	constructor(readonly point: [LatLong]) {
		super();
	}

	toRegion() {
		return {
			point: this.point.map(point => point.toRegion()) as [ReturnType<LatLong['toRegion']>],
		};
	}
}

export class Polygon extends Region {
	static isPolygon(value: unknown): value is Polygon {
		return value instanceof Polygon || (
			value !== null &&
			typeof value === 'object' &&
			Array.isArray((value as Polygon).points) &&
			(value as Polygon).points.every(LatLong.isLatLong)
		);
	}

	constructor(readonly points: LatLong[]) {
		super()
	}

	toRegion() {
		return {
			polygon: { point: this.points.map(point => point.toRegion()) },
		};
	}
}

export type PositiveNegativeQuery = Record<'positive-query' | 'negative-query', Query>;

export abstract class Query {}

export class AfterQuery extends Query {
	readonly 'after-query': string;

	constructor(timestamp: string | number | Date) {
		super();

		this['after-query'] = timestamp instanceof Date
			? timestamp.getTime().toString()
			: timestamp.toString(10);
	}
}

export class AndQuery extends Query {
	readonly 'and-query': QueryList;

	constructor(queries: QueryList) {
		super();

		this['and-query'] = queries;
	}
}

export class AndNotQuery extends Query {
	readonly 'and-not-query': PositiveNegativeQuery;

	constructor(positive: Query, negative: Query) {
		super();

		this['and-not-query'] = {
			'positive-query': positive,
			'negative-query': negative,
		};
	}
}

export class BeforeQuery extends Query {
	readonly 'before-query': string;

	constructor(timestamp: string | number | Date) {
		super();

		this['before-query'] = timestamp instanceof Date
			? timestamp.getTime().toString()
			: timestamp.toString(10);
	}
}

export class BoostQuery extends Query {
	readonly ['boost-query']: {
		readonly 'matching-query': Query;
		readonly 'boosting-query': Query;
	};

	constructor(matching: Query, boosting: Query) {
		super();

		this['boost-query'] = {
			'matching-query': matching,
			'boosting-query': boosting,
		};
	}
}

export class CollectionQuery extends Query {
	readonly 'collection-query': URIList;

	constructor(uriList: URIList) {
		super();

		this['collection-query'] = uriList;
	}
}

export class ContainerQuery extends Query {
	readonly 'container-query': Contained;

	constructor(contained: Contained) {
		super();

		this['container-query'] = contained;
	}
}

export class DirectoryQuery extends Query {
	readonly 'directory-query': URIList;

	constructor(uriList: URIList) {
		super();

		this['directory-query'] = uriList;
	}
}

export class DocumentQuery extends Query {
	readonly 'document-query': URIList;

	constructor(uriList: URIList) {
		super();

		this['document-query'] = uriList;
	}
}

export class DocumentFragmentQuery extends Query {
	readonly 'document-fragment-query': Query;

	constructor(query: Query) {
		super();

		this['document-fragment-query'] = query;
	}
}

export class FalseQuery extends Query {
	readonly 'false-query' = null;
}

export interface GeospatialQueryType {
	readonly 'fragment-scope'?: FragmentScope['fragment-scope'];
	readonly 'geo-option'?: GeoOptions['geo-option'];
	readonly weight?: number;

	readonly box?: ReturnType<Box['toRegion']>['box'];
	readonly circle?: ReturnType<Circle['toRegion']>['circle'];
	readonly point?: ReturnType<Point['toRegion']>['point'] | [ReturnType<LatLong['toRegion']>];
	readonly polygon?: ReturnType<Polygon['toRegion']>['polygon'];
}

export class GeospatialQuery<K extends keyof GeospatialQuery = 'geo-attr-pair-query'> extends Query {
	readonly 'geo-attr-pair-query'?: GeospatialQueryType & GeoAttributePair['geo-attr-pair'];
	readonly 'geo-elem-query'?: GeospatialQueryType & GeoElement['geo-elem'];
	readonly 'geo-elem-pair-query'?: GeospatialQueryType & GeoElementPair['geo-elem-pair'];
	readonly 'geo-json-property-query'?: GeospatialQueryType & GeoJsonProperty['geo-json-property'];
	readonly 'geo-json-property-pair-query'?: GeospatialQueryType & GeoJsonPropertyPair['geo-json-property-pair'];
	readonly 'geo-path-query'?: GeospatialQueryType & GeoPath['geo-path'];
	readonly 'geo-region-path-query'?: GeospatialQueryType;

	constructor(variant: string, query: GeospatialQueryType) {
		super();

		this[`${variant}-query` as K] = query as this[K];
	}
}

export class LocksFragmentQuery extends Query {
	readonly 'locks-fragment-query': Query;

	constructor(locksFragmentQuery: Query) {
		super();

		this['locks-fragment-query'] = locksFragmentQuery;
	}
}

export class LSQTQuery extends Query {
	readonly 'temporal-collection': string;
	readonly 'temporal-option'?: string[];

	constructor(
		temporalCollection: string,
		readonly weight?: number,
		readonly timestamp?: string,
		temporalOptions?: string[],
	) {
		super();

		this['temporal-collection'] = temporalCollection;
		this['temporal-option'] = temporalOptions;
	}
}

export class NearQuery extends Query {
	readonly 'near-query': {
		readonly distance?: number;
		readonly 'distance-weight'?: number;
		readonly 'minimum-distance'?: number;
		readonly ordered?: boolean;
	};

	readonly queries: Query[];

	constructor(subquery: Query | Query[], readonly distance?: number, weight?: number | Weight, ordering?: boolean | Ordered, minDistance?: number | MinDistance) {
		super();

		this['near-query'] = {
			distance,
			'distance-weight': typeof weight === 'number' ? weight : weight?.weight,
			'minimum-distance': typeof minDistance === 'number' ? minDistance : minDistance?.minDistance,
			ordered: typeof ordering === 'boolean' ? ordering : ordering?.ordered,
		};
		this.queries = ([] as Query[]).concat(subquery);
	}
}

export class NotQuery extends Query {
	readonly 'not-query': Query;

	constructor(query: Query) {
		super();

		this['not-query'] = query;
	}
}

export class NotInQuery extends Query {
	readonly 'not-in-query': PositiveNegativeQuery;

	constructor(positive: Query, negative: Query) {
		super();

		this['not-in-query'] = {
			'positive-query': positive,
			'negative-query': negative,
		};
	}
}

export class OrQuery extends Query {
	readonly 'or-query': QueryList;

	constructor(queries: QueryList) {
		super();

		this['or-query'] = queries;
	}
}

export class PeriodCompareQuery extends Query {
	readonly 'period-compare-query': {
		readonly axis1: string;
		readonly 'temporal-operator': string;
		readonly axis2: string;
		readonly 'temporal-option'?: TemporalOptions['temporal-option'];
	};

	constructor(axis1: string, operator: string, axis2: string, temporalOptions?: TemporalOptions['temporal-option']) {
		super();

		this['period-compare-query'] = { axis1, 'temporal-operator': operator, axis2, 'temporal-option': temporalOptions };
	}
}

export class PeriodRangeQuery extends Query {
	readonly 'period-range-query': {
		readonly axis: string;
		readonly 'temporal-operator': string;
		readonly period: Period;
		readonly 'temporal-option'?: TemporalOptions['temporal-option'];
	};

	constructor(axis: string, operator: string, period: Period, temporalOptions?: TemporalOptions['temporal-option']) {
		super();

		this['period-range-query'] = { axis, 'temporal-operator': operator, period, 'temporal-option': temporalOptions };
	}
}

export class PropertiesFragmentQuery extends Query {
	readonly 'properties-fragment-query': Query;

	constructor(propertiesFragmentQuery: Query) {
		super();

		this['properties-fragment-query'] = propertiesFragmentQuery;
	}
}

export class TrueQuery extends Query {
	readonly 'true-query' = null;
}

export abstract class Indexed {
	readonly 'json-property'?: JSONProperty['json-property'];
	readonly element?: Element['element'] | Attribute['element'];
	readonly attribute?: Attribute['attribute'];
	readonly field?: Field['field'];
	readonly 'path-index'?: PathIndex['path-index'];

	constructor(index: IndexedName, isContainer = false) {
		if (index instanceof JSONProperty) {
			this['json-property'] = index['json-property'];
		} else if (index instanceof Element) {
			this.element = index.element;
		} else if (index instanceof Attribute) {
			this.element = index.element;
			this.attribute = index.attribute;
		} else if (isContainer) {
			if (index instanceof Field) {
				this.field = index.field;
			} else if (index instanceof PathIndex) {
				this['path-index'] = index['path-index'];
			}
		}
	}
}

export class Contained<T extends Query | void = void> extends Indexed {
	readonly 'fragment-scope': FragmentScope['fragment-scope'] | undefined;

	constructor(index: IndexedName, fragmentScope?: FragmentScope['fragment-scope'] | null, query?: T) {
		super(index, true);

		this['fragment-scope'] = fragmentScope ?? undefined;

		if (query) {
			for (const [key, value] of Object.keys(query)) {
				// @ts-ignore: Copying values from query to sit directly on this object
				this[key] = value;
			}
		}
	}
}

export abstract class Qualifier {}

export class CollectionQualifier extends Qualifier {
	readonly facet = false;

	constructor(readonly prefix: string) {
		super();
	}
}

export abstract class Constraint {
	abstract readonly name: string | null;
}

export class CollectionConstraint extends Constraint {
	readonly collection: Qualifier | null;
	readonly 'suggest-option': string[] | undefined;

	constructor(readonly name: string | null, suggestOptions: string[] | null, qualifierDef: Qualifier | null) {
		super();

		this['suggest-option'] = suggestOptions ?? undefined;

		this.collection = (name === null && suggestOptions === null && qualifierDef === null)
			? null
			: qualifierDef;
	}
}

export class ContainerConstraint extends Constraint {
	constructor(
		readonly name: string | null,
		readonly container: Contained,
	) {
		super();
	}
}

export class GeospatialConstraint<K extends keyof Omit<GeospatialConstraint, 'name' | 'suggest-option'> = 'geo-attr-pair'> extends Constraint {
	readonly 'geo-attr-pair'?: GeospatialQueryType & GeoAttributePair['geo-attr-pair'];
	readonly 'geo-elem'?: GeospatialQueryType & GeoElement['geo-elem'];
	readonly 'geo-elem-pair'?: GeospatialQueryType & GeoElementPair['geo-elem-pair'];
	readonly 'geo-json-property'?: GeospatialQueryType & GeoJsonProperty['geo-json-property'];
	readonly 'geo-json-property-pair'?: GeospatialQueryType & GeoJsonPropertyPair['geo-json-property-pair'];
	readonly 'geo-path'?: GeospatialQueryType & GeoPath['geo-path'];
	readonly 'geo-region-path'?: GeospatialQueryType;

	readonly 'suggest-option': string[] | undefined;

	constructor(variant: string, query: GeospatialQueryType, readonly name: string | null, suggestOptions: string[] | null) {
		super();

		this[variant as K] = query as this[K];
		this['suggest-option'] = suggestOptions ?? undefined;
	}
}

export class FragmentScope {
	readonly 'fragment-scope': string;

	constructor(scopeType: string) {
		this['fragment-scope'] = scopeType;
	}
}

export class Field {
	readonly field: {
		readonly name: string;
		readonly collation?: string;
	};

	constructor(name: string, collation?: string) {
		this.field = { name, collation };
	}
}

export class PathIndex {
	readonly 'path-index': {
		readonly text: string;
		readonly namespaces: Record<string, string>;
	};

	constructor(text: string, namespaces: Record<string, string> = {}) {
		this['path-index'] = { text, namespaces };
	}
}

export type IndexedName = Attribute | Element | Field | PathIndex | JSONProperty;

export class LSQT {
	readonly 'lsqt-query': LSQTQuery;

	constructor(lsqtQuery: LSQTQuery) {
		this['lsqt-query'] = lsqtQuery;
	}
}

export class JSONProperty {
	readonly 'json-property': string;

	constructor(name: string) {
		this['json-property'] = name;
	}
}

export class JSONTypeDef {
	readonly 'json-type': 'boolean' | 'null' | 'number' | 'string';

	constructor(type: 'boolean' | 'null' | 'number' | 'string') {
		this['json-type'] = type;
	}
}

export interface QBELike {
	readonly $query: unknown;
}

export class QBE implements QBELike {
	constructor(readonly $query: QBELike | QBELike[]) {}
}

export class Facet {

}

export interface CalculateClause {
	readonly constraint: Facet[];
}

export interface CalculateFunctionFacet {
	readonly apply: 'start-facet' | 'finish-facet';
	readonly ns: string;
	readonly at: string;
}

export class CalculateFunction {
	readonly 'start-facet': CalculateFunctionFacet;
	readonly 'finish-facet': CalculateFunctionFacet;

	constructor(rootName: string, moduleName: string) {
		const ns = `http://marklogic.com/query/custom/${rootName}`;
		const at = `/ext/marklogic/query/custom/${moduleName}`;

		this['start-facet'] = { apply: 'start-facet', ns, at };
		this['finish-facet'] = { apply: 'finish-facet', ns, at };
	}
}

export class ExtractDocumentData {
	readonly 'extract-document-data': {
		readonly 'extract-path': string[];
		readonly namespaces?: Record<string, string>;
		readonly selected?: string;
	};

	constructor(paths: string[], namespaces?: Record<string, string>, selected?: string) {
		this['extract-document-data'] = {
			'extract-path': paths,
			namespaces,
			selected,
		};
	}
}

interface WhereClause {
	readonly 'fragment-scope'?: FragmentScope['fragment-scope'];
	// readonly parsedQuery?: ParsedQuery['parsedQuery'];
	readonly query: { readonly queries: Query[] };
}

export default class QueryBuilder {
	#calculate: CalculateClause | undefined;
	#orderByClause: unknown | undefined;
	#makeBindings: unknown | undefined;
	#queryType: string | undefined;
	#whereClause: QBE | /*CtsQuery |*/ WhereClause | undefined;

	build() {
		return {
			calculate: this.#calculate,
			orderByClause: this.#orderByClause,
			makeBindings: this.#makeBindings,
			queryFormat: 'json' as ReturnFormatType,
			queryType: this.#queryType,
			whereClause: this.#whereClause,
		};
	}

	after(timestamp: string | number | Date) {
		return new AfterQuery(timestamp);
	}

	anchor(milestone: string, lower: string): Anchor;
	anchor(milestone: string, lower: string, comparison: '<' | '>', upper: string): Anchor;
	anchor(milestone: string, lower: string, comparison?: '<' | '>', upper?: string) {
		return new Anchor(milestone, lower, comparison, upper);
	}

	and(queries?: Query[], ordering?: Ordered): AndQuery;
	and(queries?: Query[], ordered?: boolean): AndQuery;
	and(queries?: Query[], ordering?: boolean | Ordered) {
		return new AndQuery(typeof ordering === 'boolean' || ordering === undefined
			? new QueryList(queries, ordering)
			: new QueryList(queries, ordering.ordered)
		);
	}

	andNot(positive: Query, negative: Query) {
		return new AndNotQuery(positive, negative);
	}

	attribute(element: QName | [string, string] | string, attribute: QName | [string, string] | string): Attribute;
	attribute(element: QName | [string, string] | string, ns: string, name: string): Attribute;
	attribute(element: QName | [string, string] | string, attributeOrNsOrName: QName | [string, string] | string, name?: string) {
		let _attribute: QName;
		if (attributeOrNsOrName instanceof QName) {
			_attribute = attributeOrNsOrName;
		} else if (Array.isArray(attributeOrNsOrName)) {
			_attribute = new QName(...attributeOrNsOrName);
		} else if (!name) {
			_attribute = new QName(null, attributeOrNsOrName);
		} else {
			_attribute = new QName(attributeOrNsOrName, name!);
		}

		return new Attribute(QName.from(element), _attribute);
	}

	before(timestamp: string | number | Date) {
		return new BeforeQuery(timestamp);
	}

	bind(constraintName: string) {
		return new Binding(constraintName);
	}

	bindDefault() {
		return new BindDefault();
	}

	bindEmptyAs(binding: 'all-results' | 'no-results') {
		return new BindEmpty(binding);
	}

	boost(matching: Query, boosting: Query) {
		return new BoostQuery(matching, boosting);
	}

	box(south: number, west: number, north: number, east: number): Box;
	box(box: Box): Box;
	box(boxOrSouth: number | Box, w?: number, n?: number, e?: number) {
		if (Box.isBox(boxOrSouth)) {
			const { north, east, south, west } = boxOrSouth;

			return new Box(south, west, north, east);
		}

		return new Box(boxOrSouth, w!, n!, e!);
	}

	bucket(name: string, lower: number | Date | string, comparison: '<' | '>', upper?: number | Date | string): Bucket;
	bucket(name: string, comparison: '<' | '>', upper: number | Date | string): Bucket;
	bucket(
		name: string,
		lowerOrComparison: number | Date | string,
		comparisonOrUpper?: number | Date | string,
		upper?: number | Date | string
	) {
		if (comparisonOrUpper && !upper) {
			if (lowerOrComparison === '<') {
				return new Bucket(name, undefined, comparisonOrUpper);
			} else if (lowerOrComparison === '>') {
				return new Bucket(name, comparisonOrUpper);
			} else if (comparisonOrUpper === '<') {
				return new Bucket(name, lowerOrComparison);
			} else if (comparisonOrUpper === '>') {
				return new Bucket(name, undefined, lowerOrComparison);
			}
		}

		if (upper) {
			return comparisonOrUpper === '<'
				? new Bucket(name, lowerOrComparison, upper as number | string | Date)
				: new Bucket(name, upper as number | string | Date, lowerOrComparison)
				;
		}
	}

	byExample(query: QBELike, ...queries: QBELike[]) {
		if (queries.length === 0) {
			return new QBE(query);
		}

		return new QBE([query].concat(queries));
	}

	calculate(...facets: Facet[]) {
		this.#calculate = {
			constraint: facets,
		};

		return this;
	}

	calculateFunction(moduleName: string) {
		const extStartIdx = moduleName.lastIndexOf('.');
		if (extStartIdx <= 0) {
			throw new Error('Unable to determine module file extension');
		}
		const rootName = moduleName.slice(0, extStartIdx);
		const ext = moduleName.slice(extStartIdx);
		if (ext !== '.xqy') { // TODO: double check with someone that JS (.js, .sjs, .mjs, etc.) is not supported for this
			throw new Error(`Invalid module file extension: expected ".xqy", got "${ext}"`);
		}

		return new CalculateFunction(rootName, moduleName);
	}

	circle(radius: number, latitude: number, longitude: number): Circle;
	circle(radius: number, center: LatLong | Point): Circle;
	circle(circle: Circle): Circle;
	circle(circleOrRadius: number | Circle, centerPointOrLatitude?: number | LatLong | Point, longitude?: number) {
		if (Circle.isCircle(circleOrRadius)) {
			const { radius, point } = circleOrRadius;

			return new Circle(radius, point);
		} else if (LatLong.isLatLong(centerPointOrLatitude)) {
			return new Circle(circleOrRadius, [centerPointOrLatitude!]);
		} else if (Point.isPoint(centerPointOrLatitude)) {
			return new Circle(circleOrRadius, centerPointOrLatitude!.point);
		}

		return new Circle(circleOrRadius, [new LatLong(centerPointOrLatitude!, longitude!)]);
	}

	collection(): CollectionConstraint;
	collection(collection: Binding, suggestOptions: SuggestOptions, prefix: string): CollectionConstraint;
	collection(...collections: string[]): CollectionQuery;
	collection(collections?: string | Binding, suggestions?: SuggestOptions | string, prefix?: string, ...args: string[]) {
		if (!collections) {
			return new CollectionConstraint(null, null, null);
		}

		let constraintName: string | undefined;
		let suggestOptions: string[] | undefined;

		if (collections instanceof Binding) {
			constraintName = collections.constraintName;
		}
		if (suggestions instanceof SuggestOptions) {
			suggestOptions = suggestions['suggest-option'];
		}

		if (constraintName) {
			return new CollectionConstraint(constraintName, suggestOptions!, new CollectionQualifier(prefix!));
		}

		const uris = [collections, suggestions, prefix, ...args];

		if (uris.some(uri => typeof uri !== 'string')) {
			throw new Error('Invalid collection name type(s) - all collection names must be strings')
		}

		return new CollectionQuery(new URIList(uris as string[]));
	}

	computedBucket(name: string, lower: Anchor, comparison?: '<' | '>', upper?: Anchor): ComputedBucket;
	computedBucket(name: string, comparison: '<' | '>', upper?: Anchor): ComputedBucket;
	computedBucket(
		name: string,
		lowerOrComparison: string | Anchor,
		comparisonOrUpper?: string | Anchor,
		upper?: Anchor
	) {
		if (!comparisonOrUpper && !upper) {
			return new ComputedBucket(name, lowerOrComparison as Anchor);
		}

		if (comparisonOrUpper && !upper) {
			if (comparisonOrUpper instanceof Anchor) {
				return lowerOrComparison === '<'
					? new ComputedBucket(name, undefined, comparisonOrUpper)
					: new ComputedBucket(name, comparisonOrUpper)
					;
			} else if (lowerOrComparison instanceof Anchor) {
				return comparisonOrUpper === '<'
					? new ComputedBucket(name, lowerOrComparison)
					: new ComputedBucket(name, undefined, lowerOrComparison)
					;
			}
		}

		if (upper) {
			return comparisonOrUpper === '<'
				? new ComputedBucket(name, lowerOrComparison as Anchor, upper)
				: new ComputedBucket(name, upper, lowerOrComparison as Anchor)
				;
		}
	}

	coordSystem(system: string) {
		return new CoordSystem(system);
	}

	datatype(datatype: xsDataType, collation?: string) {
		return new DataType(datatype, collation);
	}

	directory(uris: string | string[], infinite?: boolean) {
		return new DirectoryQuery(new URIList(([] as string[]).concat(uris), infinite));
	}

	document(uris: string | string[]) {
		return new DocumentQuery(new URIList(([] as string[]).concat(uris)));
	}

	documentFragment(query: Query) {
		return new DocumentFragmentQuery(query);
	}

	element(name: string): Element;
	element(ns: string, name: string): Element;
	element(qname: QName): Element;
	element(qnameOrNsOrName: QName | string, name?: string) {
		if (qnameOrNsOrName instanceof QName) {
			return new Element(qnameOrNsOrName);
		} else if (!name) {
			return new Element(new QName(null, qnameOrNsOrName));
		} else {
			return new Element(new QName(qnameOrNsOrName, name!));
		}
	}

	extract(paths: string | string[], namespaces: Record<string, string> = {}, selected?: string) {
		return new ExtractDocumentData(([] as string[]).concat(paths), namespaces, selected);
	}

	facet(_name: string, _indexedName: IndexedName | GeoLocation, _bucket?: (Bucket | ComputedBucket)[], _heatMap?: HeatMap, _custom?: CalculateFunction, _options?: FacetOptions) {
		// const geoLocationIndexNames = ['geo-attr-pair', 'geo-elem', 'geo-elem-pair', 'geo-json-property', 'geo-json-property-pair', 'geo-path'];
		// const constraintIndexNames = ['collection', 'element', 'field', 'json-property', 'path-index', ...geoLocationIndexNames];

		// const constraintName = name;
		// const constraintIndex = undefined;

		// MASSIVE TODO: Figure out how the hell this shit works
		// https://github.com/marklogic/node-client-api/blob/492e51d4b3e741e5d91b92bcad206fadaaa6df3c/lib/query-builder.js#L4085
	}

	facetOptions(...options: string[]) {
		return new FacetOptions(options);
	}

	falseQuery() {
		return new FalseQuery();
	}

	field(name: string, collation?: string) {
		return new Field(name, collation);
	}

	fragmentScope(scopeType: string) {
		return new FragmentScope(scopeType);
	}

	geoAttributePair(parent: string | QName | Element | Attribute, latitude: string | QName | Attribute, longitude: string | QName | Attribute) {
		return new GeoAttributePair(QName.from(parent, true), QName.from(latitude), QName.from(longitude));
	}

	geoElement(parent: string | QName | Element, element: string | QName | Element): GeoElement;
	geoElement(element: string | QName | Element): GeoElement;
	geoElement(parentOrElement: string | QName | Element, element?: string | QName | Element) {
		const _parent = element ? parentOrElement : undefined;
		const _element = element ? element : parentOrElement;

		return new GeoElement(QName.from(_parent ?? _element), QName.from(_element));
	}

	geoElementPair(parent: string | QName | Element, latitude: string | QName | Element, longitude: string | QName | Element) {
		return new GeoElementPair(QName.from(parent), QName.from(latitude), QName.from(longitude));
	}

	geoOptions(options: string[]) {
		return new GeoOptions(options);
	}

	geoPath(path: PathIndex | string, namespaces: Record<string, string>, coordSystem: CoordSystem): GeoPath;
	geoPath(path: { readonly 'path-index': PathIndex['path-index']; readonly coordSystem?: CoordSystem }, namespaces?: Record<string, string>): GeoPath;
	geoPath(path: PathIndex | string | { readonly 'path-index': PathIndex['path-index']; readonly coordSystem?: CoordSystem; }, namespaces: Record<string, string> = {}, coordSystem?: CoordSystem) {
		let pathIndex: PathIndex['path-index'];
		let coord: CoordSystem | undefined;
		let coordSys: CoordSystem | undefined;

		if (path instanceof PathIndex) {
			pathIndex = path['path-index'];
			coord = coordSystem!;
		} else if (typeof path === 'string') {
			pathIndex = new PathIndex(path, namespaces)['path-index'];
			coord = coordSystem!;
		} else {
			pathIndex = path['path-index'];
			coordSys = path.coordSystem;
		}

		return new GeoPath(pathIndex, coordSys, coord);
	}

	geoProperty(parent: string | JSONProperty, element: string | JSONProperty): GeoJsonProperty;
	geoProperty(element: string | JSONProperty): GeoJsonProperty;
	geoProperty(parentOrElement: string | JSONProperty, element?: string | JSONProperty) {
		const _parent = element ? undefined : parentOrElement;
		const _element = element ? element : parentOrElement;

		const property = typeof _element === 'string' ? _element : _element['json-property'];
		const parent = _parent ? typeof _parent === 'string' ? _parent : _parent['json-property'] : property;

		return new GeoJsonProperty(parent, property);
	}

	geoPropertyPair(parent: string | JSONProperty, lat: string | JSONProperty, lon: string | JSONProperty) {
		return new GeoJsonPropertyPair(
			typeof parent === 'string' ? parent : parent['json-property'],
			typeof lat === 'string' ? lat : lat['json-property'],
			typeof lon === 'string' ? lon : lon['json-property'],
		);
	}

	#geospatial<T extends GeoLocation>(location: T, operator: GeospatialRegionOperator | undefined, weight?: number | Weight, fragmentScope?: FragmentScope, geoOptions?: GeoOptions, criteria?: Region | Binding | [number, number]) {
		let queryVariant = Object.keys(location)[0];
		const query: GeospatialQueryType = {
			...location[queryVariant as keyof T],

			'fragment-scope': fragmentScope?.['fragment-scope'],
			'geo-option': geoOptions?.['geo-option'],
			weight: typeof weight === 'number' ? weight : weight?.weight,
		};
		if (operator) {
			queryVariant = 'geo-region-path';
		}
		if (criteria instanceof Binding) {
			const constraintName = criteria.constraintName;
			const suggestOptions = undefined;

			return new GeospatialConstraint(queryVariant, query, constraintName, suggestOptions ?? null);
		} else if (criteria instanceof Region || (Array.isArray(criteria) && criteria.length === 2 && criteria.every(v => typeof v === 'number'))) {
			const region = criteria instanceof Region ? criteria : new Point([new LatLong(...criteria)]);

			return new GeospatialQuery(queryVariant, {
				...query,
				...(region instanceof LatLong
					? { point: [region.toRegion()] }
					: region.toRegion()
				),
			});
		}
	}

	geospatial(location: GeoLocation, weight?: number | Weight, fragmentScope?: FragmentScope, geoOptions?: GeoOptions, binding?: Binding): GeospatialConstraint;
	geospatial(location: GeoLocation, weight?: number | Weight, fragmentScope?: FragmentScope, geoOptions?: GeoOptions, region?: Region | [number, number]): GeospatialQuery;
	geospatial(location: GeoLocation, weight?: number | Weight, fragmentScope?: FragmentScope, geoOptions?: GeoOptions, criteria?: Region | Binding | [number, number]) {
		return this.#geospatial(location, undefined, weight, fragmentScope, geoOptions, criteria);
	}

	geospatialRegion(location: GeoLocation, operator: GeospatialRegionOperator, weight?: number | Weight, fragmentScope?: FragmentScope, geoOptions?: GeoOptions, binding?: Binding): GeospatialConstraint;
	geospatialRegion(location: GeoLocation, operator: GeospatialRegionOperator, weight?: number | Weight, fragmentScope?: FragmentScope, geoOptions?: GeoOptions, region?: Region | [number, number]): GeospatialQuery;
	geospatialRegion(location: GeoLocation, operator: GeospatialRegionOperator, weight?: number | Weight, fragmentScope?: FragmentScope, geoOptions?: GeoOptions, criteria?: Region | Binding | [number, number]) {
		return this.#geospatial(location, operator, weight, fragmentScope, geoOptions, criteria);
	}

	heatmap(box: BoxLike, latdivs: number, londivs: number): unknown;
	heatmap(latdivs: number, londivs: number, box: BoxLike): unknown;
	heatmap(latdivs: number, londivs: number, south: number, west: number, north: number, east: number): unknown;
	heatmap(boxOrLatdivs: number | BoxLike, latOrLondivs: number, boxOrLondivsOrSouth: number | BoxLike, west?: number, north?: number, east?: number) {
		let region: BoxLike;
		let latdivs: number;
		let londivs: number;

		if (typeof boxOrLatdivs === 'object') {
			region = boxOrLatdivs;
			latdivs = latOrLondivs as number;
			londivs = boxOrLondivsOrSouth as number;
		} else if (typeof boxOrLondivsOrSouth === 'object') {
			region = boxOrLondivsOrSouth;
			latdivs = boxOrLatdivs;
			londivs = latOrLondivs;
		} else {
			region = { south: boxOrLondivsOrSouth, west: west!, north: north!, east: east! };
			latdivs = boxOrLatdivs;
			londivs = boxOrLondivsOrSouth;
		}

		return new HeatMap(
			latdivs,
			londivs,
			(region as BoxLikeFull).south ?? (region as BoxLikeShort).s,
			(region as BoxLikeFull).west ?? (region as BoxLikeShort).w,
			(region as BoxLikeFull).north ?? (region as BoxLikeShort).n,
			(region as BoxLikeFull).east ?? (region as BoxLikeShort).e,
		);
	}

	jsontype(type: 'boolean' | 'null' | 'number' | 'string') {
		return new JSONTypeDef(type);
	}

	latlon(latitude: number, longitude: number) {
		return new LatLong(latitude, longitude);
	}

	locksFragment(query: Query) {
		return new LocksFragmentQuery(query);
	}

	lsqtQuery(temporalCollection: string, weight?: number | Weight, timestamp?: string | Date, temporalOptions?: string[]) {
		return new LSQT(new LSQTQuery(
			temporalCollection,
			typeof weight === 'number' ? weight : weight?.weight,
			typeof timestamp === 'string' ? timestamp : timestamp?.toISOString(),
			temporalOptions,
		));
	}

	minDistance(distance: number) {
		return new MinDistance(distance);
	}

	near(subquery: Query | Query[], distance?: number, weight?: number | Weight, ordering?: boolean | Ordered, minDistance?: number | MinDistance) {
		return new NearQuery(subquery, distance, weight, ordering, minDistance);
	}

	not(query: Query) {
		return new NotQuery(query);
	}

	notIn(positive: Query, negative: Query) {
		return new NotInQuery(positive, negative);
	}

	or(...queries: Query[]) {
		return new OrQuery(new QueryList(queries));
	}

	orderBy(...sortItems: (string | IndexedName/* | Score | Sort*/)[]) {
		const sortOrder = [];

		// let scoreOption: string;

		for (const sortItem of sortItems) {
			if (typeof sortItem === 'string') {
				sortOrder.push(this.sort(sortItem));
			} else {
				sortOrder.push(sortItem);
			}
		}

		this.#orderByClause = {
			'sort-order': sortOrder,
			// scoreOption,
		}

		return this;
	}

	ordered(isOrdered: boolean) {
		return new Ordered(isOrdered);
	}

	parseBindings(_query: Query /*| ParseFunction*/ | (Query /*| ParseFunction*/)[], _emptyBinding?: BindEmpty) {
		// const constraints = [];

		// for (const element of ([] as (Query /*| ParseFunction*/)[]).concat(query)) {
		// 	if (element.name) {
		// 		constraints.push(element);
		// 	}
		// }
	}

	parsedFrom() {

	}

	parseFunction() {

	}

	pathIndex(pathExpression: string, namespaces?: Record<string, string>) {
		return new PathIndex(pathExpression, namespaces);
	}

	period(startDate: string | Date, endDate?: string | Date) {
		return new Period(startDate, endDate);
	}

	periodCompare(axis1: string, operator: string, axis2: string, temporalOptions?: TemporalOptions) {
		return new PeriodCompareQuery(axis1, operator, axis2, temporalOptions?.['temporal-option']);
	}

	periodRange(axis: string, operator: string, period: Period, temporalOptions?: TemporalOptions) {
		return new PeriodRangeQuery(axis, operator, period, temporalOptions?.['temporal-option']);
	}

	point(latitude: number, longitude: number): Point;
	point(latLon: LatLong | Point): Point;
	point(latLonOrLatitude: number | LatLong | Point, longitude?: number) {
		return LatLong.isLatLong(latLonOrLatitude)
			? new Point([latLonOrLatitude])
			: Point.isPoint(latLonOrLatitude)
				? new Point(latLonOrLatitude.point)
				: new Point([new LatLong(latLonOrLatitude, longitude!)]);
	}

	polygon(...points: (LatLong | [number, number])[]) {
		return new Polygon(points.map(point => LatLong.isLatLong(point) ? point : new LatLong(...point)));
	}

	propertiesFragment(query: Query) {
		return new PropertiesFragmentQuery(query);
	}

	property(name: string) {
		return new JSONProperty(name);
	}

	qname(name: string): QName;
	qname(ns: string, name: string): QName;
	qname(nsOrName: string, name?: string) {
		if (!name) {
			return new QName(null, nsOrName);
		}

		return new QName(nsOrName, name);
	}

	range() {

	}

	rangeOptions() {

	}

	scope(propertyOrIndex: JSONProperty | IndexedName | string, query: Query, fragmentScope: FragmentScope): ContainerQuery;
	scope(propertyOrIndex: JSONProperty | IndexedName | string, query: Binding, fragmentScope: FragmentScope): ContainerConstraint;
	scope(propertyOrIndex: JSONProperty | IndexedName | string, queryOrConstraintName: Query | Binding, fragmentScope: FragmentScope) {
		const index = typeof propertyOrIndex === 'string' ? this.property(propertyOrIndex) : propertyOrIndex;

		if (queryOrConstraintName instanceof Query) {
			return new ContainerQuery(new Contained(index, fragmentScope['fragment-scope'], queryOrConstraintName));
		} else {
			return new ContainerConstraint(queryOrConstraintName.constraintName, new Contained(index, fragmentScope['fragment-scope']));
		}
	}

	score() {

	}

	slice() {

	}

	snippet() {

	}

	sort(_sortItem: string | IndexedName/* | Score*/, _direction?: 'ascending' | 'descending') {

	}

	suggestBindings(..._a: unknown[]) {
		// return this.#makeBindings('suggest', ...a);
	}

	suggestOptions(options: string[]) {
		return new SuggestOptions(options);
	}

	southWestNorthEast(south: number, west: number, north: number, east: number) {
		return new Box(south, west, north, east);
	}

	temporalOptions(options: string[]) {
		return new TemporalOptions(options);
	}

	term() {

	}

	termOptions() {

	}

	textQuery(..._a: unknown[]) {

	}

	transform() {

	}

	trueQuery() {
		return new TrueQuery();
	}

	value(...a: unknown[]) {
		return this.textQuery('value', ...a);
	}

	weight(weight: number) {
		return new Weight(weight);
	}

	withOptions() {

	}

	where(): this;
	where(query: QBE): this;
	where(query: Query | Query[]): this;
	where(query?: Query | Query[] | QBE): this {
		if (!query) {
			this.#whereClause = { query: { queries: [this.and()] } };
			this.#queryType = 'structured';
		} else if (query instanceof QBE) {
			this.#whereClause = query;
			this.#queryType = 'qbe';
		// } else if (query instanceof CtsQuery) { // TODO
		// 	this.#whereClause = query;
		// 	this.#queryType = 'cts';
		} else if (query instanceof Query) {
			this.#whereClause = { query: { queries: [query] } };
			this.#queryType = 'structured';
		} else if (Array.isArray(query)) {
			// TODO: get parsed query, fragment scope, if any out of the array and remove them from the resulting
			const queries = query;
			// let parsedQuery: ParsedQuery['parsedQuery'] | undefined;
			let fragmentScope: FragmentScope['fragment-scope'] | undefined;

			this.#whereClause = {
				query: { queries },
				// parsedQuery,
				'fragment-scope': fragmentScope,
			};
			this.#queryType = 'structured';
		}

		return this;
	}

	word(...a: unknown[]) {
		return this.textQuery('word', ...a);
	}
}
