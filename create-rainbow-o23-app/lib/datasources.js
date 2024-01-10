const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');
const {Plugins} = require('./plugins');

let DatasourceTypes = {
	MySQL: 'mysql', MSSQL: 'mssql', PgSQL: 'pgsql', Oracle: 'oracle'
};
exports.DatasourceTypes = DatasourceTypes;

exports.getDatasourceOptions = async () => {
	return prompts([
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

const computeDatasourceTypes = (options) => {
	const {
		configDataSourceType,
		mysqlDataSourceNames, pgsqlDataSourceNames, oracleDataSourceNames, mssqlDataSourceNames
	} = options;
	const dataSourceTypes = [configDataSourceType];
	[
		[mysqlDataSourceNames, DatasourceTypes.MySQL],
		[pgsqlDataSourceNames, DatasourceTypes.PgSQL],
		[oracleDataSourceNames, DatasourceTypes.Oracle],
		[mssqlDataSourceNames, DatasourceTypes.MSSQL]
	].map(([names, type]) => {
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

exports.writeDatasourceOptions = (json, options) => {
	const dataSourceTypes = computeDatasourceTypes(options);
	([
		[DatasourceTypes.Oracle, ['oracledb']],
		[DatasourceTypes.PgSQL, ['pg', 'pg-query-stream']],
		[DatasourceTypes.MSSQL, ['mssql']],
		[DatasourceTypes.MySQL, ['mysql2']]
	]).forEach(([type, dependencies]) => {
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
			json.scripts[newKey] = json.scripts[key]
				.replace(':mysql', '')
				.replace('envs/dev/.mysql.basic', 'envs/dev/.datasources');
			delete json.scripts[key];
		}
	});
};

const datasourceNameToConfigKey = (name) => {
	return name
		.split('.')
		.filter(s => s.trim().length !== 0)
		.map(s => s.toUpperCase())
		.join('_');
};

const createDatasourceProperties = (baseProperties, datasourceName) => {
	return baseProperties.map(line => {
		if (typeof line === 'string') {
			return line.replace('_O23_', `_${datasourceNameToConfigKey(datasourceName)}_`);
		} else {
			const [key, value] = line;
			return `${key.replace('_O23_', `_${datasourceNameToConfigKey(datasourceName)}_`)}=${value}`;
		}
	}).join('\n');
};

const readDatasourceEnvs = (directory, configDataSourceType) => {
	const envs = {};
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
					return [key, value];
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

const buildDatasourceEnvFile = (options, directory) => {
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
		[DatasourceTypes.MSSQL, Array.isArray(mssqlDataSourceNames) ? mssqlDataSourceNames : [mssqlDataSourceNames]]
	].map(([type, names]) => {
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

exports.writeDatasourceFiles = (options, pluginOptions, directory) => {
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
