const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');
const validate = require('validate-npm-package-name');

const printValidationResults = (results) => {
	if (typeof results !== 'undefined') {
		results.forEach((error) => console.error(chalk.red(`  - ${error}`)));
	}
};
exports.validateName = (name) => {
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

const getPackageDirectory = (packageName) => {
	return path.resolve(packageName.startsWith('@') ? packageName.split('/')[1] : packageName);
};

const isDirectoryEmpty = (directory) => {
	const files = fs.readdirSync(directory);
	return files == null || files.length === 0;
};

exports.createPackageDirectory = (packageName) => {
	const dir = getPackageDirectory(packageName);
	if (fs.existsSync(dir)) {
		if (!isDirectoryEmpty(dir)) {
			const relativeDir = path.relative(process.cwd(), dir);
			console.error(chalk.red(`✖ The directory "${relativeDir}" already exists and is not empty, so it is unable to create the application.`));
			process.exit(1);
		}
	} else {
		// noinspection JSCheckFunctionSignatures
		fs.mkdirpSync(dir);
		// noinspection JSCheckFunctionSignatures
		fs.mkdirpSync(path.resolve(dir, 'src'));
	}
	return dir;
};

exports.getStandardOption = async (packageName) => {
	return prompts([
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

exports.createPackageJson = (options, directory) => {
	const {name, description} = options;
	fs.copySync(path.resolve(__dirname, '../templates'), directory);

	// create README.md
	fs.writeFileSync(path.resolve(directory, 'README.md'), `# ${name}\n\n${description}\n`);
	const packageFile = path.resolve(directory, 'package.json');
	// parse and modify package.json
	const json = JSON.parse(fs.readFileSync(packageFile).toString())
	json.name = name;
	json.version = '0.1.0';
	json.description = description;
	json.license = 'UNLICENSED';
	delete json.jest;
	// noinspection JSUnresolvedReference
	delete json.repository;
	// noinspection JSUnresolvedReference
	delete json.bugs;
	delete json.author;
	return json;
};
