import {customAlphabet, nanoid} from 'nanoid';
import {CatchableError, ERR_TRIM_NON_STRING, ExposedUncatchableError, UncatchableError} from '../utils';
import {PipelineStepHelpers} from './step-helpers';
import {IValueOperator, ValueOperator} from './step-helpers-value-operator';
import {StaticImplements} from './types';
import {isArrayLike, isBlank, isEmpty, isLength, isNotBlank, isNotEmpty, OBJECT_PROTOTYPE} from './value-operators';

export interface PipelineStepErrorOptions {
	// exactly same as http status
	status: number;
	code: string;
	reason: string;
}

export interface PipelineStepFileOptions {
	name?: string;
	type?: string;
	content: string | Buffer;
}

export const PIPELINE_STEP_FILE_SYMBOL = Symbol();
export const PIPELINE_STEP_RETURN_NULL = Symbol();

export interface PipelineStepFile {
	$file: typeof PIPELINE_STEP_FILE_SYMBOL;
	name?: string;
	type?: string;
	content: Buffer;
}

export interface IStepHelpersUtils {
	$nano: (size?: number) => string;
	$ascii: (size?: number) => string;
	$errors: {
		catchable: (options: Omit<PipelineStepErrorOptions, 'status'>) => never;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		isCatchable: (e: any) => e is CatchableError;
		exposed: (options: PipelineStepErrorOptions) => never;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		isExposed: (e: any) => e is ExposedUncatchableError;
		uncatchable: (options: Omit<PipelineStepErrorOptions, 'status'>) => never;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		isUncatchable: (e: any) => e is UncatchableError;
	};
	/** create a file */
	$file: (options: PipelineStepFileOptions) => PipelineStepFile;
	$clearContextData: () => typeof PIPELINE_STEP_RETURN_NULL;
	/** @deprecated */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isEmpty: (value: any) => boolean;
	/** @deprecated */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isNotEmpty: (value: any) => boolean;
	/** @deprecated */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isBlank: (value: any) => boolean;
	/** @deprecated */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isNotBlank: (value: any) => boolean;
	/** @deprecated */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	trim: (value: any) => string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	touch: (value: any) => IValueOperator;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	noop: (value: any) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	asyncNoop: (value: any) => Promise<void>;
}

@StaticImplements<IStepHelpersUtils>()
export class StepHelpersUtils {
	private static asciiNanoId = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_', 32);

	// noinspection JSUnusedLocalSymbols
	private constructor() {
		// avoid extend
	}

	// nano id
	public static $nano(size?: number): string {
		return nanoid(size);
	}

	public static $ascii(size?: number): string {
		return StepHelpersUtils.asciiNanoId(size);
	}

	// error
	public static createCatchableError = (options: Omit<PipelineStepErrorOptions, 'status'>): never => {
		throw new CatchableError(options.code, options.reason);
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isCatchableError = (e: any): e is CatchableError => {
		return e != null && e instanceof CatchableError;
	};
	public static createExposedUncatchableError = (options: PipelineStepErrorOptions): never => {
		throw new ExposedUncatchableError(options.status, options.code, options.reason);
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isExposedUncatchableError = (e: any): e is ExposedUncatchableError => {
		return e != null && e instanceof ExposedUncatchableError;
	};
	public static createUncatchableError = (options: Omit<PipelineStepErrorOptions, 'status'>): never => {
		throw new UncatchableError(options.code, options.reason);
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isUncatchableError = (e: any): e is UncatchableError => {
		return e != null && e instanceof UncatchableError;
	};

	public static readonly $errors: PipelineStepHelpers['$errors'] = {
		catchable: StepHelpersUtils.createCatchableError,
		isCatchable: StepHelpersUtils.isCatchableError,
		exposed: StepHelpersUtils.createExposedUncatchableError,
		isExposed: StepHelpersUtils.isExposedUncatchableError,
		uncatchable: StepHelpersUtils.createUncatchableError,
		isUncatchable: StepHelpersUtils.isUncatchableError
	};

	// file
	public static $file(options: PipelineStepFileOptions): PipelineStepFile {
		return {
			$file: PIPELINE_STEP_FILE_SYMBOL,
			name: options.name, type: options.type,
			content: typeof options.content === 'string' ? Buffer.from(options.content) : options.content
		};
	}

	// semaphore
	public static $clearContextData(): typeof PIPELINE_STEP_RETURN_NULL {
		return PIPELINE_STEP_RETURN_NULL;
	}

	// utils
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isPrototype(value: any): boolean {
		const Ctor = value && value.constructor;
		const proto = (typeof Ctor === 'function' && Ctor.prototype) || OBJECT_PROTOTYPE;

		return value === proto;
	}

	/**
	 * return true when given value is an integral number, and greater than or equals 0
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isLength(value: any): boolean {
		return isLength(value);
	}

	/**
	 * return true when given value is not null, not undefined, not function and has length property.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isArrayLike(value: any): boolean {
		return isArrayLike(value);
	}

	/**
	 * return true when given value
	 * 1. is null or undefined
	 * 2. is array like, array or string, and length is 0
	 * 3. is map, and size is 0
	 * 4. is set, and size is 0
	 * 5. is object, and has no own enumerable property
	 * @deprecated use {@link touch} instead
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isEmpty(value: any): boolean {
		return isEmpty(value).test;
	}

	/**
	 * return true when given value is not {@link isEmpty}
	 * @deprecated use {@link touch} instead
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isNotEmpty(value: any): boolean {
		return isNotEmpty(value).test;
	}

	/**
	 * return true when given value is null, undefined or blank string.
	 * @deprecated use {@link touch} instead
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isBlank(value: any): boolean {
		return isBlank(value).test;
	}

	/**
	 * return true when given value is not {@link isBlank}
	 * @deprecated use {@link touch} instead
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isNotBlank(value: any): boolean {
		return isNotBlank(value).test;
	}

	/**
	 * return trimmed string, or empty string when given value is null or undefined.
	 * or throw exception when given value is not null, not undefined, and not a string
	 * @deprecated use {@link touch} instead
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static trim(value: any): string {
		if (value == null) {
			return '';
		}
		if (typeof value === 'string') {
			return value.trim();
		}
		throw new UncatchableError(ERR_TRIM_NON_STRING, `Cannot apply trim to non-string object[type=${typeof value}, value=${value}].`);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static touch(value: any): IValueOperator {
		return ValueOperator.from(value);
	}

	/**
	 * do nothing
	 */
	public static noop(): void {
		// do nothing
	}

	/**
	 * do nothing
	 */
	public static async asyncNoop(): Promise<void> {
		// do nothing
	}
}
