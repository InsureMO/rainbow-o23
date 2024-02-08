const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');

let Plugins = {
	PRINT: 'print'
}
exports.Plugins = Plugins;

exports.getPluginOptions = async () => {
	return prompts([
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

exports.writePluginOptions = (json, options) => {
	const {plugins} = options;
	if (!plugins.includes(Plugins.PRINT)) {
		delete json.dependencies['@rainbow-o23/n91'];
		Object.keys(json.scripts).forEach((key) => {
			json.scripts[key] = json.scripts[key].replace(',envs/common/.print', '');
		});
	}
};

exports.writePluginFiles = (options, directory) => {
	const {plugins} = options;
	const pluginIndexTsFile = path.resolve(directory, 'src', 'plugins', 'index.ts');
	let content = fs.readFileSync(pluginIndexTsFile).toString();
	if (!plugins.includes(Plugins.PRINT)) {
		fs.rmSync(path.resolve(directory, 'envs', 'common', '.print'));
		fs.rmSync(path.resolve(directory, 'server', '03-print'), {recursive: true, force: true});
		fs.rmSync(path.resolve(directory, 'src', 'plugins', 'print.ts'))
		fs.rmSync(path.resolve(directory, '.puppeteerrc'));
		// remove print part
		content = content.replace('import {usePdfSubTemplates} from \'./print\';\n', '')
			.replace('\tusePdfSubTemplates(options);\n', '');
	}
	fs.writeFileSync(pluginIndexTsFile, content);
};
