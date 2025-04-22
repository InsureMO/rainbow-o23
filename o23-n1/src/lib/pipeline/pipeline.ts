import {nanoid} from 'nanoid';
import {Config, Logger} from '../utils';
import {AbstractPipelineExecution, PipelineExecutionOptions} from './pipeline-execution';
import {
	DefaultPipelineStepBuilder,
	PipelineStep,
	PipelineStepBuilder,
	PipelineStepData,
	PipelineStepOptions,
	PipelineStepType
} from './pipeline-step';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PipelineRequestPayload = any;

export interface PipelineRequestAuthorizationRole {
	code?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PipelineRequestAuthorization<A = any> {
	readonly authorized: boolean;
	/** undefined when authorized is false */
	readonly authentication?: A;
	/** empty array when authorized is false */
	readonly roles: Array<PipelineRequestAuthorizationRole>;
	/** headers should be added to response */
	readonly headers?: Record<string, string>;
}

export interface PipelineExecutionContext {
	authorization?: PipelineRequestAuthorization;
	traceId?: string;
	/*
	 * typically, when calling a remote service, and which is from some microservices group,
	 * there might be some trace ids brought in.
	 * therefore, these trace ids should be collected and put into pipeline context.
	 * the key is tracing group, and value is trace id of this tracing group.
	 */
	$traceIds?: Record<string, string>;
	// other context values
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
}

export interface PipelineRequest<C = PipelineRequestPayload> {
	payload: C;
	$context?: PipelineExecutionContext;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PipelineResponsePayload = any;

export interface PipelineResponse<C = PipelineResponsePayload> {
	payload: C;
	$context?: PipelineExecutionContext;
}

export type PipelineCode = string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Pipeline<In = any, Out = any> {
	/**
	 * code should be unique globally
	 */
	getCode(): PipelineCode;

	/**
	 * perform pipeline
	 */
	perform(request: PipelineRequest<In>): Promise<PipelineResponse<Out>>;
}

export interface PipelineOptions extends PipelineExecutionOptions {
	config?: Config;
	logger?: Logger;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export interface PipelineType<P = Pipeline> extends Function {
	new(options?: PipelineOptions): P;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class AbstractPipeline<In = any, Out = any> extends AbstractPipelineExecution implements Pipeline<In, Out> {
	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	public constructor(options?: PipelineOptions) {
		super(options);
	}

	public abstract getCode(): PipelineCode;

	/**
	 * get type of steps
	 */
	protected abstract getStepBuilders(): Array<PipelineStepBuilder>;

	protected buildStepOptions(): Pick<PipelineStepOptions, 'config' | 'logger'> {
		return {config: this._config, logger: this._logger};
	}

	/**
	 * create all steps
	 */
	public async createSteps(): Promise<Array<PipelineStep>> {
		const options = this.buildStepOptions();
		return await Promise.all(this.getStepBuilders().map(async builder => await builder.create(options)));
	}

	public convertRequestToPipelineData<I, FirstStepIn>(request: PipelineRequest<I>): PipelineStepData<FirstStepIn> {
		return {
			content: request.payload as unknown as FirstStepIn,
			$context: request.$context ?? {}
		};
	}

	public convertPipelineDataToResponse<LastStepOut, O>(result: PipelineStepData<LastStepOut>): PipelineResponse<O> {
		return {
			payload: result.content as unknown as O,
			$context: result.$context
		};
	}

	protected createTraceId(request: PipelineRequest<In>): string {
		const {traceId} = request.$context ?? {};
		if (traceId == null || traceId.trim().length === 0) {
			return nanoid(16);
		} else {
			return traceId;
		}
	}

	/**
	 * perform pipeline.
	 * - first step use request as input,
	 * - other steps use the result of previous step,
	 * - use last step's result as response.
	 */
	public async perform(request: PipelineRequest<In>): Promise<PipelineResponse<Out>> {
		// guard context
		request.$context = request.$context ?? {};
		const traceId = this.createTraceId(request);
		const response = await this.measurePerformance(traceId, 'PIPELINE')
			.execute(async () => {
				this.traceRequest(traceId, request);
				const steps = await this.createSteps();
				const data = await steps.reduce(async (promise, step) => {
					const request = await promise;
					return await this.measurePerformance(traceId, 'STEP', step.constructor.name)
						.execute(async () => {
							this.traceStepIn(traceId, step, request);
							const response = await step.perform({
								...request, $context: request.$context
							});
							this.traceStepOut(traceId, step, response);
							// if no response returned, keep using request for next
							return this.returnOrContinueOrClear(request, response);
						});
				}, Promise.resolve(this.convertRequestToPipelineData(request)));
				return this.traceResponse(traceId, this.convertPipelineDataToResponse(data));
			});
		return response as PipelineResponse<Out>;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class AbstractStaticPipeline<In = any, Out = any> extends AbstractPipeline<In, Out> {
	protected abstract getStepTypes(): Array<PipelineStepType>;

	protected getStepBuilders(): Array<PipelineStepBuilder> {
		return this.getStepTypes().map(type => new DefaultPipelineStepBuilder(type));
	}
}

export interface PipelineBuilder {
	create(options?: PipelineOptions): Promise<Pipeline>;
}

// noinspection JSUnusedGlobalSymbols
export class DefaultPipelineBuilder implements PipelineBuilder {
	public constructor(protected readonly pipeline: PipelineType) {
	}

	public async create(options?: PipelineOptions): Promise<Pipeline> {
		return new this.pipeline(options);
	}
}
