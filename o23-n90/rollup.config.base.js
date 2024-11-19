import {babel} from '@rollup/plugin-babel';
import eslint from '@rollup/plugin-eslint';
import {string} from "rollup-plugin-string";
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
			string({include: '**/*.yaml'}),
			lint ? eslint({exclude: ['../node_modules/**', 'node_modules/**', '**/*.yaml']}) : null,
			typescript({clean: true}),
			babel({babelHelpers: 'bundled'})
		].filter(x => x != null),
		external(id) {
			return ["@rainbow-o23/"].some(scope => id.startsWith(scope))
				|| ["fs", "path", "glob", "crypto", "dotenv"].includes(id);
		},
		onLog(level, log, handler) {
			if (log.code === 'CIRCULAR_DEPENDENCY') {
				return; // Ignore circular dependency warnings
			}
			handler(level, log); // otherwise, just print the log
		}
	};
};
