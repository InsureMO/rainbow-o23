import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import prompts from 'prompts';
import {createPackageDirectory, validateName} from './name';
import {checkVersions, checkYarnVersion, PackageManager} from './package-manager';

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
		}
	]);
};

const generate = async (options: Awaited<ReturnType<typeof getModuleOption>>, directory: string) => {
	const {name, description} = options;
	// fs.copySync(path.resolve(__dirname, './template/common'), dir);
	// fs.copySync(path.resolve(__dirname, './template/js'), dir);

	// create README.md
	fs.writeFileSync(path.resolve(directory, 'README.md'), `# ${name}\n\n${description}\n`);
	const packageFile = path.resolve(directory, 'node_modules', '@rainbow-o23/n99', 'package.json');
	// parse and modify package.json
	const json = fs.readFileSync(packageFile).toJSON() as unknown as PackageJSON;
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
	// install template
	// installTemplate(packageManager, directory);

	// await generate(options, directory);
	// install dependencies
	// install(options.packageManager, directory);

	console.log();
	console.log(`${chalk.green('✔')} Success! Created ${chalk.cyan.underline(packageName)}.`);
	console.log();
	process.exit(0);
};
