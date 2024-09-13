import {
	PipelineStepBuilder,
	PipelineStepData,
	PipelineStepOptions,
	PipelineStepPayload,
	UncatchableError,
	Undefinable
} from '@rainbow-o23/n1';
import {ERR_PIPELINE_STEP_CONDITIONAL_SNIPPET_NOT_EMPTY, ERR_PIPELINE_STEP_METHOD_NOT_SUPPORTED} from '../error-codes';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from './abstract-fragmentary-pipeline-step';
import {ConditionCheckFunc} from './conditional-step-sets';
import {PipelineStepSets} from './step-sets';
import {ScriptFuncOrBody} from './types';
import {Utils} from './utils';

export interface RoutesConditionalStepOptions<In, InFragment> {
	check: ScriptFuncOrBody<ConditionCheckFunc<In, InFragment>>,
	steps?: Array<PipelineStepBuilder>;
}

export interface RoutesPipelineStepSetsOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	conditionalSteps: Array<RoutesConditionalStepOptions<In, InFragment>>;
	otherwiseSteps?: Array<PipelineStepBuilder>;
}

export interface RoutesConditionalStep<In, InFragment> {
	check: ConditionCheckFunc<In, InFragment>;
	steps: Array<PipelineStepBuilder>;
}

/**
 * pipeline steps to execute routes of steps, only one route will be executed
 */
export class RoutesPipelineStepSets<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _conditionalStepBuilders: Array<RoutesConditionalStep<In, InFragment>>;
	private readonly _otherwiseStepBuilders: Undefinable<Array<PipelineStepBuilder>>;

	constructor(options: RoutesPipelineStepSetsOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		this._conditionalStepBuilders = (options.conditionalSteps || []).map(({check, steps}, stepIndex) => {
			return {
				check: Utils.createAsyncFunction(check, {
					createDefault: (): never => {
						throw new UncatchableError(ERR_PIPELINE_STEP_CONDITIONAL_SNIPPET_NOT_EMPTY, 'Cannot create perform func on empty conditional snippet.');
					},
					getVariableNames: () => this.generateVariableNames(),
					error: (e: Error) => {
						this.getLogger().error(`Failed on create function for route check[${stepIndex + 1}], snippet is [${check}].`);
						throw e;
					}
				}),
				steps
			};
		});
		this._otherwiseStepBuilders = options.otherwiseSteps;
	}

	protected getConditionalStepBuilders(): Array<RoutesConditionalStep<In, InFragment>> {
		return this._conditionalStepBuilders;
	}

	protected getOtherwiseStepBuilders(): Undefinable<Array<PipelineStepBuilder>> {
		return this._otherwiseStepBuilders;
	}

	protected buildStepOptions(): Pick<PipelineStepOptions, 'config' | 'logger'> {
		return {config: this.getConfig(), logger: this.getLogger()};
	}

	protected generateVariableNames(): Array<string> {
		return [this.getInFragmentVariableName(), this.getRequestVariableName(), ...this.getHelpersVariableNames()];
	}

	protected async check(func: ConditionCheckFunc<In, InFragment>, data: InFragment, request: PipelineStepData<In>): Promise<boolean> {
		const $helpers = this.getHelpers();
		return await func(data, request, $helpers, $helpers);
	}

	/**
	 * not used, throw error
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: InFragment, request: PipelineStepData<In>): Promise<OutFragment> {
		throw new UncatchableError(ERR_PIPELINE_STEP_METHOD_NOT_SUPPORTED, `Method[${RoutesPipelineStepSets.name}.doPerform] not supported.`);
	}

	public async perform(request: PipelineStepData<In>): Promise<PipelineStepData<Out>> {
		return await this.performAndCatch(request, async (fragment) => {
			const conditionalStepBuilders = this.getConditionalStepBuilders();
			if (conditionalStepBuilders != null && conditionalStepBuilders.length !== 0) {
				for (const conditionalStepBuilder of conditionalStepBuilders) {
					const {check, steps} = conditionalStepBuilder;
					const checked = await this.check(check, fragment, request);
					if (checked) {
						const sets = new PipelineStepSets({
							...this.buildStepOptions(), name: this.getName(), steps
						});
						const result = await sets.perform(request);
						return await this.setToOutput(result.content, request);
					}
				}
			}
			// noinspection DuplicatedCode
			const otherwiseStepBuilders = this.getOtherwiseStepBuilders();
			if (otherwiseStepBuilders != null) {
				// no conditional step performed
				const sets = new PipelineStepSets({
					...this.buildStepOptions(), name: this.getName(), steps: otherwiseStepBuilders
				});
				const result = await sets.perform(request);
				return await this.setToOutput(result.content, request);
			} else {
				// otherwise route not declared
				return request as unknown as PipelineStepData<Out>;
			}
		});
	}

	/**
	 * override this method when want to use another variable name rather than "$factor"
	 */
	protected getInFragmentVariableName(): string {
		return '$factor';
	}

	protected getRequestVariableName(): string {
		return '$request';
	}
}
