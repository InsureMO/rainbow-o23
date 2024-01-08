import {Response} from '@nestjs/common';
import {Undefinable} from '@rainbow-o23/n1';
import {DynamicModuleParameter} from './parameter-decorator';
import {DynamicModulePipeline, ParameterDecoratorDelegateDef, ParameterType} from './types';

export class DynamicModuleResponseFile {
	private constructor() {
		// avoid extend
	}

	public static create(def: DynamicModulePipeline, index: number): Undefinable<ParameterDecoratorDelegateDef> {
		if (def.exposeFile !== true) {
			return (void 0);
		}
		return DynamicModuleParameter.createParameterDecoratorDelegateDef({
			decorator: Response({passthrough: true}), index, type: ParameterType.RESPONSE, name: '$response'
		});
	}
}
