const chalk = require('chalk');
const {execSync} = require('child_process');
const prompts = require('prompts');

let PackageManager = {
	NPM: 'npm', PNPM: 'pnpm', YARN: 'yarn'
};

exports.PackageManager = PackageManager;

const checkNodeVersion = () => {
	const version = process.versions.node;
	const [major, minor] = version.split('.').map(Number);
	if (major < 18 || (major === 18 && minor < 19)) {
		console.error(chalk.red(`✖ Node version must >= 18.19.0, current is ${version}, please upgrade your Node.js.`));
		process.exit(1);
	}
};

const checkNpmVersion = () => {
	const version = execSync('npm -v').toString().trim();
	const [major, minor] = version.split('.').map(Number);
	if (major < 10 || (major === 10 && minor < 2)) {
		console.error(chalk.red(`✖ Npm version must >= 10.2.0, current is ${version} please upgrade your npm.`));
		process.exit(1);
	}
};

exports.checkVersions = () => {
	checkNodeVersion();
	checkNpmVersion();
};

exports.getPackageManagerOption = async () => {
	return prompts([
		{
			name: 'packageManager',
			type: 'select',
			choices: [PackageManager.YARN, PackageManager.NPM, PackageManager.PNPM].map((i) => ({title: i, value: i})),
			message: 'Please choose a package manager:'
		}
	]);
};

exports.checkYarnVersion = () => {
	const version = execSync('yarn -v').toString().trim();
	const [major, minor, patch] = version.split('.').map(Number);
	if (major < 1 || (major === 1 && minor < 22) || (major === 1 && minor === 22 && patch < 10)) {
		console.error(chalk.red(`✖ Yarn version must >= 1.22.10, current is ${version} please upgrade your yarn.`));
		process.exit(1);
	}
};

exports.install = async (manager, directory) => {
	const {should} = await prompts([
		{
			name: 'should',
			type: 'toggle',
			message: 'Do you want to install all the dependencies directly?',
			initial: false,
			active: 'yes',
			inactive: 'no'
		}
	]);
	if (should) {
		const cmd = manager === 'yarn' ? 'yarn' : manager + ' i';
		execSync(cmd, {stdio: 'inherit', cwd: directory});
	}
};
