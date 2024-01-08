import {Config} from '@rainbow-o23/n1';
import {MysqlConnectionOptions} from 'typeorm/driver/mysql/MysqlConnectionOptions.js';
import {AbstractTypeOrmDataSource} from './abstract-datasource';

export class MysqlTypeOrmDatasource extends AbstractTypeOrmDataSource<MysqlConnectionOptions> {
	/**
	 * override me if there are more options
	 */
	protected createOptions(config: Config): MysqlConnectionOptions {
		const name = this.getName();
		return {
			type: 'mysql',
			host: config.getString(`typeorm.${name}.host`, 'localhost'),
			port: config.getNumber(`typeorm.${name}.port`, 3306),
			username: config.getString(`typeorm.${name}.username`),
			password: config.getString(`typeorm.${name}.password`),
			database: config.getString(`typeorm.${name}.database`),
			charset: config.getString(`typeorm.${name}.charset`),
			timezone: config.getString(`typeorm.${name}.timezone`),
			poolSize: config.getNumber(`typeorm.${name}.pool.size`),
			synchronize: config.getBoolean(`typeorm.${name}.synchronize`, false),
			logging: config.getBoolean(`typeorm.${name}.logging`, false),
			connectTimeout: config.getNumber(`typeorm.${name}.connect.timeout`),
			acquireTimeout: config.getNumber(`typeorm.${name}.acquire.timeout`),
			insecureAuth: config.getBoolean(`typeorm.${name}.insecure.auth`),
			supportBigNumbers: config.getBoolean(`typeorm.${name}.support.big.numbers`, true),
			bigNumberStrings: config.getBoolean(`typeorm.${name}.big.number.strings`, false),
			dateStrings: config.getBoolean(`typeorm.${name}.date.strings`),
			debug: config.getBoolean(`typeorm.${name}.debug`),
			trace: config.getBoolean(`typeorm.${name}.trace`),
			multipleStatements: config.getBoolean(`typeorm.${name}.multiple.statements`, false),
			legacySpatialSupport: config.getBoolean(`typeorm.${name}.legacy.spatial.support`)
		};
	}
}
