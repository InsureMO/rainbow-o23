import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import prompts from 'prompts';
import {getPluginOptions, Plugins} from './plugins';
import {PackageJSON} from './types';

export enum DatasourceTypes {
	MySQL = 'mysql', MSSQL = 'mssql', PgSQL = 'pgsql', Oracle = 'oracle'
}

export const getDatasourceOptions = async () => {
	return await prompts([
		{
			name: 'dataSourceTypes',
			type: 'multiselect',
			message: 'Datasource types:',
			choices: [
				DatasourceTypes.MySQL, DatasourceTypes.PgSQL, DatasourceTypes.MSSQL, DatasourceTypes.Oracle
			].map((i) => {
				return {title: i, value: i, selected: i === DatasourceTypes.MySQL};
			}),
			min: 1
		},
		{
			name: 'configDataSourceName',
			type: 'text',
			message: 'Configuration datasource name:',
			initial: 'o23'
		}
	]);
};

export const getDatasourceOptions2 = async (options: Awaited<ReturnType<typeof getDatasourceOptions>>) => {
	const {dataSourceTypes} = options;
	if (dataSourceTypes == null || dataSourceTypes.length === 0) {
		console.error(chalk.red('✖ Please select at least one data source type.'));
		process.exit(1);
		return;
	}
	if (dataSourceTypes.length === 1) {
		return {configDataSourceType: dataSourceTypes[0]};
	}

	return await prompts([
		{
			name: 'configDataSourceType',
			type: 'select',
			message: 'Configuration datasource type:',
			choices: [
				DatasourceTypes.MySQL, DatasourceTypes.PgSQL, DatasourceTypes.MSSQL, DatasourceTypes.Oracle
			].filter(i => dataSourceTypes.includes(i))
				.map((i) => ({title: i, value: i}))
		},
		{
			name: 'mysqlDataSourceNames',
			type: dataSourceTypes.includes(DatasourceTypes.MySQL) ? 'list' : null,
			message: 'MySQL datasource names, separated by ",":',
			initial: ''
		},
		{
			name: 'pgsqlDataSourceNames',
			type: dataSourceTypes.includes(DatasourceTypes.PgSQL) ? 'list' : null,
			message: 'PostgreSQL datasource names, separated by ",":',
			initial: ''
		},
		{
			name: 'oracleDataSourceNames',
			type: dataSourceTypes.includes(DatasourceTypes.Oracle) ? 'list' : null,
			message: 'Oracle datasource names, separated by ",":',
			initial: ''
		},
		{
			name: 'mssqlDataSourceNames',
			type: dataSourceTypes.includes(DatasourceTypes.MSSQL) ? 'list' : null,
			message: 'SQL Server datasource names, separated by ",":',
			initial: ''
		}
	]);
};

export const writeDatasourceOptions = (json: PackageJSON, options: Awaited<ReturnType<typeof getDatasourceOptions>>) => {
	const {dataSourceTypes} = options;
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

export const writeDatasourceFiles = (
	options: Awaited<ReturnType<typeof getDatasourceOptions>>,
	options2: Awaited<ReturnType<typeof getDatasourceOptions2>>,
	pluginOptions: Awaited<ReturnType<typeof getPluginOptions>>,
	directory: string) => {
	const {dataSourceTypes, configDataSourceName} = options;
	const {configDataSourceType} = options2;
	const {plugins} = pluginOptions;

	Object.values(DatasourceTypes).forEach(type => {
		// remove env file
		if (!dataSourceTypes.includes(type)) {
			fs.rmSync(path.resolve(directory, 'envs', 'dev', `.${type}.basic`));
		}
		// remove scripts
		if (configDataSourceType !== type) {
			fs.rmSync(path.resolve(directory, 'db-scripts', type), {recursive: true, force: true});
		}
	});
	// TODO READ THE remained envs and build a .datasources file

	// remove print scripts
	if (!plugins.includes(Plugins.PRINT)) {
		fs.rmSync(path.resolve(directory, 'db-scripts', configDataSourceType, '0.1.0', '03-print'), {
			recursive: true, force: true
		});
	}
};
