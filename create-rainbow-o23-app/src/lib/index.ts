import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import prompts from 'prompts';
import {createPackageDirectory, validateName} from './name';
import {install} from './package-manager';

interface PackageJSON {
	name: string;
	description: string;
}

const getOption = async (packageName: string) => {
	return await prompts([
		{
			name: 'name',
			type: 'text',
			message: '项目名称',
			initial: packageName
		},
		{
			name: 'packageManager',
			type: 'select',
			choices: ['pnpm', 'yarn', 'npm'].map((i) => ({title: i, value: i})),
			message: '请选择要使用的包管理工具'
		}
	]);
};

const generate = async (options: Awaited<ReturnType<typeof getOption>>, directory: string) => {
	const {name} = options;
	// fs.copySync(path.resolve(__dirname, './template/common'), dir);
	// fs.copySync(path.resolve(__dirname, './template/js'), dir);

	const description = 'An application created based on Rainbow-O23, powered by InsureMO.';
	// create README.md
	fs.writeFileSync(path.resolve(directory, 'README.md'), `# ${name}\n\n${description}\n`);
	const packageFile = path.resolve(directory, 'package.json');
	// parse and modify package.json
	// @ts-ignore
	const json: PackageJSON = fs.readFileSync(pkgPath).toJSON();
	json.name = name;
	json.description = description;
	fs.writeFileSync(packageFile, JSON.stringify(json, null, 2) + '\n');
};

export const createApp = async () => {
	const packageName = process.argv[2];
	validateName(packageName);
	const directory = createPackageDirectory(packageName);

	const options = await getOption(packageName);
	await generate(options, directory);
	// install dependencies
	install(options.packageManager, directory);

	console.log();
	console.log(`${chalk.green('✔')} Success! Created ${chalk.cyan.underline(packageName)}.`);
	console.log();
};
