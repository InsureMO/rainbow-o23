import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, LoggerService} from '@nestjs/common';
import {HttpAdapterHost} from '@nestjs/core';
import {CatchableError, ERR_UNKNOWN, ExposedUncatchableError, UncatchableError} from '@rainbow-o23/n1';

export const handleException = (logger: LoggerService, e: Error, context: string): never => {
	logger.error(e.message, e.stack, context);
	throw e;
};

@Catch()
export class ErrorFilter implements ExceptionFilter {
	public constructor(private readonly httpAdapterHost: HttpAdapterHost) {
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public catch(e: any, host: ArgumentsHost): void {
		let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let responseBody: any;
		if (e instanceof HttpException) {
			httpStatus = e.getStatus();
			const response = e.getResponse();
			if (response == null) {
				responseBody = {code: ERR_UNKNOWN, message: e.message || 'Exception occurred.'};
			} else if (typeof response === 'string') {
				responseBody = {code: ERR_UNKNOWN, message: response || 'Exception occurred.'};
			} else {
				responseBody = {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					code: (response as any).code || ERR_UNKNOWN,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					message: (response as any).message || (response as any).error || 'Exception occurred.'
				};
			}
		} else if (e instanceof CatchableError) {
			responseBody = {code: e.getCode() || ERR_UNKNOWN, message: e.message || 'Exception occurred.'};
		} else if (e instanceof ExposedUncatchableError) {
			httpStatus = e.getStatus();
			responseBody = {code: e.getCode() || ERR_UNKNOWN, message: e.message || 'Exception occurred.'};
		} else if (e instanceof UncatchableError) {
			responseBody = {code: e.getCode() || ERR_UNKNOWN, message: e.message || 'Exception occurred.'};
		} else if (e instanceof Error) {
			responseBody = {code: ERR_UNKNOWN, message: e.message || 'Exception occurred.'};
		} else {
			responseBody = {code: ERR_UNKNOWN, message: e};
		}

		const {httpAdapter} = this.httpAdapterHost;
		const ctx = host.switchToHttp();
		httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
	}
}