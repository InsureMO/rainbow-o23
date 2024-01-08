import {Undefinable} from '@rainbow-o23/n1';
import {DynamicModuleRequestFile} from './request-file';
import {DynamicModuleRequestMethod} from './request-method';
import {DynamicModulePipeline} from './types';

export class DynamicModuleRequest {
	private constructor() {
		// avoid extend
	}

	public static createMethodDecorator(def: DynamicModulePipeline): MethodDecorator {
		return DynamicModuleRequestMethod.create(def);
	}

	public static createFileDecorator(def: DynamicModulePipeline): Undefinable<MethodDecorator> {
		return DynamicModuleRequestFile.createMethodDecorator(def);
	}
}