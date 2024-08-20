import {PipelineStepData, PipelineStepPayload, UncatchableError, Undefinable} from '@rainbow-o23/n1';
import {QueryRunner} from 'typeorm';
import {ERR_TYPEORM_DATASOURCE_NOT_FOUND, ERR_TYPEORM_TRANSACTION_NOT_FOUND} from '../error-codes';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from '../step';
import {DataSourceType, TypeOrmDataSource, TypeOrmDataSourceManager} from '../typeorm';
import {
	DEFAULT_TRANSACTION_NAME,
	TypeOrmDataSourceName,
	TypeOrmTransactionalContext,
	TypeOrmTransactionKey,
	TypeOrmTransactionName
} from './types';

export interface TypeOrmPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	dataSourceName: TypeOrmDataSourceName;
	/**
	 * to identify the transaction should be used, or ignore it to use the default transaction.
	 * transaction must be created by {@link TypeOrmTransactionalPipelineStepSets},
	 * otherwise raise exception when autonomous is false.
	 */
	transactionName?: TypeOrmTransactionName;
	/** when autonomous is true, transaction name should be ignored no matter what given */
	autonomous?: boolean;
}

// noinspection JSUnusedGlobalSymbols
export abstract class AbstractTypeOrmPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _dataSourceName: TypeOrmDataSourceName;
	private readonly _transactionName: TypeOrmTransactionName;
	private readonly _autonomous: boolean;

	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	public constructor(options: TypeOrmPipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		this._dataSourceName = options.dataSourceName;
		this._transactionName = options.transactionName || DEFAULT_TRANSACTION_NAME;
		this._autonomous = options.autonomous ?? false;
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

	public isAutonomous(): boolean {
		return this._autonomous;
	}

	protected isTransactional(request: PipelineStepData<In>): boolean {
		if (this.isAutonomous()) {
			// autonomous transaction
			return false;
		} else {
			const {$context} = request as PipelineStepData<In, TypeOrmTransactionalContext>;
			const transactionKey = this.getTransactionKey();
			if ($context == null || $context.$trans == null || $context.$trans[transactionKey] == null) {
				throw new UncatchableError(ERR_TYPEORM_TRANSACTION_NOT_FOUND, `Transaction[${transactionKey}] not found.`);
			} else {
				return true;
			}
		}
	}

	protected findTransactionalContext(request: PipelineStepData<In>): Undefinable<[TypeOrmDataSource, QueryRunner]> {
		const {$context} = request as PipelineStepData<In, TypeOrmTransactionalContext>;
		return $context?.$trans?.[this.getTransactionKey()];
	}

	protected findDataSourceType(): DataSourceType {
		return TypeOrmDataSourceManager.findDataSourceType(this.getDataSourceName(), this.getConfig());
	}

	/**
	 * returns undefined when data source not found
	 */
	protected async findDataSource(request: PipelineStepData<In>): Promise<Undefinable<TypeOrmDataSource>> {
		if (this.isTransactional(request)) {
			return this.findTransactionalContext(request)?.[0];
		} else {
			const typeOrmDataSource = await TypeOrmDataSourceManager.findDataSource(this.getDataSourceName(), this.getConfig());
			if (typeOrmDataSource == null) {
				return (void 0);
			} else {
				return typeOrmDataSource;
			}
		}
	}

	/**
	 * throw error when data source not found
	 */
	protected async findDataSourceOrThrow(request: PipelineStepData<In>): Promise<Undefinable<TypeOrmDataSource>> {
		let typeOrmDataSource: Undefinable<TypeOrmDataSource>;
		if (this.isTransactional(request)) {
			typeOrmDataSource = this.findTransactionalContext(request)?.[0];
		} else {
			typeOrmDataSource = await TypeOrmDataSourceManager.findDataSource(this.getDataSourceName(), this.getConfig());
		}
		if (typeOrmDataSource == null) {
			throw new UncatchableError(ERR_TYPEORM_DATASOURCE_NOT_FOUND, `Data source[${this.getDataSourceName()}] not found.`);
		} else {
			return typeOrmDataSource;
		}
	}

	protected async createRunner(request: PipelineStepData<In>): Promise<QueryRunner> {
		if (this.isTransactional(request)) {
			// use this to guard not found
			await this.findDataSourceOrThrow(request);
			return this.findTransactionalContext(request)?.[1];
		} else {
			const typeOrmDataSource = await this.findDataSourceOrThrow(request);
			const dataSource = typeOrmDataSource.getDataSource();
			const runner = dataSource.createQueryRunner();
			await runner.connect();
			return runner;
		}
	}

	/**
	 * 1. create runner,
	 * 2. start transaction,
	 * 3. run given function by created runner,
	 * 4. commit or rollback transaction,
	 * 4.1 handle rollback error when rolled back
	 * 4.1.1 throw error if anything(should be an error) returned,
	 * 4.1.2 do nothing if nothing returned,
	 * 5. release runner.
	 */
	protected async trans<R>(
		run: (runner: QueryRunner) => Promise<R>, handleRollbackError: (err: Error) => Undefinable<Error>,
		request: PipelineStepData<In>): Promise<R> {
		if (this.isTransactional(request)) {
			// use this to guard not found
			const runner = await this.createRunner(request);
			try {
				return await run(runner);
			} catch (e) {
				handleRollbackError(e);
				// throw anyway
				throw e;
			}
		} else {
			let runner: QueryRunner = null;
			try {
				runner = await this.createRunner(request);
				await runner.startTransaction();
				const r = await run(runner);
				await runner.commitTransaction();
				return r;
			} catch (err) {
				// noinspection PointlessBooleanExpressionJS
				if (runner != null) {
					try {
						// noinspection JSObjectNullOrUndefined
						await runner.rollbackTransaction();
					} catch (e) {
						this.getLogger().error(`Failed to rollback typeorm transaction of data source[${this.getDataSourceName()}].`, e, this.constructor.name);
					}
				}
				const error = handleRollbackError(err);
				if (error != null) {
					throw error;
				}
			} finally {
				if (runner != null) {
					try {
						await runner.release();
					} catch (e) {
						this.getLogger().error(`Failed to release typeorm query runner of data source[${this.getDataSourceName()}].`, e, this.constructor.name);
					}
				}
			}
		}
	}

	/**
	 * only when step is a sub step of {@link TypeOrmTransactionalPipelineStepSets}, and use the transaction which created by step sets,
	 * it is transactional, otherwise it is not.
	 *
	 * No transaction control simply means that there is no explicit transaction control internally,
	 * but it does not mean that write operations cannot be performed.
	 * If a write operation is performed, the data will be immediately committed to the database.
	 *
	 * 1. create runner,
	 * 2. run given function by created runner,
	 * 3. release runner.
	 */
	protected async autoTrans<R>(run: (runner: QueryRunner) => Promise<R>, request: PipelineStepData<In>): Promise<R> {
		if (this.isTransactional(request)) {
			const runner = await this.createRunner(request);
			return await run(runner);
		} else {
			let runner: QueryRunner = null;
			try {
				runner = await this.createRunner(request);
				return await run(runner);
			} finally {
				if (runner != null) {
					try {
						await runner.release();
					} catch (e) {
						this.getLogger().error(`Failed to release typeorm query runner of data source[${this.getDataSourceName()}].`, e, this.constructor.name);
						// ignore
					}
				}
			}
		}
	}
}
