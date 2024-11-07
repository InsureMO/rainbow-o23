import {
	PipelineStep,
	PipelineStepBuilder,
	PipelineStepData,
	PipelineStepOptions,
	PipelineStepPayload
} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from './abstract-fragmentary-pipeline-step';
import {Utils} from './utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PipelineStepSetsContext {
}

export interface PipelineStepSetsOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	steps: Array<PipelineStepBuilder>;
}

/**
 * pipeline steps to execute sets of steps. it will build a context for sub steps.
 */
export class PipelineStepSets<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _stepBuilders: Array<PipelineStepBuilder>;

	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	public constructor(options: PipelineStepSetsOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		this._stepBuilders = options.steps;
	}

	protected getStepBuilders(): Array<PipelineStepBuilder> {
		return this._stepBuilders ?? [];
	}

	protected buildStepOptions(): Pick<PipelineStepOptions, 'config' | 'logger'> {
		return {config: this.getConfig(), logger: this.getLogger()};
	}

	/**
	 * create all steps
	 */
	public async createSteps(): Promise<Array<PipelineStep>> {
		const options = this.buildStepOptions();
		return await Promise.all(this.getStepBuilders().map(async builder => await builder.create(options)));
	}

	protected inheritContext(request: PipelineStepData<In>): PipelineStepSetsContext {
		const context = request.$context;
		if (context == null) {
			return {};
		} else {
			const {authorization, traceId, ...rest} = context;
			return {authorization, traceId, ...Utils.clone(rest)};
		}
	}

	/**
	 * default do nothing, return given inherited context directly
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async attachMineToInternalContext(inheritedContext: PipelineStepSetsContext, _request: PipelineStepData<In>): Promise<PipelineStepSetsContext> {
		return inheritedContext;
	}

	protected async createInternalContext<Ctx extends PipelineStepSetsContext>(request: PipelineStepData<In>): Promise<Ctx> {
		return await this.attachMineToInternalContext(this.inheritContext(request), request) as Ctx;
	}

	/**
	 * to create an internal context which should be mounted on the step data
	 */
	protected async performWithContext(
		request: PipelineStepData<In>,
		run: (request: PipelineStepData<In>, context: PipelineStepSetsContext) => Promise<OutFragment>): Promise<OutFragment> {
		const context = await this.createInternalContext(request);
		return await run(request, context);
	}

	protected async doPerform(data: InFragment, request: PipelineStepData<In>): Promise<OutFragment> {
		return await this.performWithContext(
			request, async (request: PipelineStepData<In>, context: PipelineStepSetsContext): Promise<OutFragment> => {
				const {$context: {authorization, traceId} = {}} = request;
				const steps = await this.createSteps();
				const response = await steps.reduce(async (promise, step) => {
					const request = await promise;
					return await this.measurePerformance(traceId, 'STEP', step.constructor.name)
						.execute(async () => {
							this.traceStepIn(traceId, step, request);
							const response = await step.perform({
								...request, $context: {...context, authorization, traceId}
							});
							this.traceStepOut(traceId, step, response);
							// if no response returned, keep using request for next
							return this.returnOrContinueOrClear(request, response);
						});
					// build request for first step
				}, Promise.resolve({content: data, $context: request.$context}));
				return response.content;
			});
	}
}
