import {Config} from '@rainbow-o23/n1';
import {OracleConnectionOptions} from 'typeorm/driver/oracle/OracleConnectionOptions';
import {AbstractTypeOrmDataSource} from './abstract-datasource';

export class OracleTypeOrmDatasource extends AbstractTypeOrmDataSource<OracleConnectionOptions> {
	/**
	 * override me if there are more options
	 */
	protected createOptions(config: Config): OracleConnectionOptions {
		const name = this.getName();
		return {
			type: 'oracle',
			host: config.getString(`typeorm.${name}.host`, 'localhost'),
			port: config.getNumber(`typeorm.${name}.port`, 1521),
			username: config.getString(`typeorm.${name}.username`),
			password: config.getString(`typeorm.${name}.password`),
			database: config.getString(`typeorm.${name}.database`),
			sid: config.getString(`typeorm.${name}.sid`),
			serviceName: config.getString(`typeorm.${name}.service.name`),
			connectString: config.getString(`typeorm.${name}.connect.string`),
			schema: config.getString(`typeorm.${name}.schema`),
			poolSize: config.getNumber(`typeorm.${name}.pool.size`),
			synchronize: config.getBoolean(`typeorm.${name}.synchronize`, false),
			logging: config.getBoolean(`typeorm.${name}.logging`, false)
		};
	}
}
