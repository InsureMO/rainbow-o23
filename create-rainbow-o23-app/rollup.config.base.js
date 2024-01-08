import {babel} from '@rollup/plugin-babel';
import eslint from '@rollup/plugin-eslint';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import typescript from 'rollup-plugin-typescript2';

export const buildConfig = (lint) => {
	// ['./index.d.ts', './index.js', './index.cjs', './lib'].forEach(f => {
	// 	const cwd = path.resolve(process.cwd(), f);
	// 	if (fs.existsSync(cwd)) {
	// 		fs.rmSync(cwd, {recursive: true, force: true});
	// 	}
	// });

	return {
		input: './src/index.ts',
		output: [
			{format: 'es', file: './create-app.js'}
		],
		plugins: [
			lint ? eslint({exclude: ['../node_modules/**', 'node_modules/**']}) : null,
			// lint ? tslint({exclude: ['../node_modules/**', 'node_modules/**']}) : null,
			typescript({clean: true}),
			babel({babelHelpers: 'bundled'}),
			del({targets: 'templates/*', hook: 'buildEnd'}),
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