import {PipelineStepType} from '@rainbow-o23/n1';
import {TypeOrmLoadOneBySQLPipelineStep} from '@rainbow-o23/n3';
import {AbstractTypeOrmBySQLPipelineStepBuilder} from './abstract-typeorm-by-sql-step-builder';

export class TypeOrmLoadOneBySQLPipelineStepBuilder
	extends AbstractTypeOrmBySQLPipelineStepBuilder<TypeOrmLoadOneBySQLPipelineStep> {
	protected getStepType(): PipelineStepType<TypeOrmLoadOneBySQLPipelineStep> {
		return TypeOrmLoadOneBySQLPipelineStep;
	}
}
