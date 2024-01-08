import {PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {TypeOrmSaveEntityPipelineStep, TypeOrmSaveEntityPipelineStepOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_ENTITY_NOT_DEFINED} from '../../error-codes';
import {redressSnippet, redressString} from '../utils';
import {AbstractTypeOrmPipelineStepBuilder, TypeOrmPipelineStepBuilderOptions} from './abstract-typeorm-step-builder';

export type TypeOrmSaveEntityPipelineStepBuilderOptions = TypeOrmPipelineStepBuilderOptions & {
	entity: TypeOrmSaveEntityPipelineStepOptions['entityName'];
	fillIdBySnowflake: TypeOrmSaveEntityPipelineStepOptions['fillIdBySnowflake'];
	uniquenessCheck: TypeOrmSaveEntityPipelineStepOptions['uniquenessCheckSnippet'];
}

export class TypeOrmSaveEntityPipelineStepBuilder
	extends AbstractTypeOrmPipelineStepBuilder<TypeOrmSaveEntityPipelineStepBuilderOptions, TypeOrmSaveEntityPipelineStepOptions, TypeOrmSaveEntityPipelineStep> {
	protected getStepType(): PipelineStepType<TypeOrmSaveEntityPipelineStep> {
		return TypeOrmSaveEntityPipelineStep;
	}

	protected readMoreOptions(given: TypeOrmSaveEntityPipelineStepBuilderOptions, transformed: TypeOrmSaveEntityPipelineStepOptions): TypeOrmSaveEntityPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.entityName = redressString(given.entity);
		if (transformed.entityName == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_ENTITY_NOT_DEFINED, `Entity[entity] not defined for typeorm load entity by id pipeline step[${given.name}].`);
		}
		transformed.fillIdBySnowflake = given.fillIdBySnowflake ?? false;
		transformed.uniquenessCheckSnippet = redressSnippet(given.uniquenessCheck);
		return transformed;
	}
}
