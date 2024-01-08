import {PipelineStepPayload} from '@rainbow-o23/n1';
import {AbstractTypeOrmLoadBySQLPipelineStep} from './abstract-typeorm-load-by-sql-step';
import {TypeOrmEntityToLoad} from './types';

/**
 * load many object by sql
 */
export class TypeOrmLoadManyBySQLPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, OutFragment = Array<TypeOrmEntityToLoad>>
	extends AbstractTypeOrmLoadBySQLPipelineStep<In, Out, OutFragment> {
	protected async getDataFromResultSet(rst: Array<TypeOrmEntityToLoad>): Promise<OutFragment> {
		return rst as OutFragment;
	}
}
