import {ParameterDecoratorDelegate, ParameterDecoratorDelegateDef, ParameterType} from './types';

export class DynamicModuleParameter {
	public static createParameterDecorator(parameterIndex: number, decorator: ParameterDecorator): ParameterDecoratorDelegate {
		// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
		return function (target: Object, key: string | symbol | undefined) {
			return decorator(target, key, parameterIndex);
		};
	}

	public static createParameterDecoratorDelegateDef(options: {
		decorator: ParameterDecorator; index: number; type: ParameterType; name: string;
	}): ParameterDecoratorDelegateDef {
		return {
			delegate: DynamicModuleParameter.createParameterDecorator(options.index, options.decorator),
			index: options.index, type: options.type, name: options.name
		};
	}
}