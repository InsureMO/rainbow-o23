import {Request} from '@nestjs/common';
import {Undefinable} from '@rainbow-o23/n1';
import {DynamicModuleParameter} from './parameter-decorator';
import {DynamicModuleRequestFile} from './request-file';
import {DynamicModuleRequestMethod} from './request-method';
import {DynamicModulePipeline, ParameterDecoratorDelegateDef, ParameterType} from './types';

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

	public static create(_def: DynamicModulePipeline, index: number): Undefinable<ParameterDecoratorDelegateDef> {
		return DynamicModuleParameter.createParameterDecoratorDelegateDef({
			decorator: Request(), index, type: ParameterType.REQUEST, name: '$request'
		});
	}
}