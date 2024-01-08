import {Config, UncatchableError, Undefinable} from '@rainbow-o23/n1';
import {DataSourceOptions} from 'typeorm';
import {ERR_TYPEORM_DATASOURCE_CREATOR_NOT_FOUND, ERR_TYPEORM_DATASOURCE_TYPE_NOT_FOUND} from '../error-codes';
import {TypeOrmDataSource} from './abstract-datasource';
import {BetterSqlite3TypeOrmDatasource} from './better-sqlite3-datasource';
import {MssqlTypeOrmDatasource} from './mssql-datasource';
import {MysqlTypeOrmDatasource} from './mysql-datasource';
import {OracleTypeOrmDatasource} from './oracle-datasource';
import {PgsqlTypeOrmDatasource} from './pgsql-datasource';

export type DataSourceCreate = (name: string) => Promise<TypeOrmDataSource>;

export type DataSourceType = string;

export enum SupportedDataSourceTypes {
	MYSQL = 'mysql',
	POSTGRES = 'pgsql',
	MSSQL = 'mssql',
	ORACLE = 'oracle',
	BETTER_SQLITE3 = 'better-sqlite3'
}

const DATASOURCE_CREATORS: Record<DataSourceType, DataSourceCreate> = {
	[SupportedDataSourceTypes.MYSQL]: async (name: string) => new MysqlTypeOrmDatasource(name),
	[SupportedDataSourceTypes.POSTGRES]: async (name: string) => new PgsqlTypeOrmDatasource(name),
	[SupportedDataSourceTypes.MSSQL]: async (name: string) => new MssqlTypeOrmDatasource(name),
	[SupportedDataSourceTypes.ORACLE]: async (name: string) => new OracleTypeOrmDatasource(name),
	[SupportedDataSourceTypes.BETTER_SQLITE3]: async (name: string) => new BetterSqlite3TypeOrmDatasource(name)
};

const DATASOURCES: Record<string, TypeOrmDataSource> = {};
const CREATORS: Record<string, () => Promise<TypeOrmDataSource>> = {};

export class TypeOrmDataSourceManager {
	// noinspection JSUnusedLocalSymbols
	private constructor() {
		// avoid extend
	}

	public static registerCreator(type: DataSourceType, create: DataSourceCreate): Undefinable<DataSourceCreate> {
		const existing = DATASOURCE_CREATORS[type];
		DATASOURCE_CREATORS[type] = create;
		return existing;
	}

	public static async createDataSource(name: string, config: Config, entities: DataSourceOptions['entities']): Promise<TypeOrmDataSource> {
		const type = TypeOrmDataSourceManager.findDataSourceType(name, config);
		const create = DATASOURCE_CREATORS[type];

		CREATORS[name] = async () => {
			const dataSource = await create(name);
			await dataSource.initialize(config, entities);
			if (config.getBoolean(`typeorm.${name}.kept.on.global`) ?? dataSource.shouldKeptOnGlobal()) {
				DATASOURCES[name] = dataSource;
			}
			return dataSource;
		};
		return await CREATORS[name]();
	}

	public static async findDataSource(name: string, config: Config): Promise<Undefinable<TypeOrmDataSource>> {
		const dataSource = DATASOURCES[name];
		if (dataSource == null) {
			const create = CREATORS[name];
			if (create != null) {
				return await CREATORS[name]();
			} else {
				// create data source with no entity
				return await TypeOrmDataSourceManager.createDataSource(name, config, []);
			}
		} else {
			return dataSource;
		}
	}

	public static findDataSourceType(name: string, config: Config): DataSourceType {
		const type: DataSourceType = config.getString(`typeorm.${name}.type`);
		if (type == null) {
			throw new UncatchableError(ERR_TYPEORM_DATASOURCE_TYPE_NOT_FOUND,
				`Data source type by given configuration[typeorm.${name}.type] not found.`);
		}
		const create = DATASOURCE_CREATORS[type];
		if (create == null) {
			throw new UncatchableError(ERR_TYPEORM_DATASOURCE_CREATOR_NOT_FOUND,
				`Data source creator by given configuration[typeorm.${name}.type=${type}] not found.`);
		}
		return type;
	}
}

// noinspection JSUnusedGlobalSymbols
export class TypeOrmDataSourceHelper {
	public constructor(private readonly config: Config) {
	}

	public registerCreator(type: DataSourceType, create: DataSourceCreate): Undefinable<DataSourceCreate> {
		return TypeOrmDataSourceManager.registerCreator(type, create);
	}

	public async create(dataSources: Record<string, DataSourceOptions['entities']>): Promise<void> {
		await Promise.all(Object.keys(dataSources)
			.map(async name => await TypeOrmDataSourceManager.createDataSource(name, this.config, dataSources[name] ?? [])));
	}
}
