import {Headers} from '@nestjs/common';
import {Undefinable} from '@rainbow-o23/n1';
import {DynamicModuleParameter} from './parameter-decorator';
import {DynamicModulePipeline, ParameterDecoratorDelegateDef, ParameterType} from './types';

export class DynamicModuleRequestHeader {
	private constructor() {
		// avoid extend
	}

	public static create(def: DynamicModulePipeline, index: number): Undefinable<Array<ParameterDecoratorDelegateDef>> {
		if (def.headers === true) {
			return [DynamicModuleParameter.createParameterDecoratorDelegateDef({
				decorator: Headers(), index, type: ParameterType.HEADER, name: 'headers'
			})];
		} else if (Array.isArray(def.headers)) {
			return def.headers.map((name, headerIndex) => {
				return DynamicModuleParameter.createParameterDecoratorDelegateDef({
					decorator: Headers(name), index: index + headerIndex, type: ParameterType.HEADER, name
				});
			});
		} else {
			return (void 0);
		}
	}
}
