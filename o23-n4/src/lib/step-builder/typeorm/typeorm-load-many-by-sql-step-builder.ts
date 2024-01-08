import {PipelineStepType} from '@rainbow-o23/n1';
import {TypeOrmLoadManyBySQLPipelineStep} from '@rainbow-o23/n3';
import {AbstractTypeOrmBySQLPipelineStepBuilder} from './abstract-typeorm-by-sql-step-builder';

export class TypeOrmLoadManyBySQLPipelineStepBuilder
	extends AbstractTypeOrmBySQLPipelineStepBuilder<TypeOrmLoadManyBySQLPipelineStep> {
	protected getStepType(): PipelineStepType<TypeOrmLoadManyBySQLPipelineStep> {
		return TypeOrmLoadManyBySQLPipelineStep;
	}
}
