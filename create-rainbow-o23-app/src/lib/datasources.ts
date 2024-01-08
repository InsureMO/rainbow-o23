import fs from 'fs-extra';
import path from 'path';
import prompts from 'prompts';
import {getPluginOptions, Plugins} from './plugins';
import {PackageJSON} from './types';

export enum DatasourceTypes {
	MySQL = 'mysql', MSSQL = 'mssql', PgSQL = 'pgsql', Oracle = 'oracle'
}

export type EnvProperty = [string, string];
export type EnvLine = string | EnvProperty;
export type EnvFile = Array<EnvLine>;

export const getDatasourceOptions = async () => {
	return await prompts([
		{
			name: 'configDataSourceName',
			type: 'text',
			message: 'Configuration datasource name:',
			initial: 'o23'
		},
		{
			name: 'configDataSourceType',
			type: 'select',
			message: 'Configuration datasource type:',
			choices: [
				DatasourceTypes.MySQL, DatasourceTypes.PgSQL, DatasourceTypes.MSSQL, DatasourceTypes.Oracle
			].map((i) => ({title: i, value: i}))
		},
		{
			name: 'mysqlDataSourceNames',
			type: 'list',
			message: 'More MySQL datasource names, separated by ",":'
		},
		{
			name: 'pgsqlDataSourceNames',
			type: 'list',
			message: 'More PostgreSQL datasource names, separated by ",":'
		},
		{
			name: 'oracleDataSourceNames',
			type: 'list',
			message: 'More Oracle datasource names, separated by ",":'
		},
		{
			name: 'mssqlDataSourceNames',
			type: 'list',
			message: 'More SQL Server datasource names, separated by ",":'
		}
	]);
};

const computeDatasourceTypes = (options: Awaited<ReturnType<typeof getDatasourceOptions>>): Array<DatasourceTypes> => {
	const {
		configDataSourceType,
		mysqlDataSourceNames, pgsqlDataSourceNames, oracleDataSourceNames, mssqlDataSourceNames
	} = options;
	const dataSourceTypes: Array<DatasourceTypes> = [configDataSourceType];
	[
		[mysqlDataSourceNames, DatasourceTypes.MySQL],
		[pgsqlDataSourceNames, DatasourceTypes.PgSQL],
		[oracleDataSourceNames, DatasourceTypes.Oracle],
		[mssqlDataSourceNames, DatasourceTypes.MSSQL]
	].forEach(([names, type]) => {
		if (names != null && names.length !== 0) {
			dataSourceTypes.push(type);
		}
	});
	return [...new Set(dataSourceTypes)];
};

export const writeDatasourceOptions = (json: PackageJSON, options: Awaited<ReturnType<typeof getDatasourceOptions>>) => {
	const dataSourceTypes = computeDatasourceTypes(options);
	([
		[DatasourceTypes.Oracle, ['oracledb']],
		[DatasourceTypes.PgSQL, ['pg', 'pg-query-stream']],
		[DatasourceTypes.MSSQL, ['mssql']],
		[DatasourceTypes.MySQL, ['mysql2']]
	] as Array<[DatasourceTypes, Array<string>]>).forEach(([type, dependencies]) => {
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
		if (key.endsWith(':mysql')) {
			const newKey = key.replace(/:mysql$/, '');
			json.scripts[newKey] = json.scripts[key].replace('envs/dev/.mysql.basic', 'envs/dev/.datasources');
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

const createDatasourceProperties = (baseProperties: EnvFile, datasourceName: string) => {
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
	const envs: Partial<Record<DatasourceTypes, EnvFile>> = {};
	Object.values(DatasourceTypes).forEach(type => {
		// read env file
		const content = fs.readFileSync(path.resolve(directory, 'envs', 'dev', `.${type}.basic`)).toString();
		const file = content.split('\n')
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
					return [key, value];
				}
			}).filter(line => line != null);
		envs[type as DatasourceTypes] = file as EnvFile;
		// remove datasource env file
		fs.rmSync(path.resolve(directory, 'envs', 'dev', `.${type}.basic`));
		// remove scripts
		if (configDataSourceType !== type) {
			fs.rmSync(path.resolve(directory, 'db-scripts', type), {recursive: true, force: true});
		}
	});
	return envs;
};

const buildDatasourceEnvFile = (options: Awaited<ReturnType<typeof getDatasourceOptions>>, directory: string) => {
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
	const properties = [
		[configDataSourceType, [configDataSourceName]],
		[DatasourceTypes.MySQL, Array.isArray(mysqlDataSourceNames) ? mysqlDataSourceNames : [mysqlDataSourceNames]],
		[DatasourceTypes.PgSQL, Array.isArray(pgsqlDataSourceNames) ? pgsqlDataSourceNames : [pgsqlDataSourceNames]],
		[DatasourceTypes.Oracle, Array.isArray(oracleDataSourceNames) ? oracleDataSourceNames : [oracleDataSourceNames]],
		[DatasourceTypes.MySQL, Array.isArray(mssqlDataSourceNames) ? mssqlDataSourceNames : [mssqlDataSourceNames]]
	].map(([dataSourceType, dataSourceNames]) => {
		return [dataSourceType, (dataSourceNames ?? []).filter(name => name != null && name.trim().length !== 0)];
	}).filter(([, dataSourceNames]) => {
		return dataSourceNames.length !== 0;
	}).map(([dataSourceType, dataSourceNames]) => {
		// console.log(dataSourceNames);
		return (dataSourceNames as Array<string>)
			.filter(name => name != null && name.trim().length !== 0)
			.map(dataSourceName => {
				return `# Datasource ${dataSourceName}
${createDatasourceProperties(envs[dataSourceType as DatasourceTypes], dataSourceName)}`;
			}).join('\n');
	}).join('\n');
	content = content + properties;
	fs.writeFileSync(path.resolve(directory, 'envs', 'dev', '.datasources'), content);
};

export const writeDatasourceFiles = (
	options: Awaited<ReturnType<typeof getDatasourceOptions>>,
	pluginOptions: Awaited<ReturnType<typeof getPluginOptions>>,
	directory: string) => {
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
