import {DeepPartial, ObjectLiteral, QueryRunner} from 'typeorm';
import {PipelineStepSetsExecutionContext} from '../step';
import {TypeOrmDataSource} from '../typeorm';

export type TypeOrmIdType = string | number | bigint;
export type TypeOrmDataSourceName = string;
export type TypeOrmTransactionName = string;
export type TypeOrmTransactionKey = `${TypeOrmDataSourceName}.${TypeOrmTransactionName}`;
export type TypeOrmEntityValue = string | number | bigint | boolean | Date | null | undefined;
export type TypeOrmEntityToLoad = DeepPartial<ObjectLiteral>;
export type TypeOrmEntityToSave = DeepPartial<ObjectLiteral>;
export type TypeOrmSql = string;
export type TypeOrmIdOfInserted = TypeOrmIdType;
export type TypeOrmIdsOfInserted = Array<TypeOrmIdOfInserted>;
export type TypeOrmCountOfAffected = number;
export type TypeOrmCountsOfAffected = Array<TypeOrmCountOfAffected>;
export type TypeOrmWrittenResult = TypeOrmIdOfInserted | TypeOrmCountOfAffected;
export type TypeOrmBulkWrittenResult = TypeOrmIdsOfInserted | TypeOrmCountsOfAffected;

export const DEFAULT_TRANSACTION_NAME: TypeOrmTransactionName = '$default-transaction';

export interface TypeOrmTransactionalContext extends PipelineStepSetsExecutionContext {
	$trans: Record<TypeOrmTransactionKey, [TypeOrmDataSource, QueryRunner]>;
}
