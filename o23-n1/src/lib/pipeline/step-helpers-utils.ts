import {customAlphabet, nanoid} from 'nanoid';
import {CatchableError, ERR_TRIM_NON_STRING, ExposedUncatchableError, UncatchableError} from '../utils';
import {PipelineStepHelpers} from './index';

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

export class StepHelpersUtils {
	private static asciiNanoId = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_', 32);
	private static OBJECT_PROTOTYPE = Object.prototype;

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
	public static createFile(options: PipelineStepFileOptions): PipelineStepFile {
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
		const proto = (typeof Ctor === 'function' && Ctor.prototype) || StepHelpersUtils.OBJECT_PROTOTYPE;

		return value === proto;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isLength(value: any): boolean {
		return typeof value === 'number' && value > -1 && value % 1 === 0 && value <= Number.MAX_SAFE_INTEGER;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isArrayLike(value: any): boolean {
		return value != null && typeof value !== 'function' && StepHelpersUtils.isLength(value.length);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isEmpty(value: any): boolean {
		if (value == null) {
			return true;
		}
		if (StepHelpersUtils.isArrayLike(value) && (Array.isArray(value) || typeof value === 'string')) {
			return value.length === 0;
		} else if (value instanceof Map) {
			return value.size === 0;
		} else if (value instanceof Set) {
			return value.size === 0;
		} else if (StepHelpersUtils.isPrototype(value)) {
			return Object.keys(value).length === 0;
		}

		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isNotEmpty(value: any): boolean {
		return !StepHelpersUtils.isEmpty(value);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isBlank(value: any): boolean {
		if (value == null) {
			return true;
		}
		if (typeof value !== 'string') {
			return false;
		}
		return value.trim().length === 0;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static isNotBlank(value: any): boolean {
		return !StepHelpersUtils.isBlank(value);
	}

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
}
