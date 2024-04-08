import chalk from 'chalk';
import {execSync} from 'child_process';
import prompts from 'prompts';
import {PackageManager} from './types';

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

export const checkVersions = () => {
	checkNodeVersion();
	checkNpmVersion();
};

export const getPackageManagerOption = async () => {
	return prompts([
		{
			name: 'packageManager',
			type: 'select',
			choices: [PackageManager.YARN, PackageManager.NPM, PackageManager.PNPM].map((i) => ({title: i, value: i})),
			message: 'Please choose a package manager:'
		}
	]);
};

export const checkYarnVersion = () => {
	const version = execSync('yarn -v').toString().trim();
	const [major, minor, patch] = version.split('.').map(Number);
	if (major < 1 || (major === 1 && minor < 22) || (major === 1 && minor === 22 && patch < 10)) {
		console.error(chalk.red(`✖ Yarn version must >= 1.22.10, current is ${version} please upgrade your yarn.`));
		process.exit(1);
	}
};

export const install = async (manager: PackageManager, directory: string) => {
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
