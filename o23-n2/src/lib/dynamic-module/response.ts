import {Response} from '@nestjs/common';
import {Undefinable} from '@rainbow-o23/n1';
import {DynamicModuleParameter} from './parameter-decorator';
import {DynamicModulePipeline, ParameterDecoratorDelegateDef, ParameterType} from './types';

export class DynamicModuleResponse {
	private constructor() {
		// avoid extend
	}

	public static create(_def: DynamicModulePipeline, index: number): Undefinable<ParameterDecoratorDelegateDef> {
		return DynamicModuleParameter.createParameterDecoratorDelegateDef({
			decorator: Response({passthrough: true}), index, type: ParameterType.RESPONSE, name: '$response'
		});
	}
}