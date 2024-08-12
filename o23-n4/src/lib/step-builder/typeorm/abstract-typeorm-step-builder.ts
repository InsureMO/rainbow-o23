import {UncatchableError} from '@rainbow-o23/n1';
import {AbstractTypeOrmPipelineStep, TypeOrmPipelineStepOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_DATASOURCE_NOT_DEFINED, ERR_PIPELINE_STEP_TRANSACTION_NOT_DEFINED} from '../../error-codes';
import {AbstractFragmentaryPipelineStepBuilder, FragmentaryPipelineStepBuilderOptions} from '../basic';
import {redressString} from '../utils';

export type TypeOrmPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	datasource?: TypeOrmPipelineStepOptions['dataSourceName'];
	transaction?: TypeOrmPipelineStepOptions['transactionName'];
	autonomous?: TypeOrmPipelineStepOptions['autonomous']
};

export abstract class AbstractTypeOrmPipelineStepBuilder<G extends TypeOrmPipelineStepBuilderOptions, O extends TypeOrmPipelineStepOptions, S extends AbstractTypeOrmPipelineStep>
	extends AbstractFragmentaryPipelineStepBuilder<G, O, S> {
	protected readMoreOptions(given: G, transformed: O): O {
		transformed = super.readMoreOptions(given, transformed);
		transformed.dataSourceName = redressString(given.datasource);
		if (transformed.dataSourceName == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_DATASOURCE_NOT_DEFINED, `Datasource[datasource] not defined for typeorm pipeline step[${given.name}].`);
		}
		transformed.transactionName = redressString(given.transaction);
		transformed.autonomous = given.autonomous;
		if (transformed.transactionName == null && !transformed.autonomous) {
			throw new UncatchableError(ERR_PIPELINE_STEP_TRANSACTION_NOT_DEFINED, `Transaction[transaction] not defined for typeorm pipeline step[${given.name}] when autonomous is false.`);
		}
		return transformed;
	}
}
