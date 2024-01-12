import {
	AbstractPipelineStep,
	CatchableError,
	ERR_UNKNOWN,
	ExposedUncatchableError,
	PipelineStepBuilder,
	PipelineStepData,
	PipelineStepHelpers,
	PipelineStepOptions,
	PipelineStepPayload,
	UncatchableError
} from '@rainbow-o23/n1';
import {PipelineStepSetsContext} from './step-sets';
import {
	HandleAnyError,
	HandleCatchableError,
	HandleExposedUncatchableError,
	HandleUncatchableError,
	ScriptFuncOrBody
} from './types';
import {Utils} from './utils';

export interface FragmentaryPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends PipelineStepOptions {
	fromRequest?: ScriptFuncOrBody<GetInFragmentFromRequestFunc<In, InFragment>>;
	toResponse?: ScriptFuncOrBody<SetOutFragmentToResponseFunc<In, Out, OutFragment>>;
	/**
	 * false: return OutFragment as Out directly,
	 * true: merge In and OutFragment as an object, make sure the In and OutFragment can be unboxed.
	 * and if there is duplicated keys, value from OutFragment has high priority, value with same key of In will be replaced.
	 * string: merge OutFragment into In, use given string as property name.
	 */
	mergeRequest?: boolean | string;
	errorHandles?: {
		catchable?: ScriptFuncOrBody<HandleCatchableError<In, InFragment, OutFragment>> | Array<PipelineStepBuilder>;
		uncatchable?: ScriptFuncOrBody<HandleUncatchableError<In, InFragment, OutFragment>> | Array<PipelineStepBuilder>;
		exposed?: ScriptFuncOrBody<HandleExposedUncatchableError<In, InFragment, OutFragment>> | Array<PipelineStepBuilder>;
		any?: ScriptFuncOrBody<HandleAnyError<In, InFragment, OutFragment>> | Array<PipelineStepBuilder>;
	};
}

/**
 * parameter names could be change {@link AbstractFragmentaryPipelineStep#generateFromRequestVariableNames}
 */
export type GetInFragmentFromRequestFunc<In, InFragment> = ($factor: In, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => InFragment;
/**
 * parameter names could be change {@link AbstractFragmentaryPipelineStep#generateToResponseVariableNames}
 */
export type SetOutFragmentToResponseFunc<In, Out, OutFragment> = ($result: OutFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Out;

/**
 * deal with fragment data from request, and put result into response.
 * default get content from request, and put result as response content.
 */
export abstract class AbstractFragmentaryPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractPipelineStep<In, Out> {
	private readonly _fromRequestSnippet: ScriptFuncOrBody<GetInFragmentFromRequestFunc<In, InFragment>>;
	private readonly _toResponseSnippet: ScriptFuncOrBody<SetOutFragmentToResponseFunc<In, Out, OutFragment>>;
	private readonly _mergeRequest: boolean | string;
	private readonly _fromRequestFunc: GetInFragmentFromRequestFunc<In, InFragment>;
	private readonly _toResponseFunc: SetOutFragmentToResponseFunc<In, Out, OutFragment>;
	private readonly _errorsSnippets?: {
		catchable?: ScriptFuncOrBody<HandleCatchableError<In, InFragment, OutFragment>> | Array<PipelineStepBuilder>;
		uncatchable?: ScriptFuncOrBody<HandleUncatchableError<In, InFragment, OutFragment>> | Array<PipelineStepBuilder>;
		exposed?: ScriptFuncOrBody<HandleExposedUncatchableError<In, InFragment, OutFragment>> | Array<PipelineStepBuilder>;
		any?: ScriptFuncOrBody<HandleAnyError<In, InFragment, OutFragment>> | Array<PipelineStepBuilder>;
	};
	private readonly _errorsFuncs: {
		catchable?: HandleCatchableError<In, InFragment, OutFragment> | Array<PipelineStepBuilder>;
		uncatchable?: HandleUncatchableError<In, InFragment, OutFragment> | Array<PipelineStepBuilder>;
		exposed?: HandleExposedUncatchableError<In, InFragment, OutFragment> | Array<PipelineStepBuilder>;
		any?: HandleAnyError<In, InFragment, OutFragment> | Array<PipelineStepBuilder>;
	};

	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	public constructor(options: FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		this._fromRequestSnippet = options.fromRequest;
		this._toResponseSnippet = options.toResponse;
		if (typeof options.mergeRequest === 'string') {
			this._mergeRequest = options.mergeRequest.trim();
			if (this._mergeRequest === '') {
				this._mergeRequest = false;
			}
		} else {
			this._mergeRequest = options.mergeRequest ?? false;
		}
		this._fromRequestFunc = Utils.createSyncFunction(this.getFromRequestSnippet(), {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			createDefault: () => ($factor: In, _$request: PipelineStepData<In>, _$helpers: PipelineStepHelpers, _$: PipelineStepHelpers): InFragment => $factor as unknown as InFragment,
			getVariableNames: () => this.generateFromRequestVariableNames(),
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for from request transformer, snippet is [${this.getFromRequestSnippet()}].`);
				throw e;
			}
		});
		this._toResponseFunc = this.createToResponseFunc();
		this._errorsSnippets = options.errorHandles;
		this._errorsFuncs = {
			catchable: (this._errorsSnippets?.catchable != null && Array.isArray(this._errorsSnippets?.catchable))
				? this._errorsSnippets?.catchable
				: Utils.createAsyncFunction(this._errorsSnippets?.catchable, {
					createDefault: () => (void 0),
					getVariableNames: () => ['$options', ...this.getHelpersVariableNames()],
					error: (e: Error) => {
						this.getLogger().error(`Failed on create function for catchable error handler, snippet is [${this._errorsSnippets?.catchable}].`);
						throw e;
					}
				}),
			uncatchable: (this._errorsSnippets?.uncatchable != null && Array.isArray(this._errorsSnippets?.uncatchable))
				? this._errorsSnippets?.uncatchable
				: Utils.createAsyncFunction(this._errorsSnippets?.uncatchable, {
					createDefault: () => (void 0),
					getVariableNames: () => ['$options', ...this.getHelpersVariableNames()],
					error: (e: Error) => {
						this.getLogger().error(`Failed on create function for uncatchable error handler, snippet is [${this._errorsSnippets?.uncatchable}].`);
						throw e;
					}
				}),
			exposed: (this._errorsSnippets?.exposed != null && Array.isArray(this._errorsSnippets?.exposed))
				? this._errorsSnippets?.exposed
				: Utils.createAsyncFunction(this._errorsSnippets?.exposed, {
					createDefault: () => (void 0),
					getVariableNames: () => ['$options', ...this.getHelpersVariableNames()],
					error: (e: Error) => {
						this.getLogger().error(`Failed on create function for exposed uncatchable error handler, snippet is [${this._errorsSnippets?.exposed}].`);
						throw e;
					}
				}),
			any: (this._errorsSnippets?.any != null && Array.isArray(this._errorsSnippets?.any))
				? this._errorsSnippets?.any
				: Utils.createAsyncFunction(this._errorsSnippets?.any, {
					createDefault: () => (void 0),
					getVariableNames: () => ['$options', ...this.getHelpersVariableNames()],
					error: (e: Error) => {
						this.getLogger().error(`Failed on create function for any error handler, snippet is [${this._errorsSnippets?.any}].`);
						throw e;
					}
				})
		};
	}

	public getFromRequestSnippet(): ScriptFuncOrBody<GetInFragmentFromRequestFunc<In, InFragment>> {
		return this._fromRequestSnippet;
	}

	public getToResponseSnippet(): ScriptFuncOrBody<SetOutFragmentToResponseFunc<In, Out, OutFragment>> {
		return this._toResponseSnippet;
	}

	/**
	 * request should be merged into response automatically or not.
	 * be noted that when enable this, the request content and result both need to be an object,
	 * they will be unboxed and merged into a new object, and putting as response content
	 */
	public isMergeRequest(): boolean {
		return this.useUnboxMerging() || this.hasMergeKey();
	}

	public useUnboxMerging() {
		return this._mergeRequest === true;
	}

	public hasMergeKey(): boolean {
		return typeof this._mergeRequest === 'string' && this._mergeRequest.length !== 0;
	}

	public getMergeKey(): string {
		return this._mergeRequest as string;
	}

	/**
	 * default is $factor and $request
	 */
	protected generateFromRequestVariableNames(): Array<string> {
		return ['$factor', '$request', ...this.getHelpersVariableNames()];
	}

	/**
	 * default is $result and $request
	 */
	protected generateToResponseVariableNames(): Array<string> {
		return ['$result', '$request', ...this.getHelpersVariableNames()];
	}

	/**
	 * default behavior depends on merge request flag or not
	 * 1. when need to merge with request, unbox request content and result, merge them to a new object
	 * 2. when no need to merge with request, return result directly.
	 * when use given snippet to build response content, still follows the same rule,
	 * the only difference is result is returned by given snippet.
	 */
	protected createToResponseFunc(): SetOutFragmentToResponseFunc<In, Out, OutFragment> {
		const funcOrSnippet = this.getToResponseSnippet();
		if (funcOrSnippet == null || (typeof funcOrSnippet === 'string' && funcOrSnippet.trim().length === 0)) {
			if (this.useUnboxMerging()) {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				return ($result: OutFragment, $request: PipelineStepData<In>, _$helpers: PipelineStepHelpers, _$: PipelineStepHelpers): Out => {
					return {...$request.content, ...$result} as Out;
				};
			} else if (this.hasMergeKey()) {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				return ($result: OutFragment, $request: PipelineStepData<In>, _$helpers: PipelineStepHelpers, _$: PipelineStepHelpers): Out => {
					return {...$request.content, [this.getMergeKey()]: $result} as Out;
				};
			} else {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				return ($result: OutFragment, _$request: PipelineStepData<In>, _$helpers: PipelineStepHelpers, _$: PipelineStepHelpers): Out => {
					return $result as unknown as Out;
				};
			}
		} else if (typeof funcOrSnippet === 'string') {
			const func = new Function(...this.generateToResponseVariableNames(), funcOrSnippet);
			if (this.useUnboxMerging()) {
				return ($result: OutFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers): Out => {
					const r = func($result, $request, $helpers, $);
					return {...$request.content, ...r};
				};
			} else if (this.hasMergeKey()) {
				return ($result: OutFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers): Out => {
					const r = func($result, $request, $helpers, $);
					return {...$request.content, [this.getMergeKey()]: r} as Out;
				};
			} else {
				return func as SetOutFragmentToResponseFunc<In, Out, OutFragment>;
			}
		} else if (this.useUnboxMerging()) {
			return ($result: OutFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers): Out => {
				const r = funcOrSnippet($result, $request, $helpers, $);
				return {...$request.content, ...r};
			};
		} else if (this.hasMergeKey()) {
			return ($result: OutFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers): Out => {
				const r = funcOrSnippet($result, $request, $helpers, $);
				return {...$request.content, [this.getMergeKey()]: r} as Out;
			};
		} else {
			return funcOrSnippet;
		}
	}

	/**
	 * default get request content
	 */
	protected getFromInput($factor: In, $request: PipelineStepData<In>): InFragment {
		const $helpers = this.getHelpers();
		return this._fromRequestFunc($factor, $request, $helpers, $helpers);
	}

	/**
	 * default set to response content
	 */
	protected setToOutput($result: OutFragment, $request: PipelineStepData<In>): PipelineStepData<Out> {
		const $helpers = this.getHelpers();
		return {content: this._toResponseFunc($result, $request, $helpers, $helpers)};
	}

	/**
	 * @param data
	 * @param request might be used
	 * @protected
	 */
	protected abstract doPerform(data: InFragment, request: PipelineStepData<In>): Promise<OutFragment>;

	protected buildStepOptions(): Pick<PipelineStepOptions, 'config' | 'logger'> {
		return {config: this.getConfig(), logger: this.getLogger()};
	}

	protected createErrorHandleContext(request: PipelineStepData<In>): PipelineStepSetsContext {
		const context = request.$context;
		if (context == null) {
			return {};
		} else {
			return Utils.clone(context);
		}
	}

	/**
	 * same logic as step-sets, but cannot depend on step-sets, since circular dependency leading error
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async handleErrorSteps(fragment: InFragment, errorCode: string, error: any, request: PipelineStepData<In>, builders: Array<PipelineStepBuilder>): Promise<OutFragment> {
		const {$context: {traceId} = {}} = request;
		const errorContext = this.createErrorHandleContext(request);
		const options = this.buildStepOptions();
		const steps = await Promise.all(builders.map(async builder => await builder.create(options)));
		const response = await steps.reduce(async (promise, step) => {
			const request = await promise;
			return await this.measurePerformance(traceId, 'STEP', step.constructor.name)
				.execute(async () => {
					this.traceStepIn(traceId, step, request);
					const response = await step.perform({...request, $context: {...errorContext, traceId}});
					this.traceStepOut(traceId, step, response);
					// if no response returned, keep using request for next
					return this.returnOrContinueOrClear(request, response);
				});
			// build request for first step
		}, Promise.resolve({
			content: {$code: errorCode, $error: error, $factor: fragment, $request: request},
			$context: request.$context
		}));
		return response.content;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async handleError(fragment: InFragment, request: PipelineStepData<In>, error: any): Promise<OutFragment> {
		if (this._errorsFuncs.catchable != null && error instanceof CatchableError) {
			if (Array.isArray(this._errorsFuncs.catchable)) {
				return await this.handleErrorSteps(fragment, error.getCode(), error, request, this._errorsFuncs.catchable);
			} else {
				const $helpers = this.getHelpers();
				return await this._errorsFuncs.catchable({
					$code: error.getCode(), $error: error, $factor: fragment, $request: request
				}, $helpers, $helpers);
			}
		} else if (this._errorsFuncs.exposed != null && error instanceof ExposedUncatchableError) {
			if (Array.isArray(this._errorsFuncs.exposed)) {
				return await this.handleErrorSteps(fragment, error.getCode(), error, request, this._errorsFuncs.exposed);
			} else {
				const $helpers = this.getHelpers();
				return await this._errorsFuncs.exposed({
					$code: error.getCode(), $error: error, $factor: fragment, $request: request
				}, $helpers, $helpers);
			}
		} else if (this._errorsFuncs.uncatchable != null && error instanceof UncatchableError) {
			if (Array.isArray(this._errorsFuncs.uncatchable)) {
				return await this.handleErrorSteps(fragment, error.getCode(), error, request, this._errorsFuncs.uncatchable);
			} else {
				const $helpers = this.getHelpers();
				return await this._errorsFuncs.uncatchable({
					$code: error.getCode(), $error: error, $factor: fragment, $request: request
				}, $helpers, $helpers);
			}
		} else if (this._errorsFuncs.any != null) {
			if (Array.isArray(this._errorsFuncs.any)) {
				return await this.handleErrorSteps(fragment, ERR_UNKNOWN, error, request, this._errorsFuncs.any);
			} else {
				const $helpers = this.getHelpers();
				return await this._errorsFuncs.any({
					$code: ERR_UNKNOWN, $error: error, $factor: fragment, $request: request
				}, $helpers, $helpers);
			}
		} else {
			// rethrow error
			throw error;
		}
	}

	public async performAndCatch(request: PipelineStepData<In>, perform: (data: InFragment) => Promise<PipelineStepData<Out>>): Promise<PipelineStepData<Out>> {
		let fragment = null;
		try {
			fragment = this.getFromInput(request.content, request);
			return await perform(fragment);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			const result = await this.handleError(fragment, request, e);
			return this.setToOutput(result, request);
		}
	}

	public async perform(request: PipelineStepData<In>): Promise<PipelineStepData<Out>> {
		return await this.performAndCatch(request, async (fragment) => {
			const result = await this.doPerform(fragment, request);
			return this.setToOutput(result, request);
		});
	}
}
