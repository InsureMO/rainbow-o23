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
	}
};
