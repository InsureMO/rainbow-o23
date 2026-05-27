import {LoggerService} from '@nestjs/common';
import {Request, Response} from 'express';
import {AsyncLocalStorage} from 'node:async_hooks';

/**
 * Builds MDC (Mapped Diagnostic Context) from an incoming HTTP request.
 * Returned key-value pairs are injected into all log entries within the request lifecycle.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MDCBuilder = (request: Request) => Record<string, any>;

/**
 * Logs incoming request details. Called before the pipeline executes.
 */
export type RequestLogger = (logger: LoggerService, request: Request) => void;

/**
 * Logs response details. Called after the pipeline completes (on success or failure).
 * One of {@link body} or {@link e} will be present — never both.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ResponseLogger = (logger: LoggerService, spent: bigint, response: Response, body?: any, e?: Error) => void;

/**
 * Global singleton for configuring MDC propagation and request/response logging hooks.
 *
 * Uses Node.js {@link AsyncLocalStorage} to propagate per-request context
 * (e.g. trace ID, user ID) through the entire async call chain.
 *
 * Register hooks before the application starts:
 * - {@link ControllerContextBuilder.registerMDCBuilder} — build MDC from the incoming request
 * - {@link ControllerContextBuilder.registerRequestLogger} — log request details
 * - {@link ControllerContextBuilder.registerResponseLogger} — log response/error details
 */
export class ControllerContextBuilder {
	private static _asyncLocalStorage = new AsyncLocalStorage();
	private static _mdcBuilder: MDCBuilder | undefined;
	private static _requestLogger: RequestLogger | undefined;
	private static _responseLogger: ResponseLogger | undefined;

	// noinspection JSUnusedLocalSymbols
	private constructor() {
	}

	/**
	 * Returns the {@link AsyncLocalStorage} instance used for MDC propagation.
	 * The store is set per-request via {@link MDCBuilder}.
	 */
	public static getAsyncLocalStorage<T>(): AsyncLocalStorage<T> {
		return ControllerContextBuilder._asyncLocalStorage as AsyncLocalStorage<T>;
	}

	/**
	 * Registers the MDC builder. Must be called before the application starts.
	 * The builder receives the incoming {@link Request} and returns key-value pairs
	 * that will be merged into every log entry within that request's async scope.
	 */
	public static registerMDCBuilder(builder: MDCBuilder): void {
		ControllerContextBuilder._mdcBuilder = builder;
	}

	/**
	 * Returns the registered MDC builder, or `undefined` if none is registered.
	 */
	public static getMDCBuilder(): MDCBuilder | undefined {
		return ControllerContextBuilder._mdcBuilder;
	}

	/**
	 * Registers a request logger. Called before the pipeline executes on each request.
	 * Failures in the logger are silently ignored to avoid disrupting the request flow.
	 */
	public static registerRequestLogger(logger: RequestLogger): void {
		ControllerContextBuilder._requestLogger = logger;
	}

	/**
	 * Returns the registered request logger, or `undefined` if none is registered.
	 */
	public static getRequestLogger(): RequestLogger | undefined {
		return ControllerContextBuilder._requestLogger;
	}

	/**
	 * Registers a response logger. Called after the pipeline completes,
	 * with either the response body (success) or the error (failure).
	 * Failures in the logger are silently ignored to avoid disrupting the request flow.
	 */
	public static registerResponseLogger(logger: ResponseLogger): void {
		ControllerContextBuilder._responseLogger = logger;
	}

	/**
	 * Returns the registered response logger, or `undefined` if none is registered.
	 */
	public static getResponseLogger(): ResponseLogger | undefined {
		return ControllerContextBuilder._responseLogger;
	}
}
