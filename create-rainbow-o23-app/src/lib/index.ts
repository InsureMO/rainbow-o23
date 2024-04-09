import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import {DatasourceOptions, getDatasourceOptions, writeDatasourceFiles, writeDatasourceOptions} from './datasources';
import {help} from './help';
import {checkVersions, checkYarnVersion, getPackageManagerOption, install} from './package-manager';
import {getPluginOptions, PluginOptions, writePluginFiles, writePluginOptions} from './plugins';
import {createPackageDirectory, createPackageJson, getStandardOption, StdOptions, validateName} from './standard';
import {PackageManager} from './types';

const generatePackageJson = async (stdOptions: StdOptions, datasourceOptions: DatasourceOptions, pluginOptions: PluginOptions, directory: string) => {
	const json = createPackageJson(stdOptions, directory);
	writeDatasourceOptions(json, datasourceOptions);
	writePluginOptions(json, pluginOptions);
	const packageFile = path.resolve(directory, 'package.json');
	fs.writeFileSync(packageFile, JSON.stringify(json, null, 2) + '\n');
};

const generateReadme = async (packageName: string, directory: string) => {
	const readmeFile = path.resolve(directory, 'README.md');
	let content = fs.readFileSync(readmeFile).toString();
	content = content.replace(/o23\/n99/, packageName);
	fs.writeFileSync(readmeFile, content);
};

const generateFiles = async (datasourceOptions: DatasourceOptions, pluginOptions: PluginOptions, directory: string) => {
	writeDatasourceFiles(datasourceOptions, pluginOptions, directory);
	writePluginFiles(pluginOptions, directory);
	fs.mkdirSync(path.resolve(directory, 'scripts'));
	fs.mkdirSync(path.resolve(directory, 'server'));
};

const create = async () => {
	const packageName = process.argv[2];
	validateName(packageName);
	checkVersions();
	const {packageManager} = await getPackageManagerOption();
	if (packageManager === PackageManager.YARN) {
		checkYarnVersion();
	}

	const directory = createPackageDirectory(packageName);
	const stdOptions = await getStandardOption(packageName);
	const dataSourceOptions = await getDatasourceOptions();
	const pluginOptions = await getPluginOptions();
	await generatePackageJson(stdOptions, dataSourceOptions, pluginOptions, directory);
	await generateReadme(packageName, directory);
	await generateFiles(dataSourceOptions, pluginOptions, directory);
	// await cleanPluginSrcFolder(directory);
	// install dependencies
	await install(packageManager, directory);

	console.log();
	console.log(`${chalk.green('✔')} Success! Created ${chalk.cyan.underline(packageName)}.`);
	console.log(`${chalk.green('✔')} Check /envs/dev/.datasources to setup datasources.`);
	console.log();
};

export const createApp = async () => {
	if (process.argv.includes('--help')) {
		help();
	} else {
		await create();
	}

	process.exit(0);
};