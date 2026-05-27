import {
	Controller,
	ForbiddenException,
	HttpCode,
	LoggerService,
	StreamableFile,
	UnauthorizedException
} from '@nestjs/common';
import {
	ERR_PIPELINE_NOT_FOUND,
	PIPELINE_STEP_FILE_SYMBOL,
	PIPELINE_STEP_RETURN_NULL,
	PipelineExecutionContext,
	PipelineRepository,
	PipelineRequestAuthorization,
	PipelineStepFile,
	UncatchableError,
	Undefinable
} from '@rainbow-o23/n1';
import {Request, Response} from 'express';
import {Readable} from 'stream';
import {AbstractController} from '../abstract-controller';
import {ControllerContextBuilder} from '../controller-context-builder';
import {ERR_REQUEST_NOT_FOUND, ERR_RESPONSE_NOT_FOUND} from '../error-codes';
import {handleException} from '../exception-handling';
import {DynamicModuleRequest} from './request';
import {AuthGuardMetadata} from './request-auth-guard';
import {DynamicModuleRequestBody} from './request-body';
import {DynamicModuleRequestFile} from './request-file';
import {DynamicModuleRequestHeader} from './request-header';
import {DynamicModuleRequestPathParams} from './request-path-params';
import {DynamicModuleRequestQueryParams} from './request-query-params';
import {DynamicModuleResponse} from './response';
import {ResponseHeadersGuardMetadata} from './response-headers-guard';
import {DynamicModulePipeline, ParameterDecoratorDelegateDef, ParameterType} from './types';

export class DynamicModuleController {
	// noinspection JSUnusedLocalSymbols
	private constructor() {
		// avoid extend
	}

	public static createParameterDecorators(def: DynamicModulePipeline): Array<ParameterDecoratorDelegateDef> {
		const decorators: Array<ParameterDecoratorDelegateDef> = [];
		const bodyDecorator = DynamicModuleRequestBody.create(def, decorators.length);
		if (bodyDecorator != null) {
			decorators.push(bodyDecorator);
		}
		const headerDecorators = DynamicModuleRequestHeader.create(def, decorators.length);
		if (headerDecorators != null) {
			decorators.push(...headerDecorators);
		}
		const pathParamDecorators = DynamicModuleRequestPathParams.create(def, decorators.length);
		if (pathParamDecorators != null) {
			decorators.push(...pathParamDecorators);
		}
		const queryParamDecorators = DynamicModuleRequestQueryParams.create(def, decorators.length);
		if (queryParamDecorators != null) {
			decorators.push(...queryParamDecorators);
		}
		const fileDecorator = DynamicModuleRequestFile.createParameterDecorator(def, decorators.length);
		if (fileDecorator != null) {
			decorators.push(fileDecorator);
		}
		// always decorate request and response
		decorators.push(DynamicModuleResponse.create(def, decorators.length));
		decorators.push(DynamicModuleRequest.create(def, decorators.length));
		return decorators;
	}

