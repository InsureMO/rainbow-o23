import fs from 'fs-extra';
import path from 'path';
import prompts, {PromptObject} from 'prompts';
import {PluginOptions} from './plugins';
import {DatasourceTypes, Plugins} from './types';

export interface DatasourceOptions {
	configDataSourceName: string;
	configDataSourceType: DatasourceTypes;
	mysqlDataSourceNames: Array<string>;
	pgsqlDataSourceNames: Array<string>;
	oracleDataSourceNames: Array<string>;
	mssqlDataSourceNames: Array<string>;
}

type DatasourceEnvsForType = Array<string | [string, string]>;
type DatasourceEnvs = {
	[key in DatasourceTypes]?: DatasourceEnvsForType;
};

const findDataSources = (): Partial<DatasourceOptions> | undefined => {
	const options: Partial<DatasourceOptions> = {};
	process.argv.slice(3)
		.map(arg => arg.split('='))
		.forEach(([key, value]) => {
			switch (key) {
				case '--config-ds-name':
					options.configDataSourceName = value;
					break;
				case '--config-ds-type':
					if (Object.values(DatasourceTypes).includes(value as DatasourceTypes)) {
						options.configDataSourceType = value as DatasourceTypes;
					}
					break;
				case '--mysql-ds-names':
					options.mysqlDataSourceNames = value.split(',');
					break;
				case '--pgsql-ds-names':
					options.pgsqlDataSourceNames = value.split(',');
					break;
				case '--oracle-ds-names':
					options.oracleDataSourceNames = value.split(',');
					break;
				case '--mssql-ds-names':
					options.mssqlDataSourceNames = value.split(',');
					break;
				case '--use-ds-defaults':
					// fill default values
					options.configDataSourceName = options.configDataSourceName ?? 'o23';
					options.configDataSourceType = options.configDataSourceType ?? DatasourceTypes.MySQL;
					options.mysqlDataSourceNames = options.mysqlDataSourceNames ?? [];
					options.pgsqlDataSourceNames = options.pgsqlDataSourceNames ?? [];
					options.oracleDataSourceNames = options.oracleDataSourceNames ?? [];
					options.mssqlDataSourceNames = options.mssqlDataSourceNames ?? [];
					break;
			}
		});

	return options;
};

export const getDatasourceOptions = async (): Promise<DatasourceOptions> => {
	const options = findDataSources();
	const result = await prompts([
		(options.configDataSourceName ?? '').trim().length !== 0 ? null : {
			name: 'configDataSourceName',
			type: 'text',
			message: 'Configuration datasource name:',
			initial: 'o23'
		},
		options.configDataSourceType != null ? null : {
			name: 'configDataSourceType',
			type: 'select',
			message: 'Configuration datasource type:',
			choices: [
				DatasourceTypes.MySQL, DatasourceTypes.PgSQL, DatasourceTypes.MSSQL, DatasourceTypes.Oracle
			].map((i) => ({title: i, value: i}))
		},
		options.mysqlDataSourceNames != null ? null : {
			name: 'mysqlDataSourceNames',
			type: 'list',
			message: 'More MySQL datasource names, separated by ",":'
		},
		options.pgsqlDataSourceNames != null ? null : {
			name: 'pgsqlDataSourceNames',
			type: 'list',
			message: 'More PostgreSQL datasource names, separated by ",":'
		},
		options.oracleDataSourceNames != null ? null : {
			name: 'oracleDataSourceNames',
			type: 'list',
			message: 'More Oracle datasource names, separated by ",":'
		},
		options.mssqlDataSourceNames != null ? null : {
			name: 'mssqlDataSourceNames',
			type: 'list',
			message: 'More SQL Server datasource names, separated by ",":'
		}
	].filter(x => x != null) as Array<PromptObject>);

	return {...options, ...result} as DatasourceOptions;
};

const computeDatasourceTypes = (options: DatasourceOptions) => {
	const {
		configDataSourceType,
		mysqlDataSourceNames, pgsqlDataSourceNames, oracleDataSourceNames, mssqlDataSourceNames
	} = options;
	const dataSourceTypes = [configDataSourceType];
	([
		[mysqlDataSourceNames, DatasourceTypes.MySQL],
		[pgsqlDataSourceNames, DatasourceTypes.PgSQL],
		[oracleDataSourceNames, DatasourceTypes.Oracle],
		[mssqlDataSourceNames, DatasourceTypes.MSSQL]
	] as Array<[Array<string>, DatasourceTypes]>)
		.map<[Array<string>, DatasourceTypes]>(([names, type]) => {
			return [(names ?? []).filter(name => name != null && name.trim().length !== 0), type];
		}).filter(([names]) => {
		return names.length !== 0;
	}).forEach(([names, type]) => {
		if (names != null && names.length !== 0) {
			dataSourceTypes.push(type);
		}
	});
	return [...new Set(dataSourceTypes)];
};

