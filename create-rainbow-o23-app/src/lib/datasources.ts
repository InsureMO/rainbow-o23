import prompts from 'prompts';
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
			validate: (value: Array<string>) => value.length > 0 ? true : 'Please select at least one datasource type.'
		},
		{
			name: 'configDataSourceName',
			type: 'text',
			message: 'Configuration datasource name:',
			initial: 'o23'
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
};