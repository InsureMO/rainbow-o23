import {Controller, Get} from '@nestjs/common';
import {AbstractController} from './abstract-controller';
import {getBootstrapOptions} from './bootstrap-options';

export interface Health {
	up: boolean;
	message: string;
}

export interface Release {
	version: string;
	builtAt: string;
}

@Controller()
export class AppController extends AbstractController {
	@Get()
	async health(): Promise<Health> {
		return {up: true, message: 'Hello there, I am OK now.'};
	}

	@Get('/version')
	async version(): Promise<Release> {
		const bootstrap = getBootstrapOptions();
		return {version: bootstrap.getVersion(), builtAt: bootstrap.getBuiltAt()};
	}
}
