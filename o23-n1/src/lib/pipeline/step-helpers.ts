import dayjs from 'dayjs';
import {Config, DateTime, Logger} from '../utils';
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
	$errors: {
		catchable: (options: Omit<PipelineStepErrorOptions, 'status'>) => never;
		exposed: (options: PipelineStepErrorOptions) => never;
		uncatchable: (options: Omit<PipelineStepErrorOptions, 'status'>) => never;
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
}

export const createStepHelpers = (config: Config, logger: Logger): PipelineStepHelpers => {
	return {
		$config: config, $logger: logger,
		// date
		$date: new PipelineStepDateHelper(config),
		// nano
		$nano: StepHelpersUtils.$nano, $ascii: StepHelpersUtils.$ascii,
		// errors
		$error: StepHelpersUtils.createExposedUncatchableError, $errors: StepHelpersUtils.$errors,
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