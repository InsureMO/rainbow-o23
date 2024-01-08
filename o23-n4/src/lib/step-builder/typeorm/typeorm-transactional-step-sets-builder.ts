import {PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {
	TypeOrmPipelineStepOptions,
	TypeOrmTransactionalPipelineStepSets,
	TypeOrmTransactionalPipelineStepSetsOptions
} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_DATASOURCE_NOT_DEFINED, ERR_PIPELINE_STEP_TRANSACTION_NOT_DEFINED} from '../../error-codes';
import {PipelineStepSetsBuilder, PipelineStepSetsBuilderOptions} from '../basic';
import {redressString} from '../utils';

export type TypeOrmTransactionalPipelineStepSetsBuilderOptions = PipelineStepSetsBuilderOptions & {
	datasource?: TypeOrmPipelineStepOptions['dataSourceName'];
	transaction?: TypeOrmPipelineStepOptions['transactionName'];
}

export class TypeOrmTransactionalPipelineStepSetsBuilder
	extends PipelineStepSetsBuilder<TypeOrmTransactionalPipelineStepSetsBuilderOptions, TypeOrmTransactionalPipelineStepSetsOptions, TypeOrmTransactionalPipelineStepSets> {
	protected getStepType(): PipelineStepType<TypeOrmTransactionalPipelineStepSets> {
		return TypeOrmTransactionalPipelineStepSets;
	}

	protected readMoreOptions(given: TypeOrmTransactionalPipelineStepSetsBuilderOptions, transformed: TypeOrmTransactionalPipelineStepSetsOptions): TypeOrmTransactionalPipelineStepSetsOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.dataSourceName = redressString(given.datasource);
		if (transformed.dataSourceName == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_DATASOURCE_NOT_DEFINED, `Datasource[datasource] not defined for typeorm pipeline step sets[${given.name}].`);
		}
		transformed.transactionName = redressString(given.transaction);
		if (transformed.transactionName == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_TRANSACTION_NOT_DEFINED, `Transaction[transaction, autonomous] not defined for typeorm pipeline step sets[${given.name}].`);
		}
		return transformed;
	}
}
