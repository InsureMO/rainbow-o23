import {PipelineStepData, PipelineStepPayload, Undefinable} from '@rainbow-o23/n1';
import {AbstractTypeOrmBySQLPipelineStep, TypeOrmBasis} from './abstract-typeorm-by-sql-step';
import {TypeOrmEntityToLoad, TypeOrmEntityToSave, TypeOrmEntityValue} from './types';

export interface TypeOrmLoadBasis extends TypeOrmBasis {
	params?: Array<TypeOrmEntityValue> | TypeOrmEntityToSave;
}

export abstract class AbstractTypeOrmLoadBySQLPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, OutFragment = Out>
	extends AbstractTypeOrmBySQLPipelineStep<In, Out, Undefinable<TypeOrmLoadBasis>, OutFragment> {
	protected abstract getDataFromResultSet(rst: Array<TypeOrmEntityToLoad>): Promise<OutFragment>;

	protected async doPerform(basis: Undefinable<TypeOrmLoadBasis>, request: PipelineStepData<In>): Promise<Undefinable<OutFragment>> {
		const {sql, params} = this.getSql(basis, basis?.params);
		return await this.autoTrans<Undefinable<OutFragment>>(async (runner) => {
			const rst = await runner.query(sql, params);
			if (rst == null || rst.length === 0) {
				return (void 0);
			} else {
				const datasourceType = this.findDataSourceType();
				// typeorm already box row to object
				const data = await this.getDataFromResultSet(rst);
				if (Array.isArray(data)) {
					return data.map(item => this.beautify({data: item, datasourceType})) as OutFragment;
				} else {
					return this.beautify({data, datasourceType}) as OutFragment;
				}
			}
		}, request);
	}
}
