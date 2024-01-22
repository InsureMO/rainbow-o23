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
	if (!plugins.includes(Plugins.PRINT)) {
		const serverTsFile = path.resolve(directory, 'src', 'server.ts');
		let content = fs.readFileSync(serverTsFile).toString();
		content = content.replace('import {usePdfSubTemplates} from \'./plugins/print\';\n', '')
			.replace('\t\tusePdfSubTemplates(options);\n', '');
		fs.writeFileSync(serverTsFile, content);
		fs.rmSync(path.resolve(directory, 'envs', 'common', '.print'));
		fs.rmSync(path.resolve(directory, 'server', '03-print'), {recursive: true, force: true});
		fs.rmSync(path.resolve(directory, 'plugins', 'print.ts'))
		fs.rmSync(path.resolve(directory, '.puppeteerrc'));
	}
};
