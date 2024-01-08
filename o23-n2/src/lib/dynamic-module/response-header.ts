import {Header} from '@nestjs/common';
import {DynamicModulePipeline} from './types';

export class DynamicModuleResponseHeader {
	private constructor() {
		// avoid extend
	}

	public static create(def: DynamicModulePipeline): Array<MethodDecorator> {
		if (def.exposeHeaders == null) {
			return [];
		}
		return Object.keys(def.exposeHeaders).map(name => {
			return Header(name, def.exposeHeaders[name] ?? '');
		});
	}
}
