const copy = require('rollup-plugin-copy');
const del = require('rollup-plugin-delete');

exports.buildConfig = (lint) => {
	return {
		input: './lib/index.js',
		output: {file: './create-app.js', format: 'cjs'},
		plugins: [
			del({targets: 'templates/*', hook: 'buildEnd'}),
			del({targets: './create-app.js', hook: 'writeBundle'}),
			copy({
				targets: [
					{src: '../o23-n99/db-scripts/*', dest: 'templates/db-scripts'},
					{src: '../o23-n99/envs/*', dest: 'templates/envs'},
					{src: '../o23-n99/scripts/*', dest: 'templates/scripts'},
					{src: '../o23-n99/server/*', dest: 'templates/server'},
					{src: '../o23-n99/src/*', dest: 'templates/src'},
					{src: '../o23-n99/.babelrc', dest: 'templates'},
					{src: '../o23-n99/.eslintrc', dest: 'templates'},
					{src: '../o23-n99/.eslintrc.js', dest: 'templates'},
					{src: '../o23-n99/.prettierrc', dest: 'templates'},
					{src: '../o23-n99/.puppeteerrc', dest: 'templates'},
					{src: '../o23-n99/dockerfile', dest: 'templates'},
					{src: '../o23-n99/nest-cli.json', dest: 'templates'},
					{src: '../o23-n99/package.json', dest: 'templates'},
					{src: '../o23-n99/tsconfig.build.json', dest: 'templates'},
					{src: '../o23-n99/tsconfig.json', dest: 'templates'},
					{src: '../o23-n99/webpack.config.js', dest: 'templates'}
				], hook: 'buildEnd'
			})
		].filter(x => x != null),
		external(id) {
			return [
				'fs', 'path', 'child_process',
				'chalk', 'fs-extra', 'prompts', 'validate-npm-package-name'
			].includes(id);
		}
	};
};