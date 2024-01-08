import {createConfig} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import * as dotenv from 'dotenv';

export class EnvironmentInitializer {
	public async load(): Promise<BootstrapOptions> {
		const files = (process.env.CFG_ENV_FILE ?? '.env.common.basic, .env.prod')
			.split(',')
			.map(file => file.trim())
			.filter(file => file.length !== 0);
		if (files.length === 0) {
			files.push('.env.common.basic', '.env.prod');
		}
		files.reverse().forEach(path => dotenv.config({path}));
		return new BootstrapOptions(createConfig());
	}
}
