import {DeepPartial, ObjectLiteral, QueryRunner} from 'typeorm';
import {PipelineStepSetsContext} from '../step';
import {TypeOrmDataSource} from '../typeorm';

export type TypeOrmIdType = string | number | bigint;
export type TypeOrmDataSourceName = string;
export type TypeOrmTransactionName = string;
export type TypeOrmTransactionKey = `${TypeOrmDataSourceName}.${TypeOrmTransactionName}`;
export type TypeOrmEntityName = string;
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

export interface TypeOrmTransactionalContext extends PipelineStepSetsContext {
	$trans: Record<TypeOrmTransactionKey, [TypeOrmDataSource, QueryRunner]>;
}
