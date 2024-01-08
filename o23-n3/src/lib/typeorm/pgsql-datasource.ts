import {Config} from '@rainbow-o23/n1';
import {PostgresConnectionOptions} from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import {AbstractTypeOrmDataSource} from './abstract-datasource';

export class PgsqlTypeOrmDatasource extends AbstractTypeOrmDataSource<PostgresConnectionOptions> {
	/**
	 * override me if there are more options
	 */
	protected createOptions(config: Config): PostgresConnectionOptions {
		const name = this.getName();
		return {
			type: 'postgres',
			host: config.getString(`typeorm.${name}.host`, 'localhost'),
			port: config.getNumber(`typeorm.${name}.port`, 5432),
			username: config.getString(`typeorm.${name}.username`),
			password: config.getString(`typeorm.${name}.password`),
			database: config.getString(`typeorm.${name}.database`),
			schema: config.getString(`typeorm.${name}.schema`),
			poolSize: config.getNumber(`typeorm.${name}.pool.size`),
			synchronize: config.getBoolean(`typeorm.${name}.synchronize`, false),
			logging: config.getBoolean(`typeorm.${name}.logging`, false),
			connectTimeoutMS: config.getNumber(`typeorm.${name}.connect.timeout`)
		};
	}
}
