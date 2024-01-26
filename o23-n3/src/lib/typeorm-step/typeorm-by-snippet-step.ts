import {PipelineStepData, PipelineStepHelpers, PipelineStepPayload, UncatchableError} from '@rainbow-o23/n1';
import {QueryRunner} from 'typeorm';
import {ERR_TYPEORM_STEP_SNIPPET_NOT_EMPTY} from '../error-codes';
import {ScriptFuncOrBody, Utils} from '../step';
import {AbstractTypeOrmPipelineStep, TypeOrmPipelineStepOptions} from './abstract-typeorm-step';

export type TypeOrmPerformFunc<In, InFragment, OutFragment> = ($runner: QueryRunner, $factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment>;

export interface TypeOrmBySnippetPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends TypeOrmPipelineStepOptions<In, Out, InFragment, OutFragment> {
	snippet: ScriptFuncOrBody<TypeOrmPerformFunc<In, InFragment, OutFragment>>;
}

/**
 * ignore when values is not present or values is an empty array
 */
export class TypeOrmBySnippetPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractTypeOrmPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _snippet: ScriptFuncOrBody<TypeOrmPerformFunc<In, InFragment, OutFragment>>;
	private readonly _func: TypeOrmPerformFunc<In, InFragment, OutFragment>;

	public constructor(options: TypeOrmBySnippetPipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		this._snippet = options.snippet;
		this._func = Utils.createAsyncFunction(this.getSnippet(), {
			createDefault: () => {
				throw new UncatchableError(ERR_TYPEORM_STEP_SNIPPET_NOT_EMPTY, 'Cannot create perform func on empty snippet.');
			},
			getVariableNames: () => this.generateVariableNames(),
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for typeorm snippet, snippet is [${this.getSnippet()}].`);
				throw e;
			}
		});
	}

	public getSnippet(): ScriptFuncOrBody<TypeOrmPerformFunc<In, InFragment, OutFragment>> {
		return this._snippet;
	}

	protected generateVariableNames(): Array<string> {
		return [
			this.getRunnerVariableName(),
			this.getInFragmentVariableName(),
			this.getRequestVariableName(),
			...this.getHelpersVariableNames()
		];
	}

	protected async doPerform(basis: InFragment, request: PipelineStepData<In>): Promise<OutFragment> {
		return await this.autoTrans<OutFragment>(async (runner) => {
			const $helpers = this.getHelpers();
			return await this._func(runner, basis, request, $helpers, $helpers);
		}, request);
	}

	protected getRunnerVariableName(): string {
		return '$runner';
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
