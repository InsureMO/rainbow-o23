import {PipelineStepData, PipelineStepHelpers, PipelineStepPayload, UncatchableError} from '@rainbow-o23/n1';
import {ERR_PIPELINE_STEP_SNIPPET_NOT_EMPTY} from '../error-codes';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from './abstract-fragmentary-pipeline-step';
import {ScriptFuncOrBody} from './types';
import {Utils} from './utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PerformWithInFragment<InFragment, OutFragment> = ($factor: InFragment, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PerformWithoutInFragment<OutFragment> = ($helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment>;
export type PerformFunc<InFragment, OutFragment> =
	PerformWithInFragment<InFragment, OutFragment> | PerformWithoutInFragment<OutFragment>;

export interface SnippetPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	snippet: ScriptFuncOrBody<PerformFunc<InFragment, OutFragment>>;
}

/**
 * Please note this step use given snippet to create dynamic function,
 * which means THERE MIGHT BE SECURITY CONCERN.
 *
 * await is supported in snippet.
 */
export class SnippetPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _snippet: ScriptFuncOrBody<PerformFunc<InFragment, OutFragment>>;
	private readonly _func: PerformFunc<InFragment, OutFragment>;

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

	public getSnippet(): ScriptFuncOrBody<PerformFunc<InFragment, OutFragment>> {
		return this._snippet;
	}

	protected generateVariableNames(): Array<string> {
		return [
			this.isInFragmentIgnored() ? null : this.getInFragmentVariableName(),
			...this.getHelpersVariableNames()
		].filter(x => x != null);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: InFragment, _request: PipelineStepData<In>): Promise<OutFragment> {
		const $helpers = this.getHelpers();
		if (this.isInFragmentIgnored()) {
			return await (this._func as PerformWithoutInFragment<OutFragment>)($helpers, $helpers);
		} else {
			return await (this._func as PerformWithInFragment<InFragment, OutFragment>)(data, $helpers, $helpers);
		}
	}

	/**
	 * is request step data ignored to snippet function.
	 * default returns false
	 */
	protected isInFragmentIgnored(): boolean {
		return false;
	}

	/**
	 * override this method when want to use another variable name rather than "$factor"
	 */
	protected getInFragmentVariableName(): string {
		return '$factor';
	}
}
