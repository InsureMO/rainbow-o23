import {PipelineStepData, PipelineStepPayload, Undefinable} from '@rainbow-o23/n1';
import {AbstractTypeOrmBySQLPipelineStep, TypeOrmBasis} from './abstract-typeorm-by-sql-step';
import {TypeOrmBulkWrittenResult, TypeOrmEntityToSave, TypeOrmEntityValue} from './types';

export interface TypeOrmBulkSaveBasis extends TypeOrmBasis {
	items?: Array<Array<TypeOrmEntityValue> | TypeOrmEntityToSave>;
}

/**
 * ignore when values is not present or values is an empty array
 */
export class TypeOrmBulkSaveBySQLPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, OutFragment extends TypeOrmBulkWrittenResult = TypeOrmBulkWrittenResult>
	extends AbstractTypeOrmBySQLPipelineStep<In, Out, Undefinable<TypeOrmBulkSaveBasis>, OutFragment> {
	protected async doPerform(basis: Undefinable<TypeOrmBulkSaveBasis>, request: PipelineStepData<In>): Promise<OutFragment> {
		if (basis?.items == null || basis?.items.length === 0) {
			return [] as OutFragment;
		}

		return await this.autoTrans<OutFragment>(async (runner) => {
			const result: OutFragment = [] as OutFragment;
			for (const item of basis.items) {
				const {sql, params} = this.getSql(basis, item);
				const ret = await runner.query(sql, params);
				result.push(this.parseResult(ret));
			}
			return result;
		}, request);
	}
}
