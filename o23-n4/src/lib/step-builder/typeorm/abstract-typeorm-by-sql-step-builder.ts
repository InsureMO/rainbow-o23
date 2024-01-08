import {UncatchableError} from '@rainbow-o23/n1';
import {AbstractTypeOrmBySQLPipelineStep, TypeOrmBySQLPipelineStepOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_SQL_NOT_DEFINED} from '../../error-codes';
import {redressString} from '../utils';
import {AbstractTypeOrmPipelineStepBuilder, TypeOrmPipelineStepBuilderOptions} from './abstract-typeorm-step-builder';

export type TypeOrmBySQLPipelineStepBuilderOptions = TypeOrmPipelineStepBuilderOptions & {
	sql: TypeOrmBySQLPipelineStepOptions['sql'];
}

export abstract class AbstractTypeOrmBySQLPipelineStepBuilder<S extends AbstractTypeOrmBySQLPipelineStep>
	extends AbstractTypeOrmPipelineStepBuilder<TypeOrmBySQLPipelineStepBuilderOptions, TypeOrmBySQLPipelineStepOptions, S> {
	protected readMoreOptions(given: TypeOrmBySQLPipelineStepBuilderOptions, transformed: TypeOrmBySQLPipelineStepOptions): TypeOrmBySQLPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.sql = redressString(given.sql);
		if (transformed.sql === '@ignore') {
			delete transformed.sql;
		} else if (transformed.sql == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_SQL_NOT_DEFINED, `SQL[sql] not defined for typeorm by snippet pipeline step[${given.name}].`);
		}
		return transformed;
	}
}
