import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import {getDatasourceOptions, writeDatasourceOptions} from './datasources';
import {checkVersions, checkYarnVersion, getPackageManagerOption, PackageManager} from './package-manager';
import {getPluginOptions, writePluginOptions} from './plugins';
import {createPackageDirectory, createPackageJson, getStandardOption, validateName} from './standard';

const generatePackageJson = async (
	stdOptions: Awaited<ReturnType<typeof getStandardOption>>,
	datasourceOptions: Awaited<ReturnType<typeof getDatasourceOptions>>,
	pluginOptions: Awaited<ReturnType<typeof getPluginOptions>>,
	directory: string
) => {
	const json = createPackageJson(stdOptions, directory);
	writeDatasourceOptions(json, datasourceOptions);
	writePluginOptions(json, pluginOptions);
	const packageFile = path.resolve(directory, 'package.json');
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
	const stdOptions = await getStandardOption(packageName);
	const dataSourceOptions = await getDatasourceOptions();
	const pluginOptions = await getPluginOptions();
	await generatePackageJson(stdOptions, dataSourceOptions, pluginOptions, directory);
	// install dependencies
	// install(options.packageManager, directory);

	console.log();
	console.log(`${chalk.green('✔')} Success! Created ${chalk.cyan.underline(packageName)}.`);
	console.log();
	process.exit(0);
};
