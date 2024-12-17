import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger, LoggerService} from '@nestjs/common';
import {HttpAdapterHost} from '@nestjs/core';
import {CatchableError, ERR_UNKNOWN, ExposedUncatchableError, UncatchableError} from '@rainbow-o23/n1';

export const handleException = (logger: LoggerService, e: Error, context: string): never => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const code = typeof (e as any).getCode === 'function' ? (e as any).getCode() : ERR_UNKNOWN;
	const message = e.message || 'No message.';
	logger.error(`[${code}] ${message}`, e.stack, context);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(e as any).$$printed = true;
	throw e;
};

const ErrorHandling = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	buildResponseBody: (options: { code: string, message?: any }): any => ({
		code: options.code || ERR_UNKNOWN,
		message: options.message || 'Exception occurred.'
	})
};

export const useErrorResponseBodyAdvisor = (advice: typeof ErrorHandling['buildResponseBody']) => {
	if (advice != null) {
		ErrorHandling.buildResponseBody = advice;
	}
};

@Catch()
export class ErrorFilter implements ExceptionFilter {
	private readonly logger = new Logger();

	public constructor(private readonly httpAdapterHost: HttpAdapterHost) {
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public catch(e: any, host: ArgumentsHost): void {
		if (e instanceof Error) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((e as any).$$printed !== true) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const code = typeof (e as any).getCode === 'function' ? (e as any).getCode() : ERR_UNKNOWN;
				const message = e.message || 'No message.';
				this.logger.error(`[${code}] ${message}`, e.stack, ErrorFilter.name);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				delete (e as any).$$printed;
			}
		}

		let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let responseBody: any;
		if (e instanceof HttpException) {
			httpStatus = e.getStatus();
			const response = e.getResponse();
			if (response == null) {
				responseBody = ErrorHandling.buildResponseBody({code: ERR_UNKNOWN, message: e.message});
			} else if (typeof response === 'string') {
				responseBody = ErrorHandling.buildResponseBody({code: ERR_UNKNOWN, message: response});
			} else {
				responseBody = ErrorHandling.buildResponseBody({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					code: (response as any).code,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					message: (response as any).message || (response as any).error
				});
			}
		} else if (e instanceof CatchableError) {
			responseBody = ErrorHandling.buildResponseBody({code: e.getCode(), message: e.message});
		} else if (e instanceof ExposedUncatchableError) {
			httpStatus = e.getStatus();
			responseBody = ErrorHandling.buildResponseBody({code: e.getCode(), message: e.message});
		} else if (e instanceof UncatchableError) {
			responseBody = ErrorHandling.buildResponseBody({code: e.getCode(), message: e.message});
		} else if (e instanceof Error) {
			responseBody = ErrorHandling.buildResponseBody({code: ERR_UNKNOWN, message: e.message});
		} else {
			responseBody = ErrorHandling.buildResponseBody({code: ERR_UNKNOWN, message: e});
		}

		const {httpAdapter} = this.httpAdapterHost;
		const ctx = host.switchToHttp();
		httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
	}
}