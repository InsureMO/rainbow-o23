const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const {getDatasourceOptions, writeDatasourceFiles, writeDatasourceOptions} = require('./datasources');
const {
	checkVersions,
	checkYarnVersion,
	getPackageManagerOption,
	PackageManager,
	install
} = require('./package-manager');
const {getPluginOptions, writePluginFiles, writePluginOptions} = require('./plugins');
const {createPackageDirectory, createPackageJson, getStandardOption, validateName} = require('./standard');

const generatePackageJson = async (stdOptions, datasourceOptions, pluginOptions, directory) => {
	const json = createPackageJson(stdOptions, directory);
	writeDatasourceOptions(json, datasourceOptions);
	writePluginOptions(json, pluginOptions);
	const packageFile = path.resolve(directory, 'package.json');
	fs.writeFileSync(packageFile, JSON.stringify(json, null, 2) + '\n');
};

const generateFiles = async (datasourceOptions, pluginOptions, directory) => {
	writeDatasourceFiles(datasourceOptions, pluginOptions, directory);
	writePluginFiles(pluginOptions, directory);
};

exports.createApp = async () => {
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
	await generateFiles(dataSourceOptions, pluginOptions, directory);
	// install dependencies
	await install(packageManager, directory);

	console.log();
	console.log(`${chalk.green('✔')} Success! Created ${chalk.cyan.underline(packageName)}.`);
	console.log(`${chalk.green('✔')} Check /envs/dev/.datasources to setup datasources.`);
	console.log();
	process.exit(0);
};
