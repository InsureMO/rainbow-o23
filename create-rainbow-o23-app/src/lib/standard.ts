import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import prompts from 'prompts';
import validate from 'validate-npm-package-name';
import {PackageJSON} from './types';

const printValidationResults = (results: Array<string>) => {
	if (typeof results !== 'undefined') {
		results.forEach((error) => console.error(chalk.red(`  - ${error}`)));
	}
};
export const validateName = (name: string) => {
	if (name == null || name.trim().length === 0) {
		console.error(chalk.red('✖ Could not create a project with empty or blank name.'));
		process.exit(1);
	} else {
		const validationResult = validate(name);

		if (validationResult.validForNewPackages === false) {
			console.error(chalk.red(`✖ Could not create a project called ${chalk.red.underline(`"${name}"`)} because of npm naming restrictions:`));
			printValidationResults(validationResult.errors);
			printValidationResults(validationResult.warnings);

			process.exit(1);
		}
	}
};

const getPackageDirectory = (packageName: string) => {
	return path.resolve(packageName.startsWith('@') ? packageName.split('/')[1] : packageName);
};

const isDirectoryEmpty = (directory: string) => {
	const files = fs.readdirSync(directory);
	return files == null || files.length === 0;
};

export const createPackageDirectory = (packageName: string): string => {
	const dir = getPackageDirectory(packageName);
	if (fs.existsSync(dir)) {
		if (!isDirectoryEmpty(dir)) {
			const relativeDir = path.relative(process.cwd(), dir);
			console.error(chalk.red(`✖ The directory "${relativeDir}" already exists and is not empty, so it is unable to create the application.`));
			process.exit(1);
		}
	} else {
		fs.mkdirpSync(dir);
		fs.mkdirpSync(path.resolve(dir, 'src'));
	}
	return dir;
};

export const getStandardOption = async (packageName: string) => {
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

export const createPackageJson = (
	options: Awaited<ReturnType<typeof getStandardOption>>,
	directory: string
): PackageJSON => {
	const {name, description} = options;
	fs.copySync(path.resolve(path.dirname(''), './templates'), directory);

	// create README.md
	fs.writeFileSync(path.resolve(directory, 'README.md'), `# ${name}\n\n${description}\n`);
	const packageFile = path.resolve(directory, 'package.json');
	// parse and modify package.json
	const json = JSON.parse(fs.readFileSync(packageFile).toString()) as PackageJSON;
	json.name = name;
	json.version = '0.1.0';
	json.description = description;
	delete json.jest;
	return json;
};