import {PipelineStepType} from '@rainbow-o23/n1';
import {TypeOrmSaveBySQLPipelineStep} from '@rainbow-o23/n3';
import {AbstractTypeOrmBySQLPipelineStepBuilder} from './abstract-typeorm-by-sql-step-builder';

export class TypeOrmSaveBySQLPipelineStepBuilder
	extends AbstractTypeOrmBySQLPipelineStepBuilder<TypeOrmSaveBySQLPipelineStep> {
	protected getStepType(): PipelineStepType<TypeOrmSaveBySQLPipelineStep> {
		return TypeOrmSaveBySQLPipelineStep;
	}
}
