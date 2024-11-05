import {PipelineStepData, PipelineStepHelpers, PipelineStepPayload} from '@rainbow-o23/n1';
import {PipelineStepSets, PipelineStepSetsContext, PipelineStepSetsOptions} from './step-sets';
import {ScriptFuncOrBody} from './types';
import {Utils} from './utils';

export type CloneDataFunc<In, InFragment, EachInFragment = InFragment> = ($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<EachInFragment>;

export interface ParallelPipelineStepSetsOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out, EachInFragment = InFragment>
	extends PipelineStepSetsOptions<In, Out, InFragment, OutFragment> {
	cloneData?: ScriptFuncOrBody<CloneDataFunc<In, InFragment, EachInFragment>>;
	race?: boolean;
}

/**
 * pipeline steps to execute sets of steps parallel.
 */
export class ParallelPipelineStepSets<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out, EachInFragment = InFragment>
	extends PipelineStepSets<In, Out, InFragment, OutFragment> {
	private readonly _cloneDataSnippet: ScriptFuncOrBody<CloneDataFunc<In, InFragment, EachInFragment>>;
	private readonly _cloneData: CloneDataFunc<In, InFragment, EachInFragment>;
	private readonly _race: boolean;

	public constructor(options: ParallelPipelineStepSetsOptions<In, Out, InFragment, OutFragment, EachInFragment>) {
		super(options);
		this._cloneDataSnippet = options.cloneData;
		this._cloneData = Utils.createAsyncFunction(this.getCloneDataSnippet(), {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			createDefault: () => async ($factor: InFragment, _$request: PipelineStepData<In>, _$helpers: PipelineStepHelpers, _$: PipelineStepHelpers): Promise<EachInFragment> => {
				return $factor as unknown as EachInFragment;
			},
			getVariableNames: () => ['$factor', '$request', ...this.getHelpersVariableNames()], //this.generateFromRequestVariableNames(),
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for clone data, snippet is [${this.getCloneDataSnippet()}].`);
				throw e;
			}
		});
		this._race = options.race ?? false;
	}

	public getCloneDataSnippet(): ScriptFuncOrBody<CloneDataFunc<In, InFragment, EachInFragment>> {
		return this._cloneDataSnippet;
	}

	/**
	 * returns true when only one needs to be retrieved
	 */
	public raceOne(): boolean {
		return this._race;
	}

	/**
	 * default get request content
	 */
	protected async cloneDataForEach($factor: InFragment, $request: PipelineStepData<In>): Promise<EachInFragment> {
		if ($factor == null) {
			return null;
		}
		const $helpers = this.getHelpers();
		return this._cloneData($factor, $request, $helpers, $helpers);
	}

	protected async doPerform(data: InFragment, request: PipelineStepData<In>): Promise<OutFragment> {
		return await this.performWithContext(
			request, async (request: PipelineStepData<In>, context: PipelineStepSetsContext): Promise<OutFragment> => {
				const {$context: {authorization, traceId} = {}} = request;
				const steps = await this.createSteps();
				const execute = () => {
					return steps.map(async step => {
						return await this.measurePerformance(traceId, 'STEP', step.constructor.name)
							.execute(async () => {
								const eachData = await this.cloneDataForEach(data, request);
								const eachRequest = {content: eachData, $context: {...context, authorization, traceId}};
								this.traceStepIn(traceId, step, request);
								const response = await step.perform(eachRequest);
								this.traceStepOut(traceId, step, response);
								// return
								return response;
							});
					});
				};
				if (this.raceOne()) {
					// race
					const response = await Promise.race(execute());
					return response.content as OutFragment;
				} else {
					// all
					const responses = await Promise.all(execute());
					return responses.map(response => response.content) as OutFragment;
				}
			});
	}
}
