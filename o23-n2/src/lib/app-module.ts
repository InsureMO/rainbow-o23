import {Injectable, Logger, MiddlewareConsumer, Module, NestMiddleware} from '@nestjs/common';
import {NextFunction, Request, Response} from 'express';
import {AppController} from './app-controller';
import {getBootstrapOptions} from './bootstrap-options';
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

@Module({
	imports: [getBootstrapOptions().createWinstonModule()],
	controllers: [AppController, PipelineController],
	providers: [Logger]
})
export class AppModule {
	// let's add a middleware on all routes
	// noinspection JSUnusedGlobalSymbols
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(RequestLoggerMiddleware).forRoutes('*');
	}
}
