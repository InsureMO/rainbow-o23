import {Delete, Get, Patch, Post, Put} from '@nestjs/common';
import {UncatchableError} from '@rainbow-o23/n1';
import {ERR_PIPELINE_HTTP_METHOD_NOT_SUPPORTED} from '../error-codes';
import {DynamicModulePipeline} from './types';

export class DynamicModuleRequestMethod {
	private constructor() {
		// avoid extend
	}

	public static create(def: DynamicModulePipeline): MethodDecorator {
		switch (def.method) {
			case 'get':
				return Get();
			case 'post':
				return Post();
			case 'put':
				return Put();
			case 'delete':
				return Delete();
			case 'patch':
				return Patch();
			default:
				throw new UncatchableError(ERR_PIPELINE_HTTP_METHOD_NOT_SUPPORTED, `Http method[${def.method}] of pipeline[${def.code}] is not supported yet.`);
		}
	}
}
