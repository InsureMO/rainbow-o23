import {PipelineStepPayload} from '@rainbow-o23/n1';
import {AbstractTypeOrmLoadBySQLPipelineStep} from './abstract-typeorm-load-by-sql-step';
import {TypeOrmEntityToLoad} from './types';

/**
 * load one object by sql
 */
export class TypeOrmLoadOneBySQLPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, OutFragment = TypeOrmEntityToLoad>
	extends AbstractTypeOrmLoadBySQLPipelineStep<In, Out, OutFragment> {
	protected async getDataFromResultSet(rst: Array<TypeOrmEntityToLoad>): Promise<OutFragment> {
		return rst[0] as OutFragment;
	}
}
