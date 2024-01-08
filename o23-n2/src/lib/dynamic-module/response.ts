import {DynamicModuleResponseHeader} from './response-header';
import {DynamicModulePipeline} from './types';

export class DynamicModuleResponse {
	private constructor() {
		// avoid extend
	}

	public static createHeaderDecorators(def: DynamicModulePipeline): Array<MethodDecorator> {
		return DynamicModuleResponseHeader.create(def);
	}
}