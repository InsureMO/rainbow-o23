import {INestApplication, Logger} from '@nestjs/common';
import {HttpAdapterHost, NestFactory} from '@nestjs/core';
import {json, urlencoded} from 'express';
import {WINSTON_MODULE_NEST_PROVIDER} from 'nest-winston';
import {createAppModule} from './app-module';
import {BootstrapOptions, createBoostrapOptions} from './bootstrap-options';
import {ErrorFilter} from './exception-handling';

// noinspection JSUnusedGlobalSymbols
export class Bootstrap {
	// noinspection JSUnusedLocalSymbols
	private constructor() {
		// avoid extend
	}

	// noinspection JSUnusedGlobalSymbols,TypeScriptValidateTypes
	public static async launch(options?: BootstrapOptions): Promise<INestApplication> {
		options = createBoostrapOptions(options);
		const modules = options.getModules();
		const AppModule = createAppModule(options);
		if (modules.length !== 0) {
			const imports = Reflect.getMetadata('imports', AppModule);
			Reflect.defineMetadata('imports', [...imports, ...modules], AppModule);
		}
		const app = await NestFactory.create(AppModule);
		app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
		app.useGlobalFilters(new ErrorFilter(app.get(HttpAdapterHost)));
		app.use(json({limit: options.getEnvAsString('app.body.json.max.size', '50mb')}));
		app.use(urlencoded({extended: true, limit: options.getEnvAsString('app.body.urlencoded.max.size', '50mb')}));
		options.assistApplication(app);
		// replace logger
		options.getConfig().setLogger(new Logger());
		const [port, context] = [options.getPort(), options.getContext()];
		app.setGlobalPrefix(context);
		await app.listen(port);
		new Logger(Bootstrap.name).log(`O23 Application launched at http://localhost:${port}${context}.`);
		console.log(`O23 Application launched at http://localhost:${port}${context}.`);
		return app;
	}
}
