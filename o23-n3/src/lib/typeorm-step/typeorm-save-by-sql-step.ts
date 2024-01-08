import {PipelineStepData, PipelineStepPayload, Undefinable} from '@rainbow-o23/n1';
import {AbstractTypeOrmBySQLPipelineStep, TypeOrmBasis} from './abstract-typeorm-by-sql-step';
import {TypeOrmEntityToSave, TypeOrmEntityValue, TypeOrmWrittenResult} from './types';

export interface TypeOrmSaveBasis extends TypeOrmBasis {
	values?: Array<TypeOrmEntityValue> | TypeOrmEntityToSave;
}

/**
 * execute anyway, even values is not present.
 *
 * It is important to note that when executing the Update/Delete SQL through this step,
 * the affected data rows may not be just one row. This depends on the given SQL and values.
 */
export class TypeOrmSaveBySQLPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, OutFragment = TypeOrmWrittenResult>
	extends AbstractTypeOrmBySQLPipelineStep<In, Out, Undefinable<TypeOrmSaveBasis>, OutFragment> {
	protected async doPerform(basis: Undefinable<TypeOrmSaveBasis>, request: PipelineStepData<In>): Promise<OutFragment> {
		const {sql, params} = this.getSql(basis, basis?.values);
		return await this.autoTrans<OutFragment>(async (runner) => {
			const result = await runner.query(sql, params);
			return this.parseResult(result);
		}, request);
	}
}
