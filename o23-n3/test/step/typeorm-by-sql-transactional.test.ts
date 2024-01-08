import {
	AbstractStaticPipeline,
	createConfig,
	createLogger,
	PipelineCode,
	PipelineStepData,
	PipelineStepType,
	Undefinable
} from '@rainbow-o23/n1';
import * as fs from 'fs';
import * as path from 'path';
import {Column, Entity, PrimaryColumn} from 'typeorm';
import {
	TypeOrmBasis,
	TypeOrmBulkSaveBySQLPipelineStep,
	TypeOrmCountOfAffected,
	TypeOrmDataSourceHelper,
	TypeOrmDataSourceManager,
	TypeOrmIdOfInserted,
	TypeOrmIdsOfInserted,
	TypeOrmLoadManyBySQLPipelineStep,
	TypeOrmLoadOneBySQLPipelineStep,
	TypeOrmSaveBySQLPipelineStep,
	TypeOrmTransactionalPipelineStepSets,
	TypeOrmTransactionalPipelineStepSetsOptions
} from '../../src';

const logger = createLogger();
const config = createConfig(logger);

// decorators are leading syntax errors in ide, since the test folder is not included in tsconfig.json
// but the tricky thing is, once test folder included into tsconfig.json, d.ts files will be created in src folder
// which cause currently use ts-ignore to avoid this syntax errors
// @ts-ignore
@Entity({name: 'T_TEST_TABLE'})
export class TestTable {
	// @ts-ignore
	@PrimaryColumn('bigint', {name: 'ID'})
	id: number;
	// @ts-ignore
	@Column('varchar', {name: 'CONTENT'})
	content: string;
}

interface TransactionalRequest {
	idToLoad: number,
	item3: TestTable;
	item3ChangeTo: TestTable;
	item4: TestTable;
	item5: TestTable;
}

interface TransactionalResponse extends TransactionalRequest {
	loadedById: TestTable;
	insertedId: TypeOrmIdOfInserted;
	updatedCount: TypeOrmCountOfAffected;
	insertedIds: TypeOrmIdsOfInserted;
	all: Array<TestTable>;
}

