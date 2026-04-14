import {
	PIPELINE_STEP_RETURN_NULL,
	PipelineStepBuilder,
	PipelineStepData,
	PipelineStepHelpers,
	PipelineStepPayload,
	Undefinable
} from '@rainbow-o23/n1';
import {ReadStream} from 'fs';
import {PipelineStepSets, ScriptFuncOrBody, Utils} from '../step';
import {AbstractTypeOrmBySQLPipelineStep, TypeOrmBySQLPipelineStepOptions} from './abstract-typeorm-by-sql-step';
import {TypeOrmLoadBasis} from './abstract-typeorm-load-by-sql-step';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StreamToSubSteps = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StreamToFunc<In, Item> = ($factor: Array<Item>, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<StreamToSubSteps>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TypeOrmLoadManyBySQLUseCursorPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = TypeOrmLoadBasis, OutFragment = Out, Item = any>
	extends TypeOrmBySQLPipelineStepOptions<In, Out, InFragment, OutFragment> {
	fetchSize?: number;
	streamTo?: ScriptFuncOrBody<StreamToFunc<In, Item>>;
	steps?: Array<PipelineStepBuilder>;
	pauseStreamEnabled?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TypeOrmLoadManyBySQLUseCursorPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = Undefinable<TypeOrmLoadBasis>, OutFragment = Out, Item = any>
	extends AbstractTypeOrmBySQLPipelineStep<In, Out, Undefinable<TypeOrmLoadBasis>, OutFragment> {
	private readonly _fetchSize: number;
	private readonly _streamToSnippet: ScriptFuncOrBody<StreamToFunc<In, Item>>;
	private readonly _streamToFunc: StreamToFunc<In, Item>;
	private readonly _stepBuilders: Array<PipelineStepBuilder>;
	private readonly _pauseStreamEnabled: boolean;

	public constructor(options: TypeOrmLoadManyBySQLUseCursorPipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		const config = this.getConfig();
		this._fetchSize = options.fetchSize ?? config.getNumber(`typeorm.${this.getDataSourceName()}.fetch.size`, 20);
		this._streamToSnippet = options.streamTo;
		this._streamToFunc = Utils.createAsyncFunction(this.getStreamToSnippet(), {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			createDefault: () => (async ($factor: Array<any>) => $factor),
			getVariableNames: () => this.generateVariableNames(),
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for snippet[${this.getStreamToSnippet()}].`);
				throw e;
			}
		});
		this._stepBuilders = options.steps;
		// for unknown reason, in some environment if the pause and resume functions of readable invoked,
		// only the first row are returns and end event invoked immediately
		// so default disable it.
		this._pauseStreamEnabled = options.pauseStreamEnabled ?? config.getBoolean(`typeorm.${this.getDataSourceName()}.stream.pause.enabled`, false);
	}

	protected getFetchSize(): number {
		return this._fetchSize;
	}

	public getStreamToSnippet(): ScriptFuncOrBody<StreamToFunc<In, Item>> {
		return this._streamToSnippet;
	}

	protected generateVariableNames(): Array<string> {
		return [this.getFetchDataVariableName(), this.getRequestVariableName(), ...this.getHelpersVariableNames()];
	}

	protected getStepBuilders(): Array<PipelineStepBuilder> {
		return this._stepBuilders ?? [];
	}

	protected isPauseStreamEnabled(): boolean {
		return this._pauseStreamEnabled;
	}

	protected async doPerform(basis: Undefinable<TypeOrmLoadBasis>, request: PipelineStepData<In>): Promise<Undefinable<OutFragment>> {
		const {sql, params} = this.getSql(basis, basis?.params);
		return await this.autoTrans<OutFragment>(async (runner) => {
			const results = [];
			const rows = [];
			const fetchSize = this.getFetchSize();
			let cursorRound = 0;
			const pipe = async ({rows, end}) => {
				// get data from cache
				const contentForSub = await this._streamToFunc(rows, request, this.getHelpers(), this.getHelpers());
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				let resultContent: any;
				if (this.getStepBuilders().length === 0) {
					// no sub step, use content as result
					resultContent = contentForSub;
				} else {
					// create a step sets to run
					const sets = new PipelineStepSets({
						...this.buildStepOptions(), name: this.getName(), steps: this.getStepBuilders()
					});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const {content: _, $context, ...rest} = request;
					// pass a cursor end indicator to sub steps
					const contextForSub = $context.temporaryWith({
						$typeOrmCursorRound: cursorRound, $typeOrmCursorEnd: end
					});
					const requestForSub = {...rest, $context: contextForSub, content: contentForSub};
					const result = await sets.perform(requestForSub);
					const {content} = result;
					resultContent = content;
				}
				cursorRound = cursorRound + 1;
				if (resultContent == null || resultContent == PIPELINE_STEP_RETURN_NULL) {
					// ignore
				} else if (Array.isArray(resultContent)) {
					results.push(...resultContent);
				} else {
					results.push(resultContent);
				}
			};
			const close = async (readable: ReadStream) => {
				// never throw exception from this function
				try {
					readable?.destroy();
				} catch (e) {
					// ignore this error
					this.getLogger().error(e);
				}
			};
			const read = async ({resolve, reject}) => {
				const pipes = [];

				const readable = await runner.stream(sql, params, async () => {
					// on end
					await close(readable);
					const data = [...rows];
					rows.length = 0;
					const last = async () => {
						try {
							await pipe({rows: data, end: true});
							resolve(results);
						} catch (e) {
							reject(e);
						}
					};
					if (pipes.length !== 0) {
						// there is not finished
						pipes.push(last);
					} else {
						await last();
					}
				}, async (e: Error) => {
					// on error
					await close(readable);
					reject(e);
				});
				readable.on('data', async (data) => {
					if (this.isPauseStreamEnabled()) {
						readable.pause();
					}
					rows.push(data);
					if (rows.length < fetchSize) {
						// not end, and size not meet the fresh required
						// do nothing, wait for next
					} else {
						const data = [...rows];
						rows.length = 0;
						pipes.push(async () => {
							try {
								await pipe({rows: data, end: false});
							} catch (e) {
								await close(readable);
								reject(e);
								return;
							}
							// drop the finished
							pipes.shift();
							// check there is more or not, if true, run the first one.
							if (pipes.length !== 0) {
								pipes[0]();
							}
						});
						// if the only one, run it immediately
						if (pipes.length === 1) {
							await pipes[0]();
						}
					}
					if (this.isPauseStreamEnabled()) {
						readable.resume();
					}
				});
			};
			return new Promise<OutFragment>((resolve, reject) => read({resolve, reject}));
		}, request);
	}

	/**
	 * override this method when want to use another variable name rather than "$factor"
	 */
	protected getFetchDataVariableName(): string {
		return '$factor';
	}

	protected getRequestVariableName(): string {
		return '$request';
	}
}