	public static createController(def: DynamicModulePipeline): typeof AbstractController {
		const parameterDecorators = DynamicModuleController.createParameterDecorators(def);
		const authorizationMetadata = new AuthGuardMetadata(def.authorizations);
		const responseHeadersMetadata = new ResponseHeadersGuardMetadata(def.exposeHeaders);
		const ControllerClass = class extends AbstractController {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			protected createRequest(...args: Array<any>): any {
				const count = parameterDecorators.length;
				if (count === 0) {
					// not declared
					return (void 0);
				} else if (count === 1 && parameterDecorators[0].type === ParameterType.RESPONSE) {
					// only one is response, ignore it
					return (void 0);
				} else if (count === 1 && parameterDecorators[0].type === ParameterType.REQUEST) {
					// only one is request, ignore it
					return (void 0);
				} else if (count === 1) {
					// only one, return it
					return args[0];
				} else if (count === 2 && parameterDecorators[1].type === ParameterType.RESPONSE) {
					// two args, and second one is response. Ignore second one, return first directly
					return args[0];
				} else if (count === 2 && parameterDecorators[1].type === ParameterType.REQUEST) {
					// two args, and second one is request. Ignore second one, return first directly
					return args[0];
				} else if (count === 3
					&& parameterDecorators[1].type === ParameterType.RESPONSE
					&& parameterDecorators[2].type === ParameterType.REQUEST) {
					// three args, and second one is response, third one is request. Ignore second/third, return first directly
					return args[0];
				}

				// more than one parameter, need to be merged into one
				return parameterDecorators
					// always ignore response
					.filter(decorator => decorator.type !== ParameterType.RESPONSE)
					.filter(decorator => decorator.type !== ParameterType.REQUEST)
					.reduce((data, {name}, index) => {
						data[name] = args[index];
						return data;
					}, {});
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			protected findRequest(args: Array<any>, logger: LoggerService) {
				const requestArgIndex = parameterDecorators.findIndex(decorator => decorator.type === ParameterType.REQUEST);
				if (requestArgIndex === -1) {
					handleException(logger,
						new UncatchableError(ERR_REQUEST_NOT_FOUND, `Request is required for pipeline[code=${def.code}].`),
						this.constructor.name);
				}
				return args[requestArgIndex] as Request;
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			protected findResponse(args: Array<any>, logger: LoggerService) {
				const responseArgIndex = parameterDecorators.findIndex(decorator => decorator.type === ParameterType.RESPONSE);
				if (responseArgIndex === -1) {
					handleException(logger,
						new UncatchableError(ERR_RESPONSE_NOT_FOUND, `Response is required for pipeline[code=${def.code}].`),
						this.constructor.name);
				}
				return args[responseArgIndex] as Response;
			}

			protected async authorize(request: Request, logger: LoggerService): Promise<Undefinable<PipelineRequestAuthorization>> {
				if (!this.getConfig().getBoolean('app.auth.enabled', false)) {
					return (void 0);
				}
				// do auth first, if needed
				const authPipelineCode = this.getConfig().getString('app.auth.pipeline', 'Authenticate');
				// need authorization, find request
				const headers = request.headers ?? {};
				const authorizationToken = headers.authorization;
				const pipeline = await PipelineRepository.findPipeline(authPipelineCode, {
					config: this.getConfig(), logger
				});
				if (pipeline == null) {
					handleException(logger,
						new UncatchableError(ERR_PIPELINE_NOT_FOUND, `Pipeline[code=${authPipelineCode}] not found.`),
						this.constructor.name);
				} else {
					const result = await pipeline.perform({
						payload: {request, headers, authorization: authorizationToken},
						$context: new PipelineExecutionContext()
					});
					const {payload: {authentication, roles} = {authentication: (void 0), roles: []}} = result ?? {};
					// no authentication found
					if (authorizationMetadata.isFullyAuthenticatedRequired() && !authorizationMetadata.isFullyAuthenticated(authentication)) {
						throw new UnauthorizedException('Unauthorized');
					}
					const {authorized, roles: matchedRoles} = authorizationMetadata.authorize({roles});
					if (!authorized) {
						throw new ForbiddenException('Access denied');
					}
					return {
						authorized: true,
						authentication, roles: matchedRoles,
						headers: (() => {
							const headers = {} as PipelineRequestAuthorization['headers'];
							if (authorizationToken != null
								&& authorizationToken.trim().length !== 0
								&& this.getConfig().getBoolean('app.auth.authorization.expose', false)) {
								const name = this.getConfig().getString('app.auth.authorization.expose.name', 'O23-Authorization');
								headers[name] = authorizationToken;
							}
							if (authentication != null
								&& this.getConfig().getBoolean('app.auth.authentication.expose', true)) {
								const name = this.getConfig().getString('app.auth.authentication.expose.name', 'O23-Authentication');
								if (typeof authentication === 'string') {
									headers[name] = authentication;
								} else {
									Object.keys(authentication).forEach(key => {
										const value = authentication[key];
										if (value != null && `${value}`.trim().length !== 0) {
											headers[`${name}-${key}`] = authentication[key];
										}
									});
								}
							}
							if (matchedRoles != null
								&& matchedRoles.length !== 0
								&& this.getConfig().getBoolean('app.auth.roles.expose', false)) {
								const name = this.getConfig().getString('app.auth.roles.expose.name', 'O23-Authorized-Roles');
								headers[name] = matchedRoles.map(({code}) => code).join(', ');
							}
							return headers;
						})()
					};
				}
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			private async doInvokeInternal(request: Request, logger: LoggerService, ...args: Array<any>): Promise<any> {
				const authorization = await this.authorize(request, logger);
				// perform pipeline
				const pipeline = await PipelineRepository.findPipeline(def.code, {config: this.getConfig(), logger});
				if (pipeline == null) {
					handleException(logger,
						new UncatchableError(ERR_PIPELINE_NOT_FOUND, `Pipeline[code=${def.code}] not found.`),
						this.constructor.name);
				} else {
					try {
						const $context = new PipelineExecutionContext(authorization);
						const result = await pipeline.perform({
							payload: this.createRequest(...args),
							$context
						});
						const {payload} = result;
						const response = this.findResponse(args, logger);
						// set expose headers, and authorization headers
						const {headers} = authorization ?? {};
						const exposeHeaders = (() => {
							const exposed = {
								...(responseHeadersMetadata.getExposedHeaders() ?? {}),
								...(headers ?? {}),
								...($context?.scopedTraceIds ?? {})
							};
							return Object.keys(exposed).reduce((data, key) => {
								if (exposed[key] != null && exposed[key].trim().length !== 0) {
									data[key] = exposed[key];
								}
								return data;
							}, {});
						})();
						response.set(exposeHeaders);

						//  set response body
						if (payload == null || payload === PIPELINE_STEP_RETURN_NULL) {
							return null;
						} else if (payload instanceof StreamableFile) {
							response.set({'Content-Type': 'application/octet-stream'});
							return payload;
						} else if (payload instanceof Buffer) {
							response.set({'Content-Type': 'application/octet-stream'});
							const stream = new Readable();
							stream.push(payload);
							stream.push(null);
							return new StreamableFile(stream);
						} else if (typeof payload === 'object' && payload.$file === PIPELINE_STEP_FILE_SYMBOL) {
							const file = payload as PipelineStepFile;
							if (file.name != null && file.name.trim().length !== 0) {
								response.set({
									'Content-Type': file.type || 'application/octet-stream',
									'Content-Disposition': `attachment; filename="${file.name.trim()}"`
								});
							} else {
								response.set({'Content-Type': file.type || 'application/octet-stream'});
							}
							const stream = new Readable();
							stream.push(file.content);
							stream.push(null);
							return new StreamableFile(stream);
						} else {
							return payload;
						}
					} catch (e) {
						handleException(logger, e, this.constructor.name);
					}
				}
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			private async doInvokeWithLogAspect(request: Request, logger: LoggerService, ...args: Array<any>): Promise<any> {
				const now = process.hrtime.bigint();
				try {
					const log = ControllerContextBuilder.getRequestLogger();
					if (log != null) {
						log(logger, request);
					}
				} catch {
					/* intentionally ignore request logging errors */
				}
				try {
					const ret = await this.doInvokeInternal(request, logger, ...args);
					try {
						const log = ControllerContextBuilder.getResponseLogger();
						if (log != null) {
							log(logger, process.hrtime.bigint() - now, this.findResponse(args, logger), ret);
						}
					} catch {
						/* intentionally ignore response logging errors */
					}
					return ret;
				} catch (e) {
					try {
						const log = ControllerContextBuilder.getResponseLogger();
						if (log != null) {
							log(logger, process.hrtime.bigint() - now, this.findResponse(args, logger), (void 0), e);
						}
					} catch {
						/* intentionally ignore response logging errors */
					}
					throw e;
				}
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			private async doInvoke(request: Request, logger: LoggerService, ...args: Array<any>): Promise<any> {
				if (this.getConfig().getBoolean('logger.route.aspect.enabled', false)) {
					return await this.doInvokeWithLogAspect(request, logger, ...args);
				} else {
					return await this.doInvokeInternal(request, logger, ...args);
				}
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			public async invoke(...args: Array<any>): Promise<any> {
				const request = this.findRequest(args, this.getLogger());
				if (this.getConfig().getBoolean('logger.mdc.enabled', false)) {
					if (this.getConfig().getBoolean('logger.mdc.proxy.enabled', true)) {
						return this.doInvoke(request, this.getLogger(request), ...args);
					} else {
						const mdc = ControllerContextBuilder.getMDCBuilder()?.(request);
						return ControllerContextBuilder.getAsyncLocalStorage().run(mdc, async () => {
							return this.doInvoke(request, this.getLogger(), ...args);
						});
					}
				} else {
					return this.doInvoke(request, this.getLogger(), ...args);
				}
			}
		};
		Object.defineProperty(ControllerClass, 'name', {value: def.code});
		const decorators = [
			// http method
			DynamicModuleRequest.createMethodDecorator(def),
			DynamicModuleRequest.createFileDecorator(def),
			HttpCode(200),
			...parameterDecorators.map(({delegate}) => delegate),
			Reflect.metadata('design:type', Function),
			Reflect.metadata('design:paramtypes', [Object]),
			Reflect.metadata('design:returntype', Promise)
		].filter(x => x != null);
		Reflect.decorate(decorators, ControllerClass.prototype, 'invoke', Object.getOwnPropertyDescriptor(ControllerClass.prototype, 'invoke'));
		Reflect.decorate([Controller(def.route)], ControllerClass, void 0, void 0);
		return ControllerClass;
	}

	public static createControllers(pipelines?: Array<DynamicModulePipeline>): Array<typeof AbstractController> {
		return (pipelines || []).map(pipeline => {
			if (pipeline.route == null || pipeline.route.trim().length === 0) {
				return null;
			}
			return DynamicModuleController.createController(pipeline);
		}).filter(pipeline => pipeline != null);
	}
}