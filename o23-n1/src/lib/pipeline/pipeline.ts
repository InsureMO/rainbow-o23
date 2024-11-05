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
}

export interface PipelineRequest<C = PipelineRequestPayload> {
	payload: C;
	authorization?: PipelineRequestAuthorization;
	traceId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PipelineResponsePayload = any;

export interface PipelineResponse<C = PipelineResponsePayload> {
	payload: C;
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

// eslint-disable-next-line @typescript-eslint/ban-types
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
		return {content: request.payload as unknown as FirstStepIn};
	}

	public convertPipelineDataToResponse<LastStepOut, O>(result: PipelineStepData<LastStepOut>): PipelineResponse<O> {
		return {payload: result.content as unknown as O};
	}

	protected createTraceId(request: PipelineRequest<In>): string {
		const {traceId} = request;
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
		const traceId = this.createTraceId(request);
		const authorization = request.authorization;
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
								...request, $context: {...request.$context, authorization, traceId}
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
