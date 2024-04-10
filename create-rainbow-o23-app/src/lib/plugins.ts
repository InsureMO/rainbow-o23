import fs from 'fs-extra';
import path from 'path';
import prompts from 'prompts';
import {PackageJson, Plugins} from './types';

export interface PluginOptions {
	plugins: Array<Plugins>;
}

const findPlugins = (): Array<Plugins> | undefined => {
	const args = process.argv.slice(3);

	if (args.includes('--plugin-free')) {
		return [];
	} else if (args.includes('--plugin-all-packed')) {
		return Object.values(Plugins);
	}

	const plugins: Array<Plugins> = [];
	args.forEach(arg => {
		switch (arg) {
			case '--plugin-print':
				plugins.push(Plugins.PRINT);
				break;
			case '--plugin-aws-s3':
				plugins.push(Plugins.AWS_S3);
				break;
			default:
				break;
		}
	});
	return plugins.length === 0 ? (void 0) : plugins;
};

export const getPluginOptions = async (): Promise<PluginOptions> => {
	const plugins = findPlugins();
	if (plugins != null) {
		return {plugins};
	} else {
		return prompts([
			{
				name: 'plugins',
				type: 'multiselect',
				message: 'Plugins:',
				choices: [
					Plugins.PRINT,
					Plugins.AWS_S3
				].map((i) => ({title: i, value: i}))
			}
		]);
	}
};

export const writePluginOptions = (json: PackageJson, options: PluginOptions) => {
	const {plugins} = options;
	if (!plugins.includes(Plugins.PRINT)) {
		delete json.dependencies['@rainbow-o23/n91'];
		Object.keys(json.scripts).forEach((key) => {
			json.scripts[key] = json.scripts[key].replace(',envs/common/.print', '');
		});
	}
	if (!plugins.includes(Plugins.AWS_S3)) {
		delete json.dependencies['@rainbow-o23/n92'];
	}
};

export const writePluginFiles = (options: PluginOptions, directory: string) => {
	const {plugins} = options;
	const pluginIndexTsFile = path.resolve(directory, 'src', 'plugins', 'index.ts');
	let content = fs.readFileSync(pluginIndexTsFile).toString();
	if (!plugins.includes(Plugins.PRINT)) {
		fs.rmSync(path.resolve(directory, 'envs', 'common', '.print'));
		fs.rmSync(path.resolve(directory, 'server', '03-print'), {recursive: true, force: true});
		fs.rmSync(path.resolve(directory, 'src', 'plugins', 'print.ts'));
		fs.rmSync(path.resolve(directory, '.puppeteerrc'));
		// remove print part
		content = content.replace('import {usePdfSubTemplates} from \'./print\';\n', '')
			.replace('\tusePdfSubTemplates(options);\n', '');
	}
	if (!plugins.includes(Plugins.AWS_S3)) {
		fs.rmSync(path.resolve(directory, 'src', 'plugins', 'aws.ts'));
		// remove aws s3 part
		content = content.replace('import \'./aws\';\n', '');
	}
	fs.writeFileSync(pluginIndexTsFile, content);
};
