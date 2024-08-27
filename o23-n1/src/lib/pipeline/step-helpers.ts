import dayjs from 'dayjs';
import {
	CatchableError,
	Config,
	DateTime,
	ErrorCodes,
	ExposedUncatchableError,
	Logger,
	UncatchableError
} from '../utils';
import {
	PIPELINE_STEP_RETURN_NULL,
	PipelineStepErrorOptions,
	PipelineStepFile,
	PipelineStepFileOptions,
	StepHelpersUtils
} from './step-helpers-utils';

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

export interface PipelineStepHelpers {
	$config?: Config;
	$logger?: Logger;
	$date: PipelineStepDateHelper;
	$nano: (size?: number) => string;
	$ascii: (size?: number) => string;
	/** create an exposed uncatchable error*/
	$error: (options: PipelineStepErrorOptions) => never;
	$errorCodes: Readonly<Record<string, string>>;
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isEmpty: (value: any) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isNotEmpty: (value: any) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isBlank: (value: any) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isNotBlank: (value: any) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	trim: (value: any) => string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
}

const RegisteredHelpers = {helpers: {}};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerToStepHelpers = (helpers: Record<string, any>) => {
	RegisteredHelpers.helpers = helpers ?? {};
};

export const createStepHelpers = (config: Config, logger: Logger): PipelineStepHelpers => {
	return {
		...RegisteredHelpers.helpers,
		$config: config, $logger: logger,
		// date
		$date: new PipelineStepDateHelper(config),
		// nano
		$nano: StepHelpersUtils.$nano, $ascii: StepHelpersUtils.$ascii,
		// errors
		$error: StepHelpersUtils.createExposedUncatchableError,
		$errorCodes: ErrorCodes,
		$errors: StepHelpersUtils.$errors,
		// file
		$file: StepHelpersUtils.createFile,
		// semaphore
		$clearContextData: StepHelpersUtils.$clearContextData,
		// utilities
		isEmpty: StepHelpersUtils.isEmpty, isNotEmpty: StepHelpersUtils.isNotEmpty,
		isBlank: StepHelpersUtils.isBlank, isNotBlank: StepHelpersUtils.isNotBlank,
		trim: StepHelpersUtils.trim
	};
};