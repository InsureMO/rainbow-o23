import {PipelineStepData, PipelineStepPayload, Undefinable} from '@rainbow-o23/n1';
import {AbstractTypeOrmPipelineStep, TypeOrmPipelineStepOptions} from './abstract-typeorm-step';
import {TypeOrmEntityName, TypeOrmEntityToLoad, TypeOrmIdType} from './types';

export interface TypeOrmLoadEntityByIdPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = TypeOrmIdType, OutFragment = Out>
	extends TypeOrmPipelineStepOptions<In, Out, InFragment, OutFragment> {
	entityName: TypeOrmEntityName;
}

/**
 * no transaction here
 * @deprecated by entity is not recommended
 */
export class TypeOrmLoadEntityByIdPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, OutFragment = TypeOrmEntityToLoad>
	extends AbstractTypeOrmPipelineStep<In, Out, TypeOrmIdType, OutFragment> {
	private readonly _entityName: TypeOrmEntityName;

	public constructor(options: TypeOrmLoadEntityByIdPipelineStepOptions<In, Out, TypeOrmIdType, OutFragment>) {
		super(options);
		this._entityName = options.entityName;
	}

	public getEntityName(): TypeOrmEntityName {
		return this._entityName;
	}

	protected async doPerform(id: TypeOrmIdType, request: PipelineStepData<In>): Promise<Undefinable<OutFragment>> {
		const [, column, repository] = await this.findMetadata(this.getEntityName(), request);
		const loaded = await repository.findOneBy({[column.propertyName]: id}) as OutFragment;
		if (loaded == null) {
			return (void 0);
		} else {
			return loaded;
		}
	}
}
