import {Injectable, Logger, MiddlewareConsumer, Module, NestMiddleware, Type} from '@nestjs/common';
import {NextFunction, Request, Response} from 'express';
import {AbstractController} from './abstract-controller';
import {AppController} from './app-controller';
import {BootstrapOptions} from './bootstrap-options';
import {PipelineController} from './pipeline-controller';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
	private readonly logger: Logger = new Logger();

	use(request: Request, response: Response, next: NextFunction) {
		response.on('finish', () => {
			const statusCode = response.statusCode;
			if (statusCode >= 400) {
				this.logger.error(`[${request.method}] [${request.url}] - Status: ${statusCode}`);
			} else {
				const contentLength = response.get('content-length') ?? 'Unknown';
				this.logger.log(`[${request.method}] ${request.url} - Status: ${statusCode}, ContentLength: ${contentLength}`);
			}
		});

		next();
	}
}

export const createAppModule = (options: BootstrapOptions) => {
	const AppModuleClass = class AppModule {
		// let's add a middleware on all routes
		// noinspection JSUnusedGlobalSymbols
		configure(consumer: MiddlewareConsumer) {
			consumer.apply(RequestLoggerMiddleware).forRoutes('*');
		}
	};
	const controllers: Array<Type<AbstractController>> = [AppController];
	if (options.usePrebuiltPipelineController()) {
		controllers.push(PipelineController);
	}
	return Reflect.decorate([Module({
		imports: [options.createWinstonModule()],
		controllers: controllers,
		providers: [Logger]
	})], AppModuleClass, (void 0), (void 0));
};
