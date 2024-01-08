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
			].map((i) => ({title: i, value: i})),
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
		}
	]);
};

export const writeDatasourceOptions = (json: PackageJSON, options: Awaited<ReturnType<typeof getDatasourceOptions>>) => {
	const {dataSourceTypes} = options;
	if (!dataSourceTypes.includes(DatasourceTypes.Oracle)) {
		delete json.dependencies['oracledb'];
	}
	if (!dataSourceTypes.includes(DatasourceTypes.PgSQL)) {
		delete json.dependencies['pg'];
		delete json.dependencies['pg-query-stream'];
	}
	if (!dataSourceTypes.includes(DatasourceTypes.MSSQL)) {
		delete json.dependencies['mssql'];
	}
	if (!dataSourceTypes.includes(DatasourceTypes.MySQL)) {
		delete json.dependencies['mysql2'];
	}
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

	if (!dataSourceTypes.includes(DatasourceTypes.Oracle)) {
		fs.rmSync(path.resolve(directory, 'envs', 'dev', '.oracle.basic'));
	}
	if (!dataSourceTypes.includes(DatasourceTypes.PgSQL)) {
		fs.rmSync(path.resolve(directory, 'envs', 'dev', '.pgsql.basic'));
	}
	if (!dataSourceTypes.includes(DatasourceTypes.MSSQL)) {
		fs.rmSync(path.resolve(directory, 'envs', 'dev', '.mssql.basic'));
	}
	if (!dataSourceTypes.includes(DatasourceTypes.MySQL)) {
		fs.rmSync(path.resolve(directory, 'envs', 'dev', '.mysql.basic'));
	}

	// remove scripts
	if (configDataSourceType !== DatasourceTypes.Oracle) {
		fs.rmSync(path.resolve(directory, 'db-scripts', 'oracle'), {recursive: true, force: true});
	}
	if (configDataSourceType !== DatasourceTypes.PgSQL) {
		fs.rmSync(path.resolve(directory, 'db-scripts', 'pgsql'), {recursive: true, force: true});
	}
	if (configDataSourceType !== DatasourceTypes.MSSQL) {
		fs.rmSync(path.resolve(directory, 'db-scripts', 'mssql'), {recursive: true, force: true});
	}
	if (configDataSourceType !== DatasourceTypes.MySQL) {
		fs.rmSync(path.resolve(directory, 'db-scripts', 'mysql'), {recursive: true, force: true});
	}
	if (!plugins.includes(Plugins.PRINT)) {
		fs.rmSync(path.resolve(directory, 'db-scripts', configDataSourceType, '0.1.0', '03-print'), {
			recursive: true, force: true
		});
	}
};
