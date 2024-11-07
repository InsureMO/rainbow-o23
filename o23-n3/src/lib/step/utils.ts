import {Nullable, UncatchableError, Undefinable} from '@rainbow-o23/n1';
import ts, {JsxEmit, ModuleKind, ModuleResolutionKind, ScriptTarget} from 'typescript';
import {
	ERR_PIPELINE_SNIPPET_CANNOT_USE_EVAL,
	ERR_PIPELINE_SNIPPET_CANNOT_USE_FUNCTION,
	ERR_PIPELINE_SNIPPET_CANNOT_USE_GLOBAL,
	ERR_PIPELINE_SNIPPET_CANNOT_USE_PROCESS
} from '../error-codes';
import {ScriptFuncOrBody} from './types';

// get async function constructor, to create the dynamic function
const AsyncFunction = Object.getPrototypeOf(async function () {
	// nothing, since this purpose is get the constructor, body is not concerned
}).constructor;

const createGlobalProxy = (ex: () => never) => {
	return new Proxy({}, {
		get() {
			ex();
		},
		set() {
			ex();
		},
		apply() {
			ex();
		}
	});
};
const AvoidNames = ['global', 'process', 'eval', 'Function'];
const AvoidProxyObjects = [
	createGlobalProxy(() => {
		throw new UncatchableError(ERR_PIPELINE_SNIPPET_CANNOT_USE_GLOBAL, 'Cannot use global in dynamic snippet.');
	}),
	createGlobalProxy(() => {
		throw new UncatchableError(ERR_PIPELINE_SNIPPET_CANNOT_USE_PROCESS, 'Cannot use process in dynamic snippet.');
	}),
	createGlobalProxy(() => {
		throw new UncatchableError(ERR_PIPELINE_SNIPPET_CANNOT_USE_EVAL, 'Cannot use eval in dynamic snippet.');
	}),
	createGlobalProxy(() => {
		throw new UncatchableError(ERR_PIPELINE_SNIPPET_CANNOT_USE_FUNCTION, 'Cannot use Function in dynamic snippet.');
	})
];

export class Utils {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	public static createFunction<F = Function>(snippet: ScriptFuncOrBody<F>, creators: {
		createDefault: () => Undefinable<F> | never;
		getVariableNames: () => Array<string>;
		async?: true;
		error: (e: Error) => never;
	}): F {
		try {
			if (snippet == null || (typeof snippet === 'string' && snippet.trim().length === 0)) {
				return creators.createDefault();
			} else if (typeof snippet === 'string') {
				// if (snippet.includes('global')) {
				// 	// noinspection ExceptionCaughtLocallyJS
				// 	throw new UncatchableError(ERR_PIPELINE_SNIPPET_CANNOT_USE_GLOBAL, '"global" is not allowed in dynamic snippet.');
				// }
				// transpiled by typescript
				const transpiled = ts.transpileModule(snippet, {
					compilerOptions: {
						target: ScriptTarget.ES2022,
						jsx: JsxEmit.None,   // no jsx
						strict: false,
						noEmitOnError: true, // ignore errors
						esModuleInterop: true,
						module: ModuleKind.ES2022,
						suppressOutputPathCheck: false,
						skipLibCheck: true,
						skipDefaultLibCheck: true,
						moduleResolution: ModuleResolutionKind.Node16 // default use node 16
					}
				});
				snippet = transpiled.outputText;
				// build function
				const variableNames = creators.getVariableNames() ?? [];
				if (creators.async) {
					const func = new AsyncFunction(...variableNames, ...AvoidNames, snippet);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return (async (...args: Array<any>) => {
						const availableArgs = [...args];
						availableArgs.length = variableNames.length;
						// Pass specified length of parameters,
						// along with an additional global object to prevent internal access to the actual global object.
						return await func(...availableArgs, ...AvoidProxyObjects);
					}) as F;
				} else {
					const func = new Function(...variableNames, ...AvoidNames, snippet);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return ((...args: Array<any>) => {
						const availableArgs = [...args];
						availableArgs.length = variableNames.length;
						// Pass specified length of parameters,
						// along with an additional global object to prevent internal access to the actual global object.
						return func(...availableArgs, ...AvoidProxyObjects);
					}) as F;
				}
			} else {
				return snippet;
			}
		} catch (e) {
			creators.error(e);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	public static createSyncFunction<F = Function>(snippet: ScriptFuncOrBody<F>, creators: {
		createDefault: () => Undefinable<F> | never;
		getVariableNames: () => Array<string>;
		error: (e: Error) => never;
	}): F {
		return Utils.createFunction(snippet, {...creators});
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	public static createAsyncFunction<F = Function>(snippet: ScriptFuncOrBody<F>, creators: {
		createDefault: () => Undefinable<F> | never;
		getVariableNames: () => Array<string>;
		error: (e: Error) => never;
	}): F {
		return Utils.createFunction(snippet, {...creators, async: true});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isPrimitive(value: any): value is string | number | boolean | symbol | bigint {
		return value != null && ['string', 'number', 'boolean', 'symbol', 'bigint'].includes(typeof value);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static getValue<V>(model: any, propertyPath: string): Nullable<V> {
		if (model == null) {
			return null;
		}
		if (propertyPath == null || propertyPath.trim() === '.' || propertyPath.trim() === '.') {
			// returns parent itself if property points me
			return model;
		}

		const segments = propertyPath.split('.');

		return segments.reduce((fromModel, segment) => {
			if (fromModel == null) {
				// cannot know what the accurate type of parent, return null anyway.
				return null;
			}
			if (Utils.isPrimitive(fromModel)) {
				// cannot get property from primitive value, raise exception here
				return null;
			}

			if (Array.isArray(fromModel)) {
				// get values from every item and merge into one array
				return fromModel.map(item => {
					if (item == null) {
						return null;
					}
					if (Utils.isPrimitive(item)) {
						return null;
					}
					return item[segment];
				});
			} else {
				// get value from model directly
				return fromModel[segment];
			}
		}, model);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static clone(obj: any): any {
		if (obj == null) {
			return obj;
		} else if (Array.isArray(obj)) {
			return obj.map(item => Utils.clone(item));
		} else if (typeof obj === 'object') {
			return Object.keys(obj).reduce((cloned: object, key: string) => {
				cloned[key] = Utils.clone(obj[key]);
				return cloned;
			}, {});
		} else {
			return obj;
		}
	}
}