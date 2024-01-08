import {BootstrapOptions} from '@rainbow-o23/n2';
import {TypeOrmDataSourceHelper} from '@rainbow-o23/n3';
import {ConfigConstants, ConfigUtils} from '../config';

/**
 * typeorm data source initializer.
 * assume all data source name are in lower cases, and in env is concatenated by underscore.
 * if typeorm data source needs to be initialized manually, declare an env key CFG_TYPEORM_{NAME}_MANUAL_INIT as true to bypass the auto initializing.
 */
export class TypeOrmInitializer {
	public constructor() {
		// do nothing
	}

	public async load(options: BootstrapOptions): Promise<void> {
		await this.initConfigDataSource(options);
		await this.scanDataSources(options);
	}

	protected async initConfigDataSource(options: BootstrapOptions) {
		const dataSourceName = ConfigUtils.getConfigDataSourceName(options);
		await new TypeOrmDataSourceHelper(options.getConfig()).create({[dataSourceName]: []});
	}

	protected async scanDataSources(options: BootstrapOptions): Promise<void> {
		if (!options.getEnvAsBoolean(ConfigConstants.CONFIG_DATASOURCE_AUTO_SCAN, true)) {
			return;
		}
		await Promise.all(Object.keys(process.env)
			.filter(key => key.startsWith('CFG_TYPEORM_') && key.endsWith('_TYPE'))
			// ignore the configuration data source
			.filter(key => key !== `CFG_TYPEORM_${ConfigUtils.getConfigDataSourceName(options).replace(/\./g, '_').toUpperCase()}_TYPE`)
			.map(key => key.replace(/^CFG_TYPEORM_(.+)_TYPE$/, '$1'))
			// ignore the manual initializing
			.filter(key => options.getEnvAsBoolean(`CFG_TYPEORM_${key}_MANUAL_INIT`, false))
			.map(key => key.toLowerCase().replace(/_/g, '.'))
			.map(async name => await new TypeOrmDataSourceHelper(options.getConfig()).create({[name]: []})));
	}
}
