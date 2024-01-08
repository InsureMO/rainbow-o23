import {Config} from '@rainbow-o23/n1';
import {BetterSqlite3ConnectionOptions} from 'typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions.js';
import {AbstractTypeOrmDataSource} from './abstract-datasource';

/**
 * use in memory when no database given.
 */
export class BetterSqlite3TypeOrmDatasource extends AbstractTypeOrmDataSource<BetterSqlite3ConnectionOptions> {
	/**
	 * better sqlite3 use single connection, not matter how many query runner created.
	 * so it cannot be kept in global level, otherwise all query runner will use the same connection.
	 */
	public shouldKeptOnGlobal(): boolean {
		return false;
	}

	/**
	 * override me if there are more options
	 */
	protected createOptions(config: Config): BetterSqlite3ConnectionOptions {
		const name = this.getName();
		return {
			type: 'better-sqlite3',
			database: config.getString(`typeorm.${name}.database`, ':memory:'),
			synchronize: config.getBoolean(`typeorm.${name}.synchronize`, false),
			logging: config.getBoolean(`typeorm.${name}.logging`, false)
		};
	}
}
