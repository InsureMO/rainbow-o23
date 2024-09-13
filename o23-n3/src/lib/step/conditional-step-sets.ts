import {
	PipelineStepBuilder,
	PipelineStepData,
	PipelineStepHelpers,
	PipelineStepPayload,
	UncatchableError,
	Undefinable
} from '@rainbow-o23/n1';
import {ERR_PIPELINE_STEP_CONDITIONAL_SNIPPET_NOT_EMPTY} from '../error-codes';
import {PipelineStepSets, PipelineStepSetsOptions} from './step-sets';
import {ScriptFuncOrBody} from './types';
import {Utils} from './utils';

export type ConditionCheckFunc<In, InFragment> = ($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<boolean>;

export interface ConditionalPipelineStepSetsOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends PipelineStepSetsOptions<In, Out, InFragment, OutFragment> {
	check: ScriptFuncOrBody<ConditionCheckFunc<In, InFragment>>;
	otherwiseSteps: Array<PipelineStepBuilder>;
}

/**ß
 * pipeline steps to execute internal step conditional
 */
export class ConditionalPipelineStepSets<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends PipelineStepSets<In, Out, InFragment, OutFragment> {
	private readonly _checkSnippet: ScriptFuncOrBody<ConditionCheckFunc<In, InFragment>>;
	private readonly _func: ConditionCheckFunc<In, InFragment>;
	private readonly _otherwiseStepBuilders: Undefinable<Array<PipelineStepBuilder>>;

	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	public constructor(options: ConditionalPipelineStepSetsOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		this._checkSnippet = options.check;
		this._func = Utils.createAsyncFunction(this.getCheckSnippet(), {
			createDefault: (): never => {
				throw new UncatchableError(ERR_PIPELINE_STEP_CONDITIONAL_SNIPPET_NOT_EMPTY, 'Cannot create perform func on empty conditional snippet.');
			},
			getVariableNames: () => this.generateVariableNames(),
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for conditional check, snippet is [${this.getCheckSnippet()}].`);
				throw e;
			}
		});
		this._otherwiseStepBuilders = options.otherwiseSteps;
	}

	public getCheckSnippet(): ScriptFuncOrBody<ConditionCheckFunc<In, InFragment>> {
		return this._checkSnippet;
	}

	protected getOtherwiseStepBuilders(): Undefinable<Array<PipelineStepBuilder>> {
		return this._otherwiseStepBuilders;
	}

	protected generateVariableNames(): Array<string> {
		return [this.getInFragmentVariableName(), this.getRequestVariableName(), ...this.getHelpersVariableNames()];
	}

	protected async check(data: InFragment, request: PipelineStepData<In>): Promise<boolean> {
		const $helpers = this.getHelpers();
		return await this._func(data, request, $helpers, $helpers);
	}

	public async perform(request: PipelineStepData<In>): Promise<PipelineStepData<Out>> {
		return await this.performAndCatch(request, async (fragment) => {
			const checked = await this.check(fragment, request);
			if (checked) {
				const result = await this.doPerform(request.content as unknown as InFragment, request);
				return await this.setToOutput(result, request);
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
