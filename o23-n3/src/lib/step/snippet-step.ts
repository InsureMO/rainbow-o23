import {PipelineStepData, PipelineStepHelpers, PipelineStepPayload, UncatchableError} from '@rainbow-o23/n1';
import {ERR_PIPELINE_STEP_SNIPPET_NOT_EMPTY} from '../error-codes';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from './abstract-fragmentary-pipeline-step';
import {ScriptFuncOrBody} from './types';
import {Utils} from './utils';

export type PerformFunc<In, InFragment, OutFragment> =
	($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment>;

export interface SnippetPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	snippet: ScriptFuncOrBody<PerformFunc<In, InFragment, OutFragment>>;
}

/**
 * Please note this step use given snippet to create dynamic function,
 * which means THERE MIGHT BE SECURITY CONCERN.
 *
 * await is supported in snippet.
 */
export class SnippetPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _snippet: ScriptFuncOrBody<PerformFunc<In, InFragment, OutFragment>>;
	private readonly _func: PerformFunc<In, InFragment, OutFragment>;

	public constructor(options: SnippetPipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		this._snippet = options.snippet;
		this._func = Utils.createAsyncFunction(this.getSnippet(), {
			createDefault: (): never => {
				throw new UncatchableError(ERR_PIPELINE_STEP_SNIPPET_NOT_EMPTY, 'Cannot create perform func on empty snippet.');
			},
			getVariableNames: () => this.generateVariableNames(),
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for snippet[${this.getSnippet()}].`);
				throw e;
			}
		});
	}

	public getSnippet(): ScriptFuncOrBody<PerformFunc<In, InFragment, OutFragment>> {
		return this._snippet;
	}

	protected generateVariableNames(): Array<string> {
		return [this.getInFragmentVariableName(), this.getRequestVariableName(), ...this.getHelpersVariableNames()];
	}

	protected async doPerform(data: InFragment, request: PipelineStepData<In>): Promise<OutFragment> {
		const $helpers = this.getHelpers();
		return await this._func(data, request, $helpers, $helpers);
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
