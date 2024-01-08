import fs from 'fs-extra';
import path from 'path';
import prompts from 'prompts';
import {PackageJSON} from './types';

export enum Plugins {
	PRINT = 'print'
}

export const getPluginOptions = async () => {
	return await prompts([
		{
			name: 'plugins',
			type: 'multiselect',
			message: 'Plugins:',
			choices: [
				Plugins.PRINT
			].map((i) => ({title: i, value: i}))
		}
	]);
};

export const writePluginOptions = (json: PackageJSON, options: Awaited<ReturnType<typeof getPluginOptions>>) => {
	const {plugins} = options;
	if (!plugins.includes(Plugins.PRINT)) {
		delete json.dependencies['@rainbow-o23/n91'];
		Object.keys(json.scripts).forEach((key) => {
			json.scripts[key] = json.scripts[key].replace(',envs/common/.print', '');
		});
	}
};

export const writePluginFiles = (options: Awaited<ReturnType<typeof getPluginOptions>>, directory: string) => {
	const {plugins} = options;
	if (!plugins.includes(Plugins.PRINT)) {
		const serverTsFile = path.resolve(directory, 'src', 'server.ts');
		let content = fs.readFileSync(serverTsFile).toString();
		content = content.replace('import \'@rainbow-o23/n91\';\n', '');
		fs.writeFileSync(serverTsFile, content);
		fs.rmSync(path.resolve(directory, 'envs', 'common', '.print'));
		fs.rmSync(path.resolve(directory, 'server', '03-print'), {recursive: true, force: true});
	}
};
