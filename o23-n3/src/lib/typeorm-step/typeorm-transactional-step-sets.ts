import {PipelineStepData, PipelineStepPayload, UncatchableError, Undefinable} from '@rainbow-o23/n1';
import {QueryRunner} from 'typeorm';
import {ERR_TYPEORM_DATASOURCE_NOT_FOUND} from '../error-codes';
import {PipelineStepSets, PipelineStepSetsExecutionContext, PipelineStepSetsOptions} from '../step';
import {TypeOrmDataSource, TypeOrmDataSourceManager} from '../typeorm';
import {
	DEFAULT_TRANSACTION_NAME,
	TypeOrmDataSourceName,
	TypeOrmTransactionalContext,
	TypeOrmTransactionKey,
	TypeOrmTransactionName
} from './types';

export interface TypeOrmTransactionalPipelineStepSetsOptions extends PipelineStepSetsOptions {
	dataSourceName: TypeOrmDataSourceName;
	transactionName?: TypeOrmTransactionName;
}

/**
 * if given transaction is open (transaction key exists), will use it.
 * so if there are multiple transactions need to be open, use different transaction name.
 * for different data source,
 */
export class TypeOrmTransactionalPipelineStepSets<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends PipelineStepSets<In, Out, InFragment, OutFragment> {
	private readonly _dataSourceName: TypeOrmDataSourceName;
	private readonly _transactionName: TypeOrmTransactionName;

	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	public constructor(options: TypeOrmTransactionalPipelineStepSetsOptions) {
		super(options);
		this._dataSourceName = options.dataSourceName;
		this._transactionName = (options.transactionName ?? '').trim() || DEFAULT_TRANSACTION_NAME;
	}

	public getDataSourceName(): TypeOrmDataSourceName {
		return this._dataSourceName;
	}

	public getTransactionName(): TypeOrmTransactionName {
		return this._transactionName;
	}

	public getTransactionKey(): TypeOrmTransactionKey {
		return `${this.getDataSourceName()}.${this.getTransactionName()}`;
	}

	/**
	 * throw error when data source not found
	 */
	protected async findDataSourceOrThrow(): Promise<Undefinable<TypeOrmDataSource>> {
		const typeOrmDataSource = await TypeOrmDataSourceManager.findDataSource(this.getDataSourceName(), this.getConfig());
		if (typeOrmDataSource == null) {
			throw new UncatchableError(ERR_TYPEORM_DATASOURCE_NOT_FOUND, `Data source[${this.getDataSourceName()}] not found.`);
		} else {
			return typeOrmDataSource;
		}
	}

	protected async createRunner(): Promise<[TypeOrmDataSource, QueryRunner]> {
		const typeOrmDataSource = await this.findDataSourceOrThrow();
		const dataSource = typeOrmDataSource.getDataSource();
		const runner = dataSource.createQueryRunner();
		await runner.connect();
		return [typeOrmDataSource, runner];
	}

	/**
	 * inherit transaction (use runner in context) if exists, otherwise create new runner
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async attachMineToInternalContext(inheritedContext: PipelineStepSetsExecutionContext, _request: PipelineStepData<In>): Promise<TypeOrmTransactionalContext> {
		const context = inheritedContext as TypeOrmTransactionalContext;
		if (context.$trans != null) {
			if (context.$trans[this.getTransactionKey()] != null) {
				// exists, do nothing
			} else {
				context.$trans[this.getTransactionKey()] = await this.createRunner();
			}
		} else {
			context.$trans = {[this.getTransactionKey()]: await this.createRunner()};
		}
		return context;
	}

	private getRunner(context: TypeOrmTransactionalContext): QueryRunner {
		return context.$trans[this.getTransactionKey()][1];
	}

	/**
	 * 1. create runner, attach to internal context
	 * 2. start transaction
	 * 3. run steps
	 * 4. commit or rollback transaction
	 * 5. release runner
	 */
	protected async performWithContext(
		request: PipelineStepData<In>,
		run: (request: PipelineStepData<In>, context: PipelineStepSetsExecutionContext) => Promise<OutFragment>): Promise<OutFragment> {
		let runner: QueryRunner = null;
		try {
			const context: TypeOrmTransactionalContext = await this.createInternalContext(request);
			runner = this.getRunner(context);
			await runner.startTransaction();
			const r = await run(request, context);
			await runner.commitTransaction();
			return r;
		} catch (e) {
			// noinspection PointlessBooleanExpressionJS
			if (runner != null) {
				try {
					// noinspection JSObjectNullOrUndefined
					await runner.rollbackTransaction();
				} catch (e) {
					this.getLogger().error(`Failed to rollback typeorm transaction[${this.getTransactionName()}] of data source[${this.getDataSourceName()}].`, e, this.constructor.name);
				}
			}
			throw e;
		} finally {
			if (runner != null) {
				try {
					await runner.release();
				} catch (e) {
					this.getLogger().error(`Failed to release typeorm query runner for transaction[${this.getTransactionName()}] of data source[${this.getDataSourceName()}].`, e, this.constructor.name);
				}
			}
		}
	}
}
