import {
	AbstractPipeline,
	PartialBy,
	PipelineCode,
	PipelineStep,
	PipelineStepBuilder,
	PipelineStepOptions
} from '@rainbow-o23/n1';
import {
	TypeOrmIdType,
	TypeOrmLoadEntityByIdPipelineStep,
	TypeOrmSaveEntityPipelineStep,
	UniquenessCheckResult
} from '@rainbow-o23/n3';
import {ENTITY_UNIQUENESS_CONFLICT} from '../error-codes';
import {SingleEntity} from './single-entity-model';

/**
 * use pipeline in as first step in,
 * use last step out as pipeline out
 */
export class LoadSingleEntityPipeline extends AbstractPipeline<bigint, SingleEntity> {
	public getCode(): PipelineCode {
		return 'LoadSingleEntityPipeline';
	}

	protected getStepBuilders(): Array<PipelineStepBuilder> {
		return [
			{
				async create(options?: PipelineStepOptions): Promise<PipelineStep> {
					return new TypeOrmLoadEntityByIdPipelineStep<TypeOrmIdType, SingleEntity, SingleEntity>({
						...(options ?? {}),
						dataSourceName: 'SingleEntityDS',
						entityName: SingleEntity.name,
						autonomous: true
					});
				}
			}
		];
	}
}

/**
 * use pipeline in as first step in,
 * use last step out as pipeline out
 */
export class SaveSingleEntityPipeline extends AbstractPipeline<PartialBy<SingleEntity, 'id'>, SingleEntity> {
	public getCode(): PipelineCode {
		return 'SaveSingleEntityPipeline';
	}

	protected getStepBuilders(): Array<PipelineStepBuilder> {
		return [
			{
				async create(options?: PipelineStepOptions): Promise<PipelineStep> {
					return new TypeOrmSaveEntityPipelineStep<number, SingleEntity, SingleEntity>({
						...(options ?? {}),
						dataSourceName: 'SingleEntityDS',
						entityName: SingleEntity.name,
						autonomous: true,
						fillIdBySnowflake: true,
						// could be snippet
						uniquenessCheckSnippet: (given: SingleEntity, existing: SingleEntity): UniquenessCheckResult => {
							return given.code === existing.code
								? {pass: true}
								: {
									pass: false,
									code: ENTITY_UNIQUENESS_CONFLICT,
									message: `Existing record has different code[${existing.code}].`
								};
						}
					});
				}
			}
		];
	}
}
