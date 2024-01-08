import {PipelineStepType} from '@rainbow-o23/n1';
import {TypeOrmBulkSaveBySQLPipelineStep} from '@rainbow-o23/n3';
import {AbstractTypeOrmBySQLPipelineStepBuilder} from './abstract-typeorm-by-sql-step-builder';

export class TypeOrmBulkSaveBySQLPipelineStepBuilder
	extends AbstractTypeOrmBySQLPipelineStepBuilder<TypeOrmBulkSaveBySQLPipelineStep> {
	protected getStepType(): PipelineStepType<TypeOrmBulkSaveBySQLPipelineStep> {
		return TypeOrmBulkSaveBySQLPipelineStep;
	}
}