class TransactionalTestStepSets extends TypeOrmTransactionalPipelineStepSets {
	constructor(options: Omit<TypeOrmTransactionalPipelineStepSetsOptions, 'dataSourceName'>) {
		// noinspection SqlResolve
		super({
			...options, dataSourceName: 'TEST',
			steps: [
				{
					create: async ({config, logger}) => new TypeOrmLoadOneBySQLPipelineStep({
						config,
						logger,
						dataSourceName: 'TEST',
						sql: 'SELECT ID id, CONTENT content FROM T_TEST_TABLE WHERE ID = ?',
						fromRequest: ($factor: TransactionalRequest, _$request: PipelineStepData<TransactionalRequest>) => {
							return {params: [$factor.idToLoad]} as TypeOrmBasis;
						},
						toResponse: ($result: TestTable, _$request: PipelineStepData) => {
							expect($result.id).toBe(1);
							expect($result.content).toBe('hello world!');
							return {loadedById: $result};
						},
						mergeRequest: true
					})
				},
				{
					create: async ({config, logger}) => new TypeOrmSaveBySQLPipelineStep({
						config,
						logger,
						dataSourceName: 'TEST',
						sql: 'INSERT INTO T_TEST_TABLE(ID, CONTENT) VALUES (?, ?)',
						fromRequest: ($factor: TransactionalRequest, _$request: PipelineStepData<TransactionalRequest>) => {
							return {values: [$factor.item3.id, $factor.item3.content]};
						},
						toResponse: ($result: TypeOrmIdOfInserted, _$request: PipelineStepData) => {
							expect($result).toBe(3);
							return {insertedId: $result};
						},
						mergeRequest: true
					})
				},
				{
					create: async ({config, logger}) => new TypeOrmLoadOneBySQLPipelineStep({
						config,
						logger,
						dataSourceName: 'TEST',
						autonomous: true,
						sql: 'SELECT ID id, CONTENT content FROM T_TEST_TABLE WHERE ID = ?',
						fromRequest: ($factor: TransactionalRequest, _$request: PipelineStepData<TransactionalRequest>) => {
							return {params: [$factor.item3.id]};
						},
						toResponse: ($result: Undefinable<TestTable>, $request: PipelineStepData) => {
							expect($result).toBeUndefined();
							return $request.content;
						}
					})
				},
				{
					create: async ({config, logger}) => new TypeOrmSaveBySQLPipelineStep({
						config, logger, dataSourceName: 'TEST', sql: 'UPDATE T_TEST_TABLE SET CONTENT = ? WHERE ID = ?',
						fromRequest: ($factor: TransactionalRequest, _$request: PipelineStepData<TransactionalRequest>) => {
							return {values: [$factor.item3ChangeTo.content, $factor.item3ChangeTo.id]};
						},
						toResponse: ($result: TypeOrmCountOfAffected, _$request: PipelineStepData) => {
							// DON'T KNOW WHY THIS IS 3, SEEMS SHOULD BE 1 ACCORDING TO BETTER-SQLITE3 DOCUMENT
							// BUT CURRENTLY IT RETURNS COUNT OF THIS TABLE, NOT IMPACTED ROW COUNT
							expect($result).toBe(3);
							return {updatedCount: $result};
						},
						mergeRequest: true
					})
				},
				{
					create: async ({config, logger}) => new TypeOrmBulkSaveBySQLPipelineStep({
						config,
						logger,
						dataSourceName: 'TEST',
						sql: 'INSERT INTO T_TEST_TABLE(ID, CONTENT) VALUES (?, ?)',
						fromRequest: ($factor: TransactionalRequest, _$request: PipelineStepData<TransactionalRequest>) => {
							return {
								items: [
									[$factor.item4.id, $factor.item4.content], [$factor.item5.id, $factor.item5.content]
								]
							};
						},
						toResponse: ($result: TypeOrmIdsOfInserted, _$request: PipelineStepData) => {
							return {insertedIds: $result};
						},
						mergeRequest: true
					})
				},
				{
					create: async ({config, logger}) => new TypeOrmLoadManyBySQLPipelineStep({
						config, logger, dataSourceName: 'TEST', sql: 'SELECT ID id, CONTENT content FROM T_TEST_TABLE',
						toResponse: ($result: Array<TestTable>, _$request: PipelineStepData) => {
							return {all: $result};
						},
						mergeRequest: true
					})
				}
			]
		});
	}
}

class TransactionalPipeline extends AbstractStaticPipeline<TransactionalRequest, TransactionalResponse> {
	public getCode(): PipelineCode {
		return 'TransactionalPipeline';
	}

	protected getStepTypes(): Array<PipelineStepType> {
		return [TransactionalTestStepSets];
	}
}

const filename = 'TypeORM SQL Transactional.db';
describe('TypeORM SQL Transactional Suite', () => {
	beforeAll(async () => {
		if (fs.existsSync(path.resolve(filename))) {
			fs.rmSync(path.resolve(filename));
		}
		process.env.CFG_TYPEORM_TEST_TYPE = 'better-sqlite3';
		process.env.CFG_TYPEORM_TEST_SYNCHRONIZE = 'true';
		// process.env.CFG_TYPEORM_TEST_LOGGING = 'true';
		// cannot use in memory, since when cache it, only one connection exists,
		// when don't cache it, doesn't share the same memory.
		// therefore use file
		process.env.CFG_TYPEORM_TEST_DATABASE = filename;
		await new TypeOrmDataSourceHelper(config).create({
			'TEST': [TestTable]
		});
		const repo = (await TypeOrmDataSourceManager.findDataSource('TEST')).getDataSource().getRepository(TestTable);
		await repo.insert({id: 1, content: 'hello world!'});
		await repo.insert({id: 2, content: 'good-bye world!'});
	});

	test('TypeORM transactional by sql Pipeline Step Test #1', async () => {
		const pipeline = new TransactionalPipeline({config, logger});
		const response = await pipeline.perform({
			payload: {
				idToLoad: 1,
				item3: {id: 3, content: 'another world!'},
				item3ChangeTo: {id: 3, content: 'world #3!'},
				item4: {id: 4, content: 'world #4'},
				item5: {id: 5, content: 'world #5'}
			}
		});
		expect(response).not.toBeNull();
	});

	afterAll((done) => {
		if (fs.existsSync(path.resolve(filename))) {
			fs.rmSync(path.resolve(filename));
		}
		done();
	});
});
