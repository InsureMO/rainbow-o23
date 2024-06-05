import {Controller, HttpCode, StreamableFile} from '@nestjs/common';
import {
	ERR_PIPELINE_NOT_FOUND,
	PIPELINE_STEP_FILE_SYMBOL,
	PIPELINE_STEP_RETURN_NULL,
	PipelineRepository,
	PipelineStepFile,
	UncatchableError
} from '@rainbow-o23/n1';
import {Response} from 'express';
import {Readable} from 'stream';
import {AbstractController} from '../abstract-controller';
import {ERR_RESPONSE_NOT_FOUND} from '../error-codes';
import {handleException} from '../exception-handling';
import {DynamicModuleRequest} from './request';
import {DynamicModuleRequestBody} from './request-body';
import {DynamicModuleRequestFile} from './request-file';
import {DynamicModuleRequestHeader} from './request-header';
import {DynamicModuleRequestPathParams} from './request-path-params';
import {DynamicModuleRequestQueryParams} from './request-query-params';
import {DynamicModuleResponse} from './response';
import {DynamicModuleResponseFile} from './response-file';
import {DynamicModulePipeline, ParameterDecoratorDelegateDef, ParameterType} from './types';

export class DynamicModuleController {
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
		const responseDecorator = DynamicModuleResponseFile.create(def, decorators.length);
		if (responseDecorator != null) {
			decorators.push(responseDecorator);
		}
		return decorators;
	}

	public static createController(def: DynamicModulePipeline): typeof AbstractController {
		const parameterDecorators = DynamicModuleController.createParameterDecorators(def);
		const ControllerClass = class extends AbstractController {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			protected createRequest(...args: Array<any>): any {
				const count = parameterDecorators.length;
				if (count === 0) {
					// not declared
					return (void 0);
				} else if (count === 1 && parameterDecorators[0].type === ParameterType.RESPONSE) {
					return (void 0);
				} else if (count === 1) {
					// only one, return it
					return args[0];
				} else if (count === 2 && parameterDecorators[1].type === ParameterType.RESPONSE) {
					// two args, and second one is response. Ignore second one, return first directly
					return args[0];
				}

				// more than one parameter, need to be merged into one
				return parameterDecorators
					// always ignore response
					.filter(decorator => decorator.type !== ParameterType.RESPONSE)
					.reduce((data, {name}, index) => {
						data[name] = args[index];
						return data;
					}, {});
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			protected findResponse(args: Array<any>) {
				const responseArgIndex = parameterDecorators.findIndex(decorator => decorator.type === ParameterType.RESPONSE);
				if (responseArgIndex === -1) {
					handleException(this.getLogger(),
						new UncatchableError(ERR_RESPONSE_NOT_FOUND, `Response is required for pipeline[code=${def.code}].`),
						this.constructor.name);
				}
				return args[responseArgIndex] as Response;
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			public async invoke(...args: Array<any>): Promise<any> {
				const pipeline = await PipelineRepository.findPipeline(def.code, this.buildPipelineOptions());
				if (pipeline == null) {
					handleException(this.getLogger(),
						new UncatchableError(ERR_PIPELINE_NOT_FOUND, `Pipeline[code=${def.code}] not found.`),
						this.constructor.name);
				} else {
					try {
						const result = await pipeline.perform({payload: this.createRequest(...args)});
						const {payload} = result;
						if (payload == null || payload === PIPELINE_STEP_RETURN_NULL) {
							return null;
						} else if (payload instanceof StreamableFile) {
							const response = this.findResponse(args);
							response.set({'Content-Type': 'application/octet-stream'});
							return payload;
						} else if (payload instanceof Buffer) {
							const response = this.findResponse(args);
							response.set({'Content-Type': 'application/octet-stream'});
							const stream = new Readable();
							stream.push(payload);
							stream.push(null);
							return new StreamableFile(stream);
						} else if (typeof payload === 'object' && payload.$file === PIPELINE_STEP_FILE_SYMBOL) {
							const response = this.findResponse(args);
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
						handleException(this.getLogger(), e, this.constructor.name);
					}
				}
			}
		};
		Object.defineProperty(ControllerClass, 'name', {value: def.code});
		const decorators = [
			// http method
			DynamicModuleRequest.createMethodDecorator(def),
			DynamicModuleRequest.createFileDecorator(def),
			...DynamicModuleResponse.createHeaderDecorators(def),
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