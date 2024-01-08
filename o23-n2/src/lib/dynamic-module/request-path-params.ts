import {Param} from '@nestjs/common';
import {Undefinable} from '@rainbow-o23/n1';
import {DynamicModuleParameter} from './parameter-decorator';
import {DynamicModulePipeline, ParameterDecoratorDelegateDef, ParameterType} from './types';

export class DynamicModuleRequestPathParams {
	private constructor() {
		// avoid extend
	}

	public static create(def: DynamicModulePipeline, index: number): Undefinable<Array<ParameterDecoratorDelegateDef>> {
		if (def.pathParams === true) {
			return [DynamicModuleParameter.createParameterDecoratorDelegateDef({
				decorator: Param(), index, type: ParameterType.PATH, name: 'pathParams'
			})];
		} else if (Array.isArray(def.pathParams)) {
			return def.pathParams.map((name, paramIndex) => {
				return DynamicModuleParameter.createParameterDecoratorDelegateDef({
					decorator: Param(name), index: index + paramIndex, type: ParameterType.PATH, name
				});
			});
		} else {
			return (void 0);
		}
	}
}
