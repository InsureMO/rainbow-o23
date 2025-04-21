import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import {all, create, MathJsInstance} from 'mathjs';
import {ZSTDDecoder} from 'zstddec';
import {Config, DateTime, ErrorCodes, Logger} from '../utils';
import {IStepHelpersUtils, PipelineStepErrorOptions, StepHelpersUtils} from './step-helpers-utils';

export class PipelineStepDateHelper {
	private readonly _dateTimeFormat: string;

	public constructor(config: Config) {
		this._dateTimeFormat = config.getString('format.datetime', 'YYYY-MM-DD HH:mm:ss');
	}

	public getDateTimeFormat(): string {
		return this._dateTimeFormat;
	}

	public now(): DateTime {
		return dayjs().format(this.getDateTimeFormat());
	}

	public get dayjs(): typeof dayjs {
		return dayjs;
	}
}

export type PipelineStepMathHelper = MathJsInstance;
export type PipelineStepDecimalHelper = (value: Decimal.Value) => Decimal;
export type PipelineStepZStdHelper = (buffer: Buffer) => Promise<string>;

export interface PipelineStepHelpers extends IStepHelpersUtils {
	$config?: Config;
	$logger?: Logger;
	$date: PipelineStepDateHelper;
	$math: PipelineStepMathHelper;
	$decimal: PipelineStepDecimalHelper;

	$zstd: PipelineStepZStdHelper;

	/** create an exposed uncatchable error*/
	$error: (options: PipelineStepErrorOptions) => never;
	$errorCodes: Readonly<Record<string, string>>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
}

const RegisteredHelpers = {helpers: {}};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerToStepHelpers = (helpers: Record<string, any>) => {
	RegisteredHelpers.helpers = helpers ?? {};
};

const mathjs = create(all, {number: 'BigNumber', precision: 32});
const removeTrailingZeros = (arr: Uint8Array): Uint8Array => {
	let i = arr.length;
	while (i > 0 && arr[i - 1] === 0) {
		i--;
	}
	return arr.slice(0, i);
};

export const createStepHelpers = (config: Config, logger: Logger): Readonly<PipelineStepHelpers> => {
	const helpers: PipelineStepHelpers = {
		...RegisteredHelpers.helpers,
		$config: config, $logger: logger,
		// date
		$date: new PipelineStepDateHelper(config),
		$math: mathjs,
		$decimal: (value: Decimal.Value) => new Decimal(value),
		$zstd: async (buffer: Buffer) => {
			const decoder = new ZSTDDecoder();
			await decoder.init();
			const decompressedArray = decoder.decode(buffer);
			return new TextDecoder().decode(removeTrailingZeros(decompressedArray));
		},
		// nano
		$nano: StepHelpersUtils.$nano, $ascii: StepHelpersUtils.$ascii,
		// errors
		$error: StepHelpersUtils.createExposedUncatchableError,
		$errorCodes: ErrorCodes,
		$errors: StepHelpersUtils.$errors,
		// file
		$file: StepHelpersUtils.$file,
		// semaphore
		$clearContextData: StepHelpersUtils.$clearContextData,
		// utilities
		isEmpty: StepHelpersUtils.isEmpty, isNotEmpty: StepHelpersUtils.isNotEmpty,
		isBlank: StepHelpersUtils.isBlank, isNotBlank: StepHelpersUtils.isNotBlank,
		trim: StepHelpersUtils.trim,
		touch: StepHelpersUtils.touch,
		noop: StepHelpersUtils.noop, asyncNoop: StepHelpersUtils.asyncNoop
	};
	return new Proxy(helpers, {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		set(_target: PipelineStepHelpers, _p: string | symbol, _value: any, _receiver: any): boolean {
			return false;
		}
	});
};