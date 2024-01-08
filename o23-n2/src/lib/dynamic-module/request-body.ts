import {Body} from '@nestjs/common';
import {Undefinable} from '@rainbow-o23/n1';
import {DynamicModuleParameter} from './parameter-decorator';
import {DynamicModulePipeline, ParameterDecoratorDelegateDef, ParameterType} from './types';

export class DynamicModuleRequestBody {
	private constructor() {
		// avoid extend
	}

	public static create(def: DynamicModulePipeline, index: number): Undefinable<ParameterDecoratorDelegateDef> {
		if ((def.method === 'get' && def.body === true) || (def.method !== 'get' && def.body !== false)) {
			// get need explicitly declare to use body
			// otherwise only when explicitly declare to not use body
			return DynamicModuleParameter.createParameterDecoratorDelegateDef({
				decorator: Body(), index, type: ParameterType.BODY, name: 'body'
			});
		} else {
			return (void 0);
		}
	}
}
