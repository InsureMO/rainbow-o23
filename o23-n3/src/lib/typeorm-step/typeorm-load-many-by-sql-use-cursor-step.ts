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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TypeOrmLoadManyBySQLUseCursorPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = Undefinable<TypeOrmLoadBasis>, OutFragment = Out, Item = any>
	extends AbstractTypeOrmBySQLPipelineStep<In, Out, Undefinable<TypeOrmLoadBasis>, OutFragment> {
	private readonly _fetchSize: number;
	private readonly _streamToSnippet: ScriptFuncOrBody<StreamToFunc<In, Item>>;
	private readonly _streamToFunc: StreamToFunc<In, Item>;
	private readonly _stepBuilders: Array<PipelineStepBuilder>;

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

	protected async doPerform(basis: Undefinable<TypeOrmLoadBasis>, request: PipelineStepData<In>): Promise<Undefinable<OutFragment>> {
		const {sql, params} = this.getSql(basis, basis?.params);
		return await this.autoTrans<OutFragment>(async (runner) => {
			const results = [];
			const rows = [];
			let cursorRound = 0;
			const pipe = async ({resolve, reject, end}) => {
				if (!end && rows.length < this.getFetchSize()) {
					// not end, and size not meet the fresh required
					// do nothing, wait for next
					return;
				}
				try {
					// get data from cache
					const contentForSub = await this._streamToFunc([...rows], request, this.getHelpers(), this.getHelpers());
					// clear cache
					rows.length = 0;
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
						const contextForSub = {...$context, $typeOrmCursorRound: cursorRound, $typeOrmCursorEnd: end};
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
				} catch (e) {
					reject(e);
				}
				if (end) {
					resolve(results);
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
				const readable = await runner.stream(sql, params, async () => {
					// on end
					await close(readable);
					await pipe({resolve, reject, end: true});
				}, async (e: Error) => {
					// on error
					await close(readable);
					reject(e);
				});
				readable.on('data', async (data) => {
					readable.pause();
					rows.push(data);
					await pipe({
						resolve, reject: async (e: Error) => {
							await close(readable);
							reject(e);
						}, end: false
					});
					readable.resume();
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
