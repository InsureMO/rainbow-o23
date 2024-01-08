import {PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {TypeOrmLoadEntityByIdPipelineStep, TypeOrmLoadEntityByIdPipelineStepOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_ENTITY_NOT_DEFINED} from '../../error-codes';
import {redressString} from '../utils';
import {AbstractTypeOrmPipelineStepBuilder, TypeOrmPipelineStepBuilderOptions} from './abstract-typeorm-step-builder';

export type TypeOrmLoadEntityByIdPipelineStepBuilderOptions = TypeOrmPipelineStepBuilderOptions & {
	entity: TypeOrmLoadEntityByIdPipelineStepOptions['entityName'];
}

export class TypeOrmLoadEntityByIdPipelineStepBuilder
	extends AbstractTypeOrmPipelineStepBuilder<TypeOrmLoadEntityByIdPipelineStepBuilderOptions, TypeOrmLoadEntityByIdPipelineStepOptions, TypeOrmLoadEntityByIdPipelineStep> {
	protected getStepType(): PipelineStepType<TypeOrmLoadEntityByIdPipelineStep> {
		return TypeOrmLoadEntityByIdPipelineStep;
	}

	protected readMoreOptions(given: TypeOrmLoadEntityByIdPipelineStepBuilderOptions, transformed: TypeOrmLoadEntityByIdPipelineStepOptions): TypeOrmLoadEntityByIdPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.entityName = redressString(given.entity);
		if (transformed.entityName == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_ENTITY_NOT_DEFINED, `Entity[entity] not defined for typeorm load entity by id pipeline step[${given.name}].`);
		}
		return transformed;
	}
}