export const writeDatasourceOptions = (json, options) => {
	const dataSourceTypes = computeDatasourceTypes(options);
	([
		[DatasourceTypes.Oracle, ['oracledb']],
		[DatasourceTypes.PgSQL, ['pg', 'pg-query-stream']],
		[DatasourceTypes.MSSQL, ['mssql']],
		[DatasourceTypes.MySQL, ['mysql2']]
	] as Array<[DatasourceTypes, Array<string>]>)
		.forEach(([type, dependencies]) => {
			if (!dataSourceTypes.includes(type)) {
				dependencies.forEach(dependency => {
					delete json.dependencies[dependency];
				});
			}
		});
	[
		'start:mssql', 'start:pgsql', 'start:oracle',
		'dev:standalone:start:mssql', 'dev:standalone:start:pgsql', 'dev:standalone:start:oracle',
		'scripts:mssql', 'scripts:pgsql', 'scripts:oracle'
	].forEach(key => delete json.scripts[key]);
	Object.keys(json.scripts).forEach(key => {
		if (key.endsWith(':mysql') || key === 'debug:start') {
			const newKey = key.replace(/:mysql$/, '');
			json.scripts[newKey] = json.scripts[key]
				.replace(':mysql', '')
				.replace('envs/dev/.mysql.basic', 'envs/dev/.datasources');
			delete json.scripts[key];
		}
	});
};

const datasourceNameToConfigKey = (name: string) => {
	return name
		.split('.')
		.filter(s => s.trim().length !== 0)
		.map(s => s.toUpperCase())
		.join('_');
};

const createDatasourceProperties = (baseProperties: DatasourceEnvsForType, datasourceName: string): string => {
	return baseProperties.map(line => {
		if (typeof line === 'string') {
			return line.replace('_O23_', `_${datasourceNameToConfigKey(datasourceName)}_`);
		} else {
			const [key, value] = line;
			return `${key.replace('_O23_', `_${datasourceNameToConfigKey(datasourceName)}_`)}=${value}`;
		}
	}).join('\n');
};

const readDatasourceEnvs = (directory: string, configDataSourceType: DatasourceTypes) => {
	const envs: DatasourceEnvs = {};
	Object.values(DatasourceTypes).forEach(type => {
		// read env file
		const content = fs.readFileSync(path.resolve(directory, 'envs', 'dev', `.${type}.basic`)).toString();
		envs[type] = content.split('\n')
			.map(line => {
				if (line === '# configuration database'
					|| line === 'CFG_APP_DATASOURCE_DEFAULT=o23'
					|| line === 'CFG_APP_DATASOURCE_CONFIG=o23') {
					return null;
				}
				if (line.startsWith('#') || line.trim().length === 0) {
					return line;
				} else {
					const [key, value] = line.split('=');
					return [key, value] as [string, string];
				}
			}).filter(line => line != null);
		// remove datasource env file
		fs.rmSync(path.resolve(directory, 'envs', 'dev', `.${type}.basic`));
		// remove scripts
		if (configDataSourceType !== type) {
			fs.rmSync(path.resolve(directory, 'db-scripts', type), {recursive: true, force: true});
		}
	});
	return envs;
};

const buildDatasourceEnvFile = (options: DatasourceOptions, directory: string) => {
	const {
		configDataSourceName, configDataSourceType,
		mysqlDataSourceNames, pgsqlDataSourceNames, oracleDataSourceNames, mssqlDataSourceNames
	} = options;
	const envs = readDatasourceEnvs(directory, configDataSourceType);

	// build a .datasources file
	let content = `# configuration data source, always same as default
CFG_APP_DATASOURCE_DEFAULT=${configDataSourceName}
CFG_APP_DATASOURCE_CONFIG=${configDataSourceName}

`;
	const properties = ([
		[configDataSourceType, [configDataSourceName]],
		[DatasourceTypes.MySQL, Array.isArray(mysqlDataSourceNames) ? mysqlDataSourceNames : [mysqlDataSourceNames]],
		[DatasourceTypes.PgSQL, Array.isArray(pgsqlDataSourceNames) ? pgsqlDataSourceNames : [pgsqlDataSourceNames]],
		[DatasourceTypes.Oracle, Array.isArray(oracleDataSourceNames) ? oracleDataSourceNames : [oracleDataSourceNames]],
		[DatasourceTypes.MSSQL, Array.isArray(mssqlDataSourceNames) ? mssqlDataSourceNames : [mssqlDataSourceNames]]
	] as Array<[DatasourceTypes, Array<string>]>)
		.map<[DatasourceTypes, Array<string>]>(([type, names]) => {
			return [type, (names ?? []).filter(name => name != null && name.trim().length !== 0)];
		}).filter(([, names]) => {
			return names.length !== 0;
		}).map(([type, names]) => {
			// console.log(dataSourceNames);
			return (names)
				.filter(name => name != null && name.trim().length !== 0)
				.map(name => {
					return `# Datasource ${name}
${createDatasourceProperties(envs[type], name)}`;
				}).join('\n');
		}).join('\n');
	content = content + properties;
	fs.writeFileSync(path.resolve(directory, 'envs', 'dev', '.datasources'), content);
};

export const writeDatasourceFiles = (options: DatasourceOptions, pluginOptions: PluginOptions, directory: string) => {
	const {configDataSourceType} = options;
	const {plugins} = pluginOptions;

	buildDatasourceEnvFile(options, directory);
	// remove print scripts
	if (!plugins.includes(Plugins.PRINT)) {
		fs.rmSync(path.resolve(directory, 'db-scripts', configDataSourceType, '0.1.0', '03-print'), {
			recursive: true, force: true
		});
	}
};
