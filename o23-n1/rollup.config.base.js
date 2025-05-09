import {babel} from '@rollup/plugin-babel';
import eslint from '@rollup/plugin-eslint';
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
			{format: 'es', dir: '.'},
			{format: 'cjs', file: './index.cjs'}
		],
		plugins: [
			lint ? eslint({exclude: ['../node_modules/**', 'node_modules/**']}) : null,
			typescript({clean: true}),
			babel({babelHelpers: 'bundled'})
		].filter(x => x != null),
		external(id) {
			return ["dayjs/plugin/"].some(scope => id.startsWith(scope))
				|| [
					'@rainbow-n19/n1',
					'nanoid', 'dayjs', 'mathjs', 'decimal.js', "zstddec"
				].includes(id);
		}
	};
};