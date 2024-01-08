import {
	CatchableError,
	O23ExternalErrorCode,
	PipelineStepData,
	PipelineStepPayload,
	Undefinable
} from '@rainbow-o23/n1';
import {Snowflake} from '@theinternetfolks/snowflake';
import {DeepPartial, ObjectLiteral} from 'typeorm';
import {ScriptFuncOrBody, Utils} from '../step';
import {AbstractTypeOrmPipelineStep, TypeOrmPipelineStepOptions} from './abstract-typeorm-step';
import {TypeOrmEntityName} from './types';

export type EntityToSave = DeepPartial<ObjectLiteral>;

export type UniquenessCheckResult = { pass: true } | { pass: false, code: O23ExternalErrorCode, message: string };
/**
 * parameter names could be change {@link TypeOrmSaveEntityPipelineStep#generateUniquenessCheckVariableNames}
 */
export type UniquenessCheckFunc<EntityToSave> = (given: EntityToSave, existing: EntityToSave) => UniquenessCheckResult;

export interface TypeOrmSaveEntityPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = EntityToSave, OutFragment = EntityToSave>
	extends TypeOrmPipelineStepOptions<In, Out, InFragment, OutFragment> {
	entityName: TypeOrmEntityName;
	fillIdBySnowflake?: boolean;
	uniquenessCheckSnippet?: ScriptFuncOrBody<UniquenessCheckFunc<InFragment>>;
}

/**
 * no transaction here
 */
export class TypeOrmSaveEntityPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = EntityToSave, OutFragment = EntityToSave>
	extends AbstractTypeOrmPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _entityName: TypeOrmEntityName;
	private readonly _fillIdBySnowflake: boolean;
	private readonly _uniquenessCheckSnippet?: ScriptFuncOrBody<UniquenessCheckFunc<InFragment>>;
	private readonly _uniquenessCheckFunc?: UniquenessCheckFunc<InFragment>;

	public constructor(options: TypeOrmSaveEntityPipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		this._entityName = options.entityName;
		this._fillIdBySnowflake = options.fillIdBySnowflake ?? false;
		this._uniquenessCheckSnippet = options.uniquenessCheckSnippet;
		this._uniquenessCheckFunc = Utils.createSyncFunction(this.getUniquenessCheckSnippet(), {
			createDefault: () => (void 0),
			getVariableNames: () => this.generateUniquenessCheckVariableNames(),
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for uniqueness check, snippet is [${this.getUniquenessCheckSnippet()}].`);
				throw e;
			}
		});
	}

	public getEntityName(): TypeOrmEntityName {
		return this._entityName;
	}

	public isFillIdBySnowflake(): boolean {
		return this._fillIdBySnowflake;
	}

	public getUniquenessCheckSnippet(): Undefinable<ScriptFuncOrBody<UniquenessCheckFunc<InFragment>>> {
		return this._uniquenessCheckSnippet;
	}

	public needUniquenessCheck(): boolean {
		return this._uniquenessCheckFunc != null;
	}

	protected generateUniquenessCheckVariableNames(): Array<string> {
		return ['given', 'existing'];
	}

	/**
	 * 1. check uniqueness of given entity,
	 *   - only when need it, see {@link needUniquenessCheck}
	 *   - load entity by id, which get from given entity,
	 *   - compare given and existing by uniqueness check snippet (see {@link _uniquenessCheckFunc}), only when existing loaded from database,
	 *   - throw catchable error if failed on uniqueness check,
	 * 2. generate snowflake id and set into given entity,
	 *   - only when need it, see {@link isFillIdBySnowflake}
	 * 3. save it.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(entity: InFragment, request: PipelineStepData<In>): Promise<OutFragment> {
		const [, column, repository] = await this.findMetadata(this.getEntityName(), request);
		if (this.needUniquenessCheck()) {
			const id = entity[column.propertyName];
			if (`${id ?? ''}`.trim().length !== 0) {
				const existing = await repository.findOneBy({[column.propertyName]: id}) as InFragment;
				if (existing != null) {
					const checked = this._uniquenessCheckFunc(entity, existing);
					if (checked.pass !== true) {
						throw new CatchableError(checked.code, checked.message);
					}
				}
			}
		}
		if (this.isFillIdBySnowflake()) {
			// fill id if not exists
			const id = entity[column.propertyName];
			if (id == null || `${id ?? ''}`.trim().length === 0) {
				entity[column.propertyName] = Snowflake.generate() as unknown as number;
			}
		}

		return await repository.save(entity) as OutFragment;
	}
}
