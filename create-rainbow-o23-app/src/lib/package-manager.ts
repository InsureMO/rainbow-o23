import chalk from 'chalk';
import {execSync} from 'child_process';

export enum PackageManager {
	NPM = 'npm', PNPM = 'pnpm', YARN = 'yarn'
}

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

export const checkYarnVersion = () => {
	const version = execSync('yarn -v').toString().trim();
	const [major, minor, patch] = version.split('.').map(Number);
	if (major < 1 || (major === 1 && minor < 22) || (major === 1 && minor === 22 && patch < 10)) {
		console.error(chalk.red(`✖ Yarn version must >= 1.22.10, current is ${version} please upgrade your yarn.`));
		process.exit(1);
	}
};

export const installTemplate = (manager: PackageManager, directory: string): void => {
	console.log(directory);
	// execSync(`${manager} add @rainbow-o23/n99@latest -D`, {stdio: 'inherit', cwd: directory});
};

export const install = (manager: PackageManager, directory: string): void => {
	const cmd = manager === 'yarn' ? 'yarn' : manager + ' i';
	execSync(cmd, {stdio: 'inherit', cwd: directory});
};
