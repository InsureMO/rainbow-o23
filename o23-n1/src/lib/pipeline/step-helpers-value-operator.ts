import {StaticImplements} from './types';
import {
	AllTesters,
	AllTransformers,
	RegisteredValueAction,
	RegisteredValueActionWithParams,
	ValueAction,
	ValueActionFailed,
	ValueActionPassed
} from './value-operators';

interface ValueOperatorBase {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	$value?: any;
	$allowMoreAction: boolean;
	$actions?: Array<ValueAction>;
	$allowUseDefault: boolean;
	$defaultUsed: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	$defaultValue?: any;
	// control
	$allowNoParamFuncCall: boolean;
}

/**
 * function call is allowed for tester and transformer, only when the {@link $allowNoParamFuncCall} is true.
 * and once it is called, set {@link $allowNoParamFuncCall} to false.
 * otherwise, throw exception.
 */
const applyOperator = (operator: IValueOperator, base: ValueOperatorBase) => {
	if (base.$allowNoParamFuncCall) {
		base.$allowNoParamFuncCall = false;
		return operator;
	} else {
		throw new Error(`Function call is not allowed from: ${operator}.`);
	}
};
const NOT_FOUND = Symbol('not found');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ValueActionFind = (operator: IValueOperator, base: ValueOperatorBase, prop: string) => IValueOperator | ((...args: Array<any>) => IValueOperator) | symbol;
const findValueAction = (actions: Record<string, RegisteredValueAction | RegisteredValueActionWithParams>): ValueActionFind => {
	return (operator: IValueOperator, base: ValueOperatorBase, prop: string) => {
		const tester = actions[prop];
		if (tester == null) {
			return NOT_FOUND;
		}

		base.$allowUseDefault = true;
		if (base.$actions == null) {
			base.$actions = [];
		}
		if (tester.type === 'func') {
			// push to tester stack
			base.$actions.push(tester.func);
			base.$allowNoParamFuncCall = true;
			return operator;
		} else if (tester.type === 'param') {
			// build a function to accept parameters
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (...args: Array<any>) => {
				base.$actions.push(tester.func(...args));
				return operator;
			};
		} else {
			throw new Error(`Unknown tester type: ${tester}.`);
		}
	};
};
const findTester = findValueAction(AllTesters);
const findTransformer = findValueAction(AllTransformers);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UseDefaultFind = (operator: IValueOperator, base: ValueOperatorBase, prop: string) => ((defaultValue: any) => IValueOperator) | undefined | symbol;
const findUseDefault: UseDefaultFind = (operator: IValueOperator, base: ValueOperatorBase, prop: string) => {
	if (!base.$allowUseDefault || !['orUseDefault', 'useDefault', 'withDefault', 'orElse', 'else'].includes(prop)) {
		return NOT_FOUND;
	}
	if ((base.$actions == null || base.$actions.length === 0)) {
		// no action defined, use default value directly, no way
		return (void 0);
	}
	base.$allowMoreAction = false;
	base.$allowUseDefault = false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (defaultValue: any) => {
		base.$defaultUsed = true;
		base.$defaultValue = defaultValue;
		return operator;
	};
};
type ValueFind = (operator: IValueOperator, base: ValueOperatorBase, prop: string) => (<T>() => T) | undefined | symbol;
const createValueRetrieveFunc = (base: ValueOperatorBase) => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return <T>(): ValueActionPassed<T> | ValueActionFailed<any> => {
		const tested = {test: true, value: base.$value};
		for (const action of (base.$actions ?? [])) {
			const result = action(tested.value);
			if (!result.test) {
				// failed on action proceeding, ignore all tailing actions, and use original value
				tested.test = false;
				tested.value = base.$value;
				break;
			} else {
				// action proceeded successfully
				tested.value = result.value;
			}
		}
		if (tested.test) {
			// all actions proceeded, and value might be transformed, do nothing
		} else if (base.$defaultUsed) {
			// failed on action proceeding, use default value if defined
			// therefore, final result has been treated as success
			tested.test = true;
			tested.value = base.$defaultValue as T;
		} else {
			// failed on acton proceeding, and no default value defined, return value itself
			tested.value = base.$value;
		}
		return tested;
	};
};
const findValue: ValueFind = (_operator: IValueOperator, base: ValueOperatorBase, prop: string) => {
	if (prop !== 'value') {
		return NOT_FOUND;
	}
	if ((base.$actions == null || base.$actions.length === 0)) {
		// no action defined, get value directly, no way
		return (void 0);
	}
	// return value anyway, no matter success or failure
	return <T>(): T => createValueRetrieveFunc(base)<T>().value;
};
type SuccessCallback = (callback: <T>(value: T) => void) => ({ failure: (callback: <V>(value: V) => void) => void });
type FailureCallback = (callback: <V>(value: V) => void) => ({ success: (callback: <T>(value: T) => void) => void });
type SuccessOrFailureCallbackFind = (operator: IValueOperator, base: ValueOperatorBase, prop: string) => SuccessCallback | FailureCallback | undefined | symbol;
const findSuccessOrFailureCallback: SuccessOrFailureCallbackFind = (_operator: IValueOperator, base: ValueOperatorBase, prop: string) => {
	if (prop !== 'success' && prop !== 'failure') {
		return NOT_FOUND;
	}
	if ((base.$actions == null || base.$actions.length === 0)) {
		// no action defined, get value directly, no way
		return (void 0);
	}
	switch (prop) {
		case 'success':
			return (callback: <T>(value: T) => void) => {
				const tested = createValueRetrieveFunc(base)();
				if (tested.test) {
					callback(tested.value);
				}
				return {
					failure: (callback: <T>(value: T) => void): void => {
						if (!tested.test) {
							callback(tested.value);
						}
					}
				};
			};
		case 'failure':
			return (callback: <V>(value: V) => void) => {
				const tested = createValueRetrieveFunc(base)();
				if (!tested.test) {
					callback(tested.value);
				}
				return {
					success: (callback: <T>(value: T) => void): void => {
						if (tested.test) {
							callback(tested.value);
						}
					}
				};
			};
		default:
			throw new Error(`Unknown callback type: ${prop}.`);
	}
};
type OKFind = (operator: IValueOperator, base: ValueOperatorBase, prop: string) => (() => boolean) | symbol;
const findOK: OKFind = (operator: IValueOperator, base: ValueOperatorBase, prop: string) => {
	if (prop !== 'ok') {
		return NOT_FOUND;
	}
	if ((base.$actions == null || base.$actions.length === 0)) {
		// no action defined, get value directly, no way
		return (void 0);
	}
	return (): boolean => createValueRetrieveFunc(base)().test;
};
type PromiseFind = (operator: IValueOperator, base: ValueOperatorBase, prop: string) => (<T>() => Promise<T>) | symbol;
const findPromise: PromiseFind = (_operator: IValueOperator, base: ValueOperatorBase, prop: string) => {
	if (prop !== 'promise') {
		return NOT_FOUND;
	}
	if ((base.$actions == null || base.$actions.length === 0)) {
		// no action defined, get value directly, no way
		return (void 0);
	}
	return async <T>(): Promise<T> => {
		const tested = createValueRetrieveFunc(base)();
		if (tested.test) {
			return Promise.resolve(tested.value as T);
		} else {
			return Promise.reject(tested.value);
		}
	};
};
const getFromOperator = (operator: IValueOperator, base: ValueOperatorBase, prop: string) => {
	// set to false anyway
	base.$allowNoParamFuncCall = false;
	const finds = [
		findTester, findTransformer, findUseDefault,
		findValue, findSuccessOrFailureCallback, findOK, findPromise
	];
	for (const find of finds) {
		const result = find(operator, base, prop);
		if (result !== NOT_FOUND) {
			return result;
		}
	}
	// not found, return undefined
	return (void 0);
};
const createOperator = (base: ValueOperatorBase): IValueOperator => {
	const operatorBase = () => {
	};
	operatorBase.$base = base;
	const operator = new Proxy(operatorBase, {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		apply(base: typeof operatorBase, _thisArg: any, _argArray: any[]): any {
			return applyOperator(operator, base.$base);
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		get(base: any, p: string, _receiver: any): any {
			return getFromOperator(operator, base.$base, p);
		}
	});
	return operator;
};

export interface FinalValueRetriever {
	value: <T>() => T;
	success: <T>(value: T) => { failure: <V>(value: V) => void };
	failure: <V>(value: V) => { success: <T>(value: T) => void };
	ok: () => boolean;
	// parameter of reject original value
	promise: <T>() => Promise<T>;
}

export interface DefaultValueSetter extends FinalValueRetriever {
	// once, or ignored
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	orUseDefault: (defaultValue: any) => FinalValueRetriever;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	useDefault: (defaultValue: any) => FinalValueRetriever;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	withDefault: (defaultValue: any) => FinalValueRetriever;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	orElse: (defaultValue: any) => FinalValueRetriever;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	else: (defaultValue: any) => FinalValueRetriever;
}

type ActionType<T> = T extends RegisteredValueAction
	? (ValueActionsWithDefault & (() => ValueActionsWithDefault))
	: T extends RegisteredValueActionWithParams ? ((...args: Parameters<T['func']>) => ValueActionsWithDefault) : never;
export type ValueActions =
	& { [K in keyof typeof AllTesters]: ActionType<typeof AllTesters[K]> }
	& { [K in keyof typeof AllTransformers]: ActionType<typeof AllTransformers[K]> };
export type ValueActionsWithDefault = ValueActions & DefaultValueSetter;

export type IValueOperator = ValueActions;

export interface IValueOperatorBoostrap {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	of(value: any): IValueOperator;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	from(value: any): IValueOperator;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	with(value: any): IValueOperator;
}

@StaticImplements<IValueOperatorBoostrap>()
class ValueOperatorBootstrap {
	// noinspection JSUnusedLocalSymbols
	private constructor() {
		// avoid extend
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static of(value: any): IValueOperator {
		return createOperator({
			$value: value,
			$allowMoreAction: true, $allowUseDefault: false, $defaultUsed: false,
			$allowNoParamFuncCall: false
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static from(value: any): IValueOperator {
		return ValueOperatorBootstrap.of(value);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static with(value: any): IValueOperator {
		return ValueOperatorBootstrap.of(value);
	}
}

export const ValueOperator: IValueOperatorBoostrap = ValueOperatorBootstrap;
