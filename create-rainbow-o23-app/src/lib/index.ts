import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import prompts from 'prompts';
import {DatasourceTypes} from './datasources';
import {createPackageDirectory, validateName} from './name';
import {checkVersions, checkYarnVersion, installTemplate, PackageManager} from './package-manager';
import {Plugins} from './plugins';

interface PackageJSON {
	name: string;
	description: string;
}

const getPackageManagerOption = async () => {
	return await prompts([
		{
			name: 'packageManager',
			type: 'select',
			choices: [PackageManager.YARN, PackageManager.NPM, PackageManager.PNPM].map((i) => ({title: i, value: i})),
			message: 'Please choose a package manager:'
		}
	]);
};

const getModuleOption = async (packageName: string) => {
	return await prompts([
		{
			name: 'name',
			type: 'text',
			message: 'Package name:',
			initial: packageName
		},
		{
			name: 'description',
			type: 'text',
			message: 'Package description:',
			initial: 'An application created based on Rainbow-O23, powered by InsureMO.'
		},
		{
			name: 'dataSourceTypes',
			type: 'multiselect',
			message: 'Datasource types:',
			choices: [
				DatasourceTypes.MySQL, DatasourceTypes.PgSQL, DatasourceTypes.MSSQL, DatasourceTypes.Oracle
			].map((i) => ({title: i, value: i}))
		},
		{
			name: 'configDataSourceName',
			type: 'text',
			message: 'Configuration datasource name:',
			initial: 'o23'
		},
		{
			name: 'plugins',
			type: 'multiselect',
			message: 'Plugins:',
			choices: [
				Plugins.PRINT
			].map((i) => ({title: i, value: i}))
		}
	]);
};

const generate = async (options: Awaited<ReturnType<typeof getModuleOption>>, directory: string) => {
	const {name, description} = options;
	fs.copySync(path.resolve(path.dirname(''), './templates'), directory);

	// create README.md
	fs.writeFileSync(path.resolve(directory, 'README.md'), `# ${name}\n\n${description}\n`);
	const packageFile = path.resolve(directory, 'package.json');
	// parse and modify package.json
	const json = JSON.parse(fs.readFileSync(packageFile).toString()) as PackageJSON;
	json.name = name;
	json.description = description;
	fs.writeFileSync(packageFile, JSON.stringify(json, null, 2) + '\n');
};

export const createApp = async () => {
	const packageName = process.argv[2];
	validateName(packageName);
	checkVersions();
	const {packageManager} = await getPackageManagerOption();
	if (packageManager === PackageManager.YARN) {
		checkYarnVersion();
	}

	const directory = createPackageDirectory(packageName);
	const options = await getModuleOption(packageName);

	await generate(options, directory);
	// install template
	installTemplate(packageManager, directory);
	// install dependencies
	// install(options.packageManager, directory);

	console.log();
	console.log(`${chalk.green('✔')} Success! Created ${chalk.cyan.underline(packageName)}.`);
	console.log();
	process.exit(0);
};
