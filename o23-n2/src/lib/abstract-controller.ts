import {Inject, LoggerService} from '@nestjs/common';
import {Config, PipelineOptions} from '@rainbow-o23/n1';
import {Request} from 'express';
import {WINSTON_MODULE_NEST_PROVIDER} from 'nest-winston';
import {BootstrapOptions, getBootstrapOptions} from './bootstrap-options';
import {ControllerContextBuilder} from './controller-context-builder';

export abstract class AbstractController {
	public constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {
	}

	/**
	 * Returns a logger, optionally wrapped with an MDC proxy that injects MDC context
	 * into log call parameters without using AsyncLocalStorage.
	 *
	 * @param request when provided and both `logger.mdc.enabled` and
	 * `logger.mdc.proxy.enabled` are true, returns a {@link Proxy} that
	 * auto-injects MDC data into every log method's context argument; otherwise
	 * returns the raw logger.
	 */
	protected getLogger(request?: Request): LoggerService {
		if (request != null
			&& this.getConfig().getBoolean('logger.mdc.enabled', false)
			&& this.getConfig().getBoolean('logger.mdc.proxy.enabled', true)) {
			const mdc = ControllerContextBuilder.getMDCBuilder()?.(request);
			if (mdc == null || typeof mdc !== 'object' || Object.keys(mdc).length === 0) {
				return this.logger;
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const transformContext = (context?: any) => {
				if (context == null) {
					context = {'$-m-d-c-$': mdc, '$-origin-context-$': Symbol()};
				} else if (typeof context === 'object') {
					context['$-m-d-c-$'] = mdc;
				} else {
					context = {'$-m-d-c-$': mdc, '$-origin-context-$': context};
				}
				return context;
			};
			// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
			const delegatedFuncs: Record<string, Function | undefined> = {};
			return new Proxy(this.logger, {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				get(target: any, key: string | symbol, receiver: any): any {
					switch (key) {
						case 'error': {
							if (delegatedFuncs.error == null) {
								// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
								const func: Function = Reflect.get(target, key, receiver);
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								delegatedFuncs.error = function (this: any, message: any, stack?: string, context?: any, ...args: Array<any>) {
									func.call(this, message, stack, transformContext(context), ...args);
								}.bind(target);
							}
							return delegatedFuncs.error;
						}
						case 'verbose':
						case 'debug':
						case 'log':
						case 'warn':
						case 'fatal': {
							if (delegatedFuncs[key] == null) {
								const func = Reflect.get(target, key, receiver);
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								delegatedFuncs[key] = function (this: any, message: any, context?: any, ...args: Array<any>) {
									func.call(this, message, transformContext(context), ...args);
								}.bind(target);
							}
							return delegatedFuncs[key];
						}
						default: {
							return Reflect.get(target, key, receiver);
						}
					}
				}
			});
		} else {
			return this.logger;
		}
	}

	protected getConfig(): Config {
		return this.getBootstrapOptions().getConfig();
	}

	protected getBootstrapOptions(): BootstrapOptions {
		return getBootstrapOptions();
	}

	/**
	 * Builds pipeline options with config and the MDC-aware logger.
	 *
	 * @param request passed through to {@link getLogger} for optional MDC proxy wrapping.
	 */
	protected buildPipelineOptions(request?: Request): Pick<PipelineOptions, 'config' | 'logger'> {
		return {config: this.getConfig(), logger: this.getLogger(request)};
	}
}