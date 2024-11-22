import {createConfig} from '@rainbow-o23/n1';
import * as dotenv from 'dotenv';
import {ExtendedBootstrapOptions} from './extended-bootstrap-options';

export class EnvironmentInitializer {
	public async load(): Promise<ExtendedBootstrapOptions> {
		const files = (process.env.CFG_ENV_FILE ?? '.env.common.basic, .env.prod')
			.split(',')
			.map(file => file.trim())
			.filter(file => file.length !== 0);
		if (files.length === 0) {
			files.push('.env.common.basic', '.env.prod');
		}
		files.reverse().forEach(path => dotenv.config({path}));
		return new ExtendedBootstrapOptions(createConfig());
	}
}
