import {Config, createConfig, createLogger, Logger, LoggerUtils} from '../utils';
import {PipelineOptions} from './pipeline';
import {PipelineStep, PipelineStepData} from './pipeline-step';
import {PIPELINE_STEP_RETURN_NULL} from './step-helpers-utils';

export interface PerformanceExecutionOptions {
	exec: 'PIPELINE' | 'STEP';
	traceId: string;
	start: bigint;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	print: (message: () => any) => void;
}

export type MeasuredFunction<T> = () => Promise<T>;

export class PerformanceExecution {
	public constructor(private readonly options: PerformanceExecutionOptions) {
	}

	public async execute<T>(measured: MeasuredFunction<T>): Promise<T> {
		try {
			return await measured();
		} finally {
			this.options.print(() => {
				return {
					exec: this.options.exec, ptraceId: this.options.traceId,
					spent: Number((process.hrtime.bigint() - this.options.start) / 1000000n)
				};
			});
		}
	}
}

export interface PipelineExecutionOptions {
	config?: Config;
	logger?: Logger;
}

export class AbstractPipelineExecution {
	protected readonly _config: Config;
	protected readonly _logger: Logger;
	protected readonly _performanceLogEnabled: boolean;
	protected readonly _debugLogEnabled: boolean;

	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	public constructor(options?: PipelineOptions) {
		const {config, logger} = options ?? {};
		this._logger = logger ?? createLogger();
		this._config = config ?? createConfig(this._logger);
		this._debugLogEnabled = this._config.getBoolean('pipeline.debug.log.enabled', false);
		this._performanceLogEnabled = this._debugLogEnabled || this._config.getBoolean('pipeline.performance.log.enabled', false);
	}

	public getConfig(): Config {
		return this._config;
	}

	public getLogger(): Logger {
		return this._logger;
	}

	protected isDebugLogEnabled(): boolean {
		return this._debugLogEnabled;
	}

	/**
	 * must check {@link isDebugLogEnabled} first
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected debug(message: any, ...optionsParams: Array<any>): void {
		if (this.isDebugLogEnabled()) {
			message = typeof message === 'function' ? message() : message;
			message = Array.isArray(message) ? message : [message];
			const [first, ...rest] = [...message, ...optionsParams.map(m => typeof m === 'function' ? m() : m)];
			this.getLogger().debug(first ?? '', ...rest, this.constructor.name);
		}
	}

	protected traceRequest<T>(traceId: string, data: T): T {
		this.debug(() => ({exec: 'PIPELINE', ptraceId: traceId, request: LoggerUtils.normalizeObject(data)}));
		return data;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected traceResponse<T>(traceId: string, data: T): T {
		this.debug(() => ({exec: 'PIPELINE', ptraceId: traceId, response: LoggerUtils.normalizeObject(data)}));
		return data;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected traceStepIn(traceId: string, step: PipelineStep, data: any) {
		this.debug(() => ({
			exec: 'STEP', name: step.getName(), ptraceId: traceId, in: LoggerUtils.normalizeObject(data)
		}));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected traceStepOut(traceId: string, step: PipelineStep, data: any) {
		this.debug(() => ({
			exec: 'STEP', name: step.getName(), ptraceId: traceId, out: LoggerUtils.normalizeObject(data)
		}));
	}

	protected isPerformanceLogEnabled(): boolean {
		return this._performanceLogEnabled;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected debugPerformance(message: () => any, context?: string): void {
		if (this.isPerformanceLogEnabled()) {
			this.getLogger().debug(message(), context || this.constructor.name);
		}
	}

	protected measurePerformance(traceId: string, exec: 'PIPELINE' | 'STEP', context?: string): PerformanceExecution {
		return new PerformanceExecution({
			exec, traceId, start: process.hrtime.bigint(),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			print: (message: () => any) => this.debugPerformance(message, context)
		});
	}

	/**
	 * check given response's content
	 * 1. is {@link PIPELINE_STEP_RETURN_NULL}, return directly, identify as clear
	 * 2. is null, continue using request
	 * 3. return directly
	 */
	protected returnOrContinueOrClear(request: PipelineStepData, response: PipelineStepData): PipelineStepData {
		if (response.content === PIPELINE_STEP_RETURN_NULL) {
			return response;
		} else if (response.content == null) {
			return request;
		} else {
			return response;
		}
	}
}