const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');

let Plugins = {
	PRINT: 'print',
	AWS_S3: 'aws-s3'
}
exports.Plugins = Plugins;

exports.getPluginOptions = async () => {
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
};

exports.writePluginOptions = (json, options) => {
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
	if (!plugins.includes(Plugins.AWS_S3)) {
		fs.rmSync(path.resolve(directory, 'src', 'plugins', 'aws.ts'))
		// remove aws s3 part
		content = content.replace('import \'./aws\';\n', '');
	}
	fs.writeFileSync(pluginIndexTsFile, content);
};
