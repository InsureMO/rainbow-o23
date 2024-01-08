import {INestApplication, Logger} from '@nestjs/common';
import {HttpAdapterHost, NestFactory} from '@nestjs/core';
import dayjs from 'dayjs';
import ArraySupport from 'dayjs/plugin/arraySupport.js';
import CustomParseFormat from 'dayjs/plugin/customParseFormat.js';
import Duration from 'dayjs/plugin/duration.js';
import IsToday from 'dayjs/plugin/isToday.js';
import ObjectSupport from 'dayjs/plugin/objectSupport.js';
import QuarterOfYear from 'dayjs/plugin/quarterOfYear.js';
import RelativeTime from 'dayjs/plugin/relativeTime.js';
import UTC from 'dayjs/plugin/utc.js';
import WeekOfYear from 'dayjs/plugin/weekOfYear.js';
import {json, urlencoded} from 'express';
import {WINSTON_MODULE_NEST_PROVIDER} from 'nest-winston';
import {AppModule} from './app-module';
import {BootstrapOptions, createBoostrapOptions} from './bootstrap-options';
import {ErrorFilter} from './exception-handling';

dayjs.extend(WeekOfYear);
dayjs.extend(QuarterOfYear);
dayjs.extend(Duration);
dayjs.extend(IsToday);
dayjs.extend(RelativeTime);
dayjs.extend(ArraySupport);
dayjs.extend(ObjectSupport);
dayjs.extend(CustomParseFormat);
dayjs.extend(UTC);

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
		if (modules.length !== 0) {
			//
			const imports = Reflect.getMetadata('imports', AppModule);
			Reflect.defineMetadata('imports', [...imports, ...modules], AppModule);
		}
		const app = await NestFactory.create(AppModule);
		app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
		app.useGlobalFilters(new ErrorFilter(app.get(HttpAdapterHost)));
		app.use(json({limit: options.getEnvAsString('app.body.json.max.size', '50mb')}));
		app.use(urlencoded({extended: true, limit: options.getEnvAsString('app.body.urlencoded.max.size', '50mb')}));
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
