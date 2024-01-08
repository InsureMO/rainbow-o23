import {Query} from '@nestjs/common';
import {Undefinable} from '@rainbow-o23/n1';
import {DynamicModuleParameter} from './parameter-decorator';
import {DynamicModulePipeline, ParameterDecoratorDelegateDef, ParameterType} from './types';

export class DynamicModuleRequestQueryParams {
	private constructor() {
		// avoid extend
	}

	public static create(def: DynamicModulePipeline, index: number): Undefinable<Array<ParameterDecoratorDelegateDef>> {
		if (def.queryParams === true) {
			return [DynamicModuleParameter.createParameterDecoratorDelegateDef({
				decorator: Query(), index, type: ParameterType.QUERY, name: 'queryParams'
			})];
		} else if (Array.isArray(def.queryParams)) {
			return def.queryParams.map((name, paramIndex) => {
				return DynamicModuleParameter.createParameterDecoratorDelegateDef({
					decorator: Query(name), index: index + paramIndex, type: ParameterType.QUERY, name
				});
			});
		} else {
			return (void 0);
		}
	}
}
