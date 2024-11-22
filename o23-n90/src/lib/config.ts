import {BootstrapOptions} from '@rainbow-o23/n2';
import {DEFAULT_TRANSACTION_NAME, TypeOrmDataSourceName, TypeOrmTransactionName} from '@rainbow-o23/n3';
import {
	DefCreate,
	DiversifiedReader,
	FuncReader,
	MatchableReader,
	Reader,
	ReaderOptions,
	YmlReader
} from '@rainbow-o23/n4';

export enum ConfigConstants {
	APP_ENV_STRICT_MODE = 'app.env.strict',
	APP_ENV_REDRESS_TYPEORM_DATASOURCE = 'app.env.redress.typeorm.datasource',
	APP_ENV_REDRESS_TYPEORM_TRANSACTION = 'app.env.redress.typeorm.transaction',
	DEFAULT_DATASOURCE_KEY = 'app.datasource.default',
	CONFIG_DATASOURCE_KEY = 'app.datasource.config',
	CONFIG_DATASOURCE_DEFAULT_NAME = 'o23',
	CONFIG_DATASOURCE_AUTO_SCAN = 'app.datasource.scan',
	APP_INIT_PIPELINES_DIR = 'app.init.pipelines.dir',
	APP_INIT_PIPELINE_FILE = 'app.init.pipeline.file',
	APP_EXCLUDED_PIPELINE_DIR = 'app.excluded.pipelines.dirs',
	APP_SERVER_INIT_PIPELINES_DEFAULT_DIR = 'server',
	APP_SCRIPTS_INIT_PIPELINES_DEFAULT_DIR = 'scripts',
	APP_SCRIPTS_DEFAULT_DIR = 'db-scripts'
}

export interface PipelineDefInstallContext {
	typeorm?: {
		datasources?: Record<TypeOrmDataSourceName, Record<TypeOrmTransactionName, true>>;
	};
}

export type PipelineDefUninstall = (context: PipelineDefInstallContext) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PipelineDefInstall = (given: any, context: PipelineDefInstallContext) => PipelineDefUninstall | void;
export type CreatePipelineDefInstall = (options: BootstrapOptions) => PipelineDefInstall | void;

const createTypeOrmDataSourceInstall: CreatePipelineDefInstall = (options: BootstrapOptions): PipelineDefInstall | void => {
	if (options.getEnvAsBoolean(ConfigConstants.APP_ENV_REDRESS_TYPEORM_DATASOURCE, true)) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		return (given: any, _context: PipelineDefInstallContext): void => {
			if (given.use != null && given.use.startsWith('typeorm-')) {
				if (given.datasource == null || given.datasource.trim().length === 0) {
					given.datasource = `env:${ConfigConstants.DEFAULT_DATASOURCE_KEY}`;
				}
			}
		};
	}
};
const createTypeOrmTransactionInstall: CreatePipelineDefInstall = (options: BootstrapOptions): PipelineDefInstall | void => {
	if (options.getEnvAsBoolean(ConfigConstants.APP_ENV_REDRESS_TYPEORM_TRANSACTION, true)) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (given: any, context: PipelineDefInstallContext): PipelineDefUninstall => {
			if (given.use != null && given.use.startsWith('typeorm-transactional')) {
				context.typeorm = context.typeorm ?? {};
				context.typeorm.datasources = context.typeorm.datasources ?? {};
				const datasource = (given.datasource || '').trim();
				if (datasource.length === 0) {
					// no datasource declared
					return;
				}
				if (context.typeorm.datasources[datasource] == null) {
					context.typeorm.datasources[datasource] = {};
				}
				const transaction = (given.transaction || DEFAULT_TRANSACTION_NAME).trim();
				if (context.typeorm.datasources[datasource][transaction] == null) {
					// no transaction declared for this datasource
					context.typeorm.datasources[datasource][transaction] = true;
				} else {
					// TODO TRANSACTION ALREADY DECLARED, NEED REPORT
				}
				return (context: PipelineDefInstallContext): void => {
					delete context.typeorm.datasources[datasource][transaction];
				};
			} else if (given.use != null && given.use.startsWith('typeorm-')) {
				const datasource = (given.datasource || '').trim();
				if (datasource.length === 0) {
					// no datasource declared
					return;
				}
				if (given.autonomous !== true) {
					// no autonomous declared
					// find all transactions that can be managed up to the current step
					const transactions = context.typeorm?.datasources?.[datasource] ?? {};
					// check transaction is declared or not
					const hasTransaction = given.transaction != null && given.transaction.trim().length !== 0;
					if (Object.keys(transactions).length === 1) {
						// only one transaction declared
						const transaction = (given.transaction || DEFAULT_TRANSACTION_NAME).trim();
						if (transaction === Object.keys(transactions)[0]) {
							// fix transaction if no declared
							given.transaction = transaction;
						} else {
							// TODO DECLARED TRANSACTION NOT FOUND, NEED REPORT
						}
					} else if (!hasTransaction) {
						// no transaction declared
						if (Object.keys(transactions).length === 0) {
							// not within transaction
							given.autonomous = true;
						}
					} else if (transactions[(given.transaction || DEFAULT_TRANSACTION_NAME).trim()] == null) {
						// TODO DECLARED TRANSACTION NOT FOUND, NEED REPORT
					}
				}
			}
		};
	}
};

export class ConfigUtils {
	// noinspection JSUnusedLocalSymbols
	private constructor() {
		// avoid extend
	}

	/**
	 * 1. use config key
	 * 2. use default key if (1) not found
	 * 3. use default name
	 */
	public static getConfigDataSourceName(options: BootstrapOptions): string {
		return options.getEnvAsString(ConfigConstants.CONFIG_DATASOURCE_KEY,
			options.getEnvAsString(ConfigConstants.DEFAULT_DATASOURCE_KEY, ConfigConstants.CONFIG_DATASOURCE_DEFAULT_NAME));
	}

	public static createUnderlayDefReaders(options: ReaderOptions): Array<MatchableReader> {
		return [{
			accept: (content: string): boolean => typeof content === 'string',
			reader: new YmlReader(options)
		}, {
			accept: (content: DefCreate): boolean => typeof content === 'function',
			reader: new FuncReader(options)
		}];
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static createDefReader(options: BootstrapOptions): Reader<any> {
		const strict = options.getEnvAsBoolean(ConfigConstants.APP_ENV_STRICT_MODE, true);
		const readerOptions: ReaderOptions = {config: options.getConfig()};
		if (strict) {
			return new DiversifiedReader(readerOptions, ...ConfigUtils.createUnderlayDefReaders(readerOptions));
		}
		const installs = [
			createTypeOrmDataSourceInstall(options),
			createTypeOrmTransactionInstall(options)
		].filter(x => x != null);
		// loose mode
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const redress = (given: any, context?: PipelineDefInstallContext): any => {
			if (context == null) {
				context = {};
			}
			if (given == null) {
				return given;
			} else if (Array.isArray(given)) {
				return given.map(item => redress(item, context));
			} else if (typeof given === 'object') {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const uninstalls = installs.map(install => install(given, context));
				const redressed = Object.keys(given).reduce((redressed, key) => {
					redressed[key] = redress(given[key], context);
					return redressed;
				}, {});
				uninstalls.forEach(uninstall => uninstall && uninstall(context));
				return redressed;
			} else {
				return given;
			}
		};
		readerOptions.redress = redress;
		return new DiversifiedReader(readerOptions, ...ConfigUtils.createUnderlayDefReaders(readerOptions));
	}
}
