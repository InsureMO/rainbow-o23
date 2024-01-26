import {PipelineStepPayload, StepHelpersUtils, UncatchableError, Undefinable} from '@rainbow-o23/n1';
import {ERR_TYPEORM_SQL_NOT_EMPTY} from '../error-codes';
import {Utils} from '../step';
import {DataSourceType, SupportedDataSourceTypes} from '../typeorm';
import {AbstractTypeOrmPipelineStep, TypeOrmPipelineStepOptions} from './abstract-typeorm-step';
import {TypeOrmEntityToSave, TypeOrmEntityValue, TypeOrmSql} from './types';

export interface TypeOrmBasis {
	sql?: TypeOrmSql;
}

export interface TypeOrmBySQLPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = TypeOrmBasis, OutFragment = Out>
	extends TypeOrmPipelineStepOptions<In, Out, InFragment, OutFragment> {
	sql?: TypeOrmSql;
}

export interface ParsedTypeOrmSql {
	sql: TypeOrmSql;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	params: Array<any>;
}

export enum ParsedSqlSegmentType {
	NONE = 'none',
	SINGLE = 'single',
	/** in */
	ONE_OF = 'one-of',
	/** %x% */
	CONTAINS = 'contains',
	/** %x */
	ENDS_WITH = 'ends-with',
	/** x% */
	STARTS_WITH = 'starts-with'
}

export interface ParsedSqlSegment {
	statement: string;
	type: ParsedSqlSegmentType;
	/** effective when type is not none */
	variable?: string;
}

export class TypeOrmParsedSQLCache {
	[key: TypeOrmSql]: Array<ParsedSqlSegment>;
}

interface KindOfMySQLResult {
	changedRows?: number;
	affectedRows?: number;
	insertId?: string | number;
}

const PARSED_SQL_CACHE: TypeOrmParsedSQLCache = {};

/**
 * sql could be defined in step itself, or passed by in fragment.
 * if sql is carried by in fragment, sql from options should be ignored.
 */
export abstract class AbstractTypeOrmBySQLPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = Undefinable<TypeOrmBasis>, OutFragment = Out>
	extends AbstractTypeOrmPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _timestampWriteFormat: string;
	private readonly _timestampReadFormat: string;
	private readonly _sql: TypeOrmSql;
	private _parsedSqlSegments: Undefinable<Array<ParsedSqlSegment>> = (void 0);

	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	public constructor(options: TypeOrmBySQLPipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		this._sql = options.sql;
		const formats = this.getDefaultTimestampFormats();
		this._timestampWriteFormat = this.getConfig().getString(`typeorm.${this.getDataSourceName()}.timestamp.format.write`, formats.write);
		this._timestampReadFormat = this.getConfig().getString(`typeorm.${this.getDataSourceName()}.timestamp.format.read`, formats.read);
	}

	/**
	 * read: dayjs pattern
	 * write: database dialect
	 */
	protected getDefaultTimestampFormats(): { write: string, read: string } {
		switch (this.findDataSourceType()) {
			case SupportedDataSourceTypes.ORACLE:
				// TO_TIMESTAMP(X, WRITE)
				return {read: 'YYYY-MM-DD HH:mm:ss', write: 'YYYY-MM-DD HH24:MI:SS'};
			case SupportedDataSourceTypes.POSTGRES:
				// TO_TIMESTAMP(X, WRITE)
				return {read: 'YYYY-MM-DDTHH:mm:ss.SSSZ', write: 'YYYY-MM-DD HH24:MI:SS'};
			case SupportedDataSourceTypes.MYSQL:
				// STR_TO_DATE(X, WRITE)
				return {read: 'YYYY-MM-DD HH:mm:ss', write: '%Y-%m-%d %H:%k:%s'};
			case SupportedDataSourceTypes.MSSQL:
				// FORMAT(X, WRITE)
				return {read: 'YYYY-MM-DD HH:mm:ss', write: 'yyyy-MM-dd hh:mm:ss'};
			case SupportedDataSourceTypes.BETTER_SQLITE3:
			default:
				return {read: 'YYYY-MM-DD HH:mm:ss', write: 'YYYY-MM-DD HH:MM:SS'};
		}
	}

	protected getTimestampWriteFormat(): string {
		return this._timestampWriteFormat;
	}

	protected getTimestampReadFormat(): string {
		return this._timestampReadFormat;
	}

	protected getParsedSqlSegments(): Undefinable<Array<ParsedSqlSegment>> {
		return this._parsedSqlSegments;
	}

	protected parseSql(sql: TypeOrmSql): void {
		if (this.getConfig().getBoolean('typeorm.sql.cache.enabled', true)) {
			// TODO TYPEORM SQL CACHE
			const segments = PARSED_SQL_CACHE[sql];
			if (segments != null && segments.length !== 0) {
				this._parsedSqlSegments = segments;
				return;
			}
		}

		let hasOneOf = false;
		this._parsedSqlSegments = sql.match(/[^$]+|[$]/g).reduce((context, segment) => {
			if (context.$) {
				// split to variable name part and standard statement part
				const isContainsOrEndsWith = segment.startsWith('%');
				const s = isContainsOrEndsWith ? segment.substring(1) : segment;
				const chars = [' ', '\n', '\r', '\t', ',', ')', '+', '-', '*', '/', '%'];
				let firstPosition = -1;
				for (const char of chars) {
					const position = s.indexOf(char);
					if (position !== -1 && (firstPosition === -1 || position < firstPosition)) {
						if (char === '%') {
							firstPosition = position + 1;
						} else {
							firstPosition = position;
						}
					}
				}
				if (firstPosition === -1) {
					// nothing found, segment is variable name
					if (isContainsOrEndsWith) {
						// ends with
						context.segments.push({statement: segment, type: ParsedSqlSegmentType.ENDS_WITH, variable: s});
					} else if (s.startsWith('...')) {
						context.segments.push({
							statement: segment,
							type: ParsedSqlSegmentType.ONE_OF,
							variable: s.substring(3)
						});
						hasOneOf = true;
					} else {
						context.segments.push({statement: segment, type: ParsedSqlSegmentType.SINGLE, variable: s});
					}
				} else {
					const variable = s.substring(0, firstPosition);
					const rest = s.substring(firstPosition);
					if (variable.endsWith('%')) {
						if (isContainsOrEndsWith) {
							// contains
							context.segments.push({
								statement: variable,
								type: ParsedSqlSegmentType.CONTAINS,
								variable: variable.substring(0, firstPosition - 1)
							});
						} else {
							// starts with
							context.segments.push({
								statement: variable,
								type: ParsedSqlSegmentType.STARTS_WITH,
								variable: variable.substring(0, firstPosition - 1)
							});
						}
					} else {
						if (isContainsOrEndsWith) {
							// ends with
							context.segments.push({
								statement: variable,
								type: ParsedSqlSegmentType.ENDS_WITH,
								variable
							});
						} else if (variable.startsWith('...')) {
							context.segments.push({
								statement: variable,
								type: ParsedSqlSegmentType.ONE_OF,
								variable: variable.substring(3)
							});
							hasOneOf = true;
						} else {
							// starts with
							context.segments.push({statement: variable, type: ParsedSqlSegmentType.SINGLE, variable});
						}
					}
					context.segments.push({statement: rest, type: ParsedSqlSegmentType.NONE});
				}
				context.$ = false;
			} else if (segment === '$') {
				context.$ = true;
			} else {
				context.segments.push({statement: segment, type: ParsedSqlSegmentType.NONE});
			}
			return context;
		}, {$: false, segments: []} as { $: boolean, segments: Array<ParsedSqlSegment> }).segments;
		if (!hasOneOf) {
			PARSED_SQL_CACHE[sql] = this._parsedSqlSegments;
		}
	}

	protected replaceSqlPagination(sql: TypeOrmSql, type: DataSourceType): TypeOrmSql {
		if (!/\$\.limit/gmi.test(sql)) {
			// no pagination
			return sql;
		}
		switch (type) {
			case SupportedDataSourceTypes.POSTGRES:
				return sql.replace(/^(.*)(\$\.limit\((.+),\s*(.+)\))(.*)$/gmi, '$1OFFSET $3 LIMIT $4$5');
			case SupportedDataSourceTypes.MSSQL:
				if (/order\s+by/i.test(sql)) {
					return sql.replace(/^(.*)(\$\.limit\((.+),\s*(.+)\))(.*)$/gmi, '$1OFFSET $3 ROWS FETCH NEXT $4$5 ROWS ONLY');
				} else {
					// mssql always need an order by part, otherwise raise exception
					return sql.replace(/^(.*)(\$\.limit\((.+),\s*(.+)\))(.*)$/gmi, '$1ORDER BY 1 OFFSET $3 ROWS FETCH NEXT $4$5 ROWS ONLY');
				}
			case SupportedDataSourceTypes.ORACLE:
				// 12c and later
				return sql.replace(/^(.*)(\$\.limit\((.+),\s*(.+)\))(.*)$/gmi, '$1OFFSET $3 ROWS FETCH NEXT $4$5 ROWS ONLY');
			case SupportedDataSourceTypes.MYSQL:
			case SupportedDataSourceTypes.BETTER_SQLITE3:
			default:
				return sql.replace(/^(.*)(\$\.limit\((.+),\s*(.+)\))(.*)$/gmi, '$1LIMIT $3, $4$5');
		}
	}

	protected computeSqlPlaceholder(options: {
		segment: ParsedSqlSegment; placeholderIndex: number; datasourceType: DataSourceType
	}): string {
		const {segment, placeholderIndex, datasourceType} = options;
		switch (datasourceType) {
			case SupportedDataSourceTypes.POSTGRES:
				// psql starts from 1, using $1, $2, etc
				return `$${placeholderIndex + 1}`;
			case SupportedDataSourceTypes.MSSQL:
				// mysql starts from 0, using @0, @1, etc.
				return `@${placeholderIndex}`;
			case SupportedDataSourceTypes.ORACLE:
				// oracle starts from 0, using :0, :1, etc
				if (segment.type === ParsedSqlSegmentType.SINGLE && segment.variable.endsWith('.@ts')) {
					return `TO_TIMESTAMP(:${placeholderIndex}, '${this.getTimestampWriteFormat()}')`;
				} else {
					return `:${placeholderIndex}`;
				}
			case SupportedDataSourceTypes.MYSQL:
			case SupportedDataSourceTypes.BETTER_SQLITE3:
			default:
				// using ?, index is not needed
				return '?';
		}
	}

	protected getBindingValue(options: {
		params: TypeOrmEntityToSave; segment: ParsedSqlSegment; datasourceType: DataSourceType;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	}): any {
		const {params, segment} = options;

		const json = segment.variable.endsWith('.@json');
		const bool = segment.variable.endsWith('.@bool');
		const timestamp = segment.variable.endsWith('.@ts');
		let variable = segment.variable;
		if (json) {
			variable = variable.substring(0, variable.length - 6);
		} else if (bool) {
			variable = variable.substring(0, variable.length - 6);
		} else if (timestamp) {
			variable = variable.substring(0, variable.length - 4);
		}

		const value = Utils.getValue(params, variable);
		if (value == null) {
			return value;
		} else if (json) {
			if (typeof value === 'object') {
				return JSON.stringify(value);
			} else {
				return value;
			}
		} else if (bool) {
			return value === true || value === '1' ? 1 : 0;
		} else if (timestamp) {
			return value;
		} else {
			return value;
		}
	}

	protected getSql(basis: Undefinable<TypeOrmBasis>, params: Array<TypeOrmEntityValue> | TypeOrmEntityToSave): ParsedTypeOrmSql {
		let sql: TypeOrmSql;
		if (basis?.sql == null || basis.sql.trim().length === 0) {
			if (this._sql == null || this._sql.trim().length === 0) {
				throw new UncatchableError(ERR_TYPEORM_SQL_NOT_EMPTY, 'SQL cannot be empty.');
			}
			sql = this._sql;
		} else {
			sql = basis.sql;
		}
		const datasourceType = this.findDataSourceType();
		sql = this.replaceSqlPagination(sql, datasourceType);
		if (params == null || Array.isArray(params)) {
			// no parameters or given parameters is an array,
			// which means sql does not include any named variable, return directly
			return {sql, params: (params ?? []) as Array<TypeOrmEntityValue>};
		} else {
			// parse given sql
			this.parseSql(sql);
		}

		let placeholderIndex = 0;
		// build parsed sql, and params
		return this.getParsedSqlSegments().reduce((parsed, segment) => {
			switch (segment.type) {
				case ParsedSqlSegmentType.SINGLE:
					parsed.sql = parsed.sql + this.computeSqlPlaceholder({segment, placeholderIndex, datasourceType});
					parsed.params.push(this.getBindingValue({params, segment, datasourceType}));
					placeholderIndex++;
					break;
				case ParsedSqlSegmentType.STARTS_WITH:
					switch (datasourceType) {
						case SupportedDataSourceTypes.POSTGRES:
						case SupportedDataSourceTypes.ORACLE:
							parsed.sql = parsed.sql + `${this.computeSqlPlaceholder({
								segment,
								placeholderIndex,
								datasourceType
							})} || '%'`;
							break;
						case SupportedDataSourceTypes.MSSQL:
						case SupportedDataSourceTypes.MYSQL:
						case SupportedDataSourceTypes.BETTER_SQLITE3:
						default:
							parsed.sql = parsed.sql + `CONCAT(${this.computeSqlPlaceholder({
								segment,
								placeholderIndex,
								datasourceType
							})}, '%')`;
					}
					parsed.params.push(this.getBindingValue({params, segment, datasourceType}));
					placeholderIndex++;
					break;
				case ParsedSqlSegmentType.CONTAINS:
					switch (datasourceType) {
						case SupportedDataSourceTypes.POSTGRES:
						case SupportedDataSourceTypes.ORACLE:
							parsed.sql = parsed.sql + `'%' || ${this.computeSqlPlaceholder({
								segment,
								placeholderIndex,
								datasourceType
							})} || '%'`;
							break;
						case SupportedDataSourceTypes.MSSQL:
						case SupportedDataSourceTypes.MYSQL:
						case SupportedDataSourceTypes.BETTER_SQLITE3:
						default:
							parsed.sql = parsed.sql + `CONCAT('%', ${this.computeSqlPlaceholder({
								segment,
								placeholderIndex,
								datasourceType
							})}, '%')`;
					}
					parsed.params.push(this.getBindingValue({params, segment, datasourceType}));
					placeholderIndex++;
					break;
				case ParsedSqlSegmentType.ENDS_WITH:
					switch (datasourceType) {
						case SupportedDataSourceTypes.POSTGRES:
						case SupportedDataSourceTypes.ORACLE:
							parsed.sql = parsed.sql + `'%' || ${this.computeSqlPlaceholder({
								segment,
								placeholderIndex,
								datasourceType
							})}`;
							break;
						case SupportedDataSourceTypes.MSSQL:
						case SupportedDataSourceTypes.MYSQL:
						case SupportedDataSourceTypes.BETTER_SQLITE3:
						default:
							parsed.sql = parsed.sql + `CONCAT('%', ${this.computeSqlPlaceholder({
								segment,
								placeholderIndex,
								datasourceType
							})})`;
					}
					parsed.params.push(this.getBindingValue({params, segment, datasourceType}));
					placeholderIndex++;
					break;
				case ParsedSqlSegmentType.ONE_OF: {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					let values: Array<any> | any = this.getBindingValue({params, segment, datasourceType});
					if (!Array.isArray(values)) {
						values = [values];
					}
					if (values.length === 0) {
						// in statement, at least one value
						values.push(null);
					}
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					parsed.sql = parsed.sql + values.map(_ => {
						const placeholder = this.computeSqlPlaceholder({segment, placeholderIndex, datasourceType});
						placeholderIndex++;
						return placeholder;
					}).join(', ');
					parsed.params.push(...values);
					break;
				}
				case ParsedSqlSegmentType.NONE:
				default:
					parsed.sql = parsed.sql + segment.statement;
					break;
			}
			return parsed;
		}, {sql: '', params: []} as ParsedTypeOrmSql);
	}

	protected beautify<T>(options: { data: T; datasourceType: DataSourceType }): T {
		const {data} = options;

		if (data == null) {
			return data;
		} else {
			const $helpers = this.getHelpers();
			Object.keys(data)
				.map(key => {
					let json = false;
					let bool = false;
					let timestamp = false;
					let newKey = key;
					if (key.endsWith('.@json')) {
						json = true;
						newKey = key.substring(0, key.length - 6).trim();
					} else if (key.startsWith('[') && key.endsWith('.@json]')) {
						json = true;
						newKey = key.substring(1, key.length - 7).trim();
					} else if (key.endsWith('.@bool')) {
						bool = true;
						newKey = key.substring(0, key.length - 6).trim();
					} else if (key.startsWith('[') && key.endsWith('.@bool]')) {
						bool = true;
						newKey = key.substring(1, key.length - 7).trim();
					} else if (key.endsWith('.@ts')) {
						timestamp = true;
						newKey = key.substring(0, key.length - 4).trim();
					} else if (key.startsWith('[') && key.endsWith('.@ts]')) {
						timestamp = true;
						newKey = key.substring(1, key.length - 5).trim();
					}
					return {json, bool, timestamp, key, newKey};
				})
				.filter(({json, bool, timestamp}) => json === true || bool === true || timestamp === true)
				.forEach(({bool, timestamp, key, newKey}) => {
					const value = data[key];
					delete data[key];
					if (StepHelpersUtils.isBlank(value)) {
						if (bool === true) {
							// default value of boolean is false
							data[newKey] = false;
						} else {
							// json is null
							data[newKey] = null;
						}
					} else if (value instanceof Date) {
						data[newKey] = $helpers.$date.dayjs(value).format($helpers.$date.getDateTimeFormat());
					} else if (typeof value === 'string') {
						if (bool === true) {
							data[newKey] = value === '1';
						} else if (timestamp === true) {
							data[newKey] = $helpers.$date.dayjs(value, this.getTimestampReadFormat()).format($helpers.$date.getDateTimeFormat());
						} else {
							// try to parse to json
							data[newKey] = JSON.parse(value);
						}
					} else if (typeof value === 'number') {
						if (bool === true) {
							data[newKey] = value === 1;
						} else {
							// never occurs
							data[newKey] = value;
						}
					} else {
						data[newKey] = value;
					}
				});
			return data;
		}
	}

	/**
	 * handle insert/update/delete.
	 * 1. for mssql, according to the "OUTPUT" clause, there might be returned an object or an object array.
	 * 2. for pgsql, the "RETURNING" clause is not handled yet.
	 * 3. for oracle, do nothing special.
	 * 4. for mysql, try to return the corresponding number of affected rows, or inserted id.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected parseResult(result: any) {
		if (result == null) {
			return result;
		}
		const datasourceType = this.findDataSourceType();
		const resultType = typeof result;
		switch (true) {
			case ['number', 'bigint', 'string', 'boolean'].includes(resultType) :
				return result;
			case datasourceType === SupportedDataSourceTypes.MYSQL && resultType === 'object':
				// eslint-disable-next-line no-case-declarations
				const rst = result as KindOfMySQLResult;
				if (rst.changedRows != null) {
					// for update
					return rst.changedRows;
				} else if (rst.insertId != null) {
					// for auto increment insert, which not recommended
					// note if insertId exists, affectedRows will be ignored
					return rst.insertId;
				} else if (rst.affectedRows != null) {
					// for insert and delete
					return rst.affectedRows;
				} else {
					// other, such as SELECT
					return rst;
				}
			case datasourceType === SupportedDataSourceTypes.POSTGRES && resultType === 'object':
				switch (result.command) {
					case 'DELETE':
					case 'UPDATE':
						// for UPDATE and DELETE query additionally return number of affected rows
						// noinspection JSUnresolvedReference
						return result.rowCount;
					default:
						// eslint-disable-next-line no-prototype-builtins
						if (result.hasOwnProperty('rows')) {
							// for SELECT
							return (result.rows ?? []).map(item => this.beautify({data: item, datasourceType}));
						} else {
							// INSERT, an empty array
							return result;
						}
				}
			case datasourceType === SupportedDataSourceTypes.MSSQL && resultType === 'object':
				// MSSQL can return anything via OUTPUT clause
				if (Array.isArray(result)) {
					return result.map(item => this.beautify({data: item, datasourceType}));
				} else {
					return this.beautify({data: result, datasourceType});
				}
			default:
				return this.beautify({data: result, datasourceType});
		}
	}
}
