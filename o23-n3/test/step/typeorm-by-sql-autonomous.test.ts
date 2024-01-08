import {createConfig, createLogger} from '@rainbow-o23/n1';
import {Column, Entity, PrimaryColumn} from 'typeorm';
import {
	TypeOrmBulkSaveBySQLPipelineStep,
	TypeOrmDataSourceHelper,
	TypeOrmDataSourceManager,
	TypeOrmLoadManyBySQLPipelineStep,
	TypeOrmLoadOneBySQLPipelineStep,
	TypeOrmSaveBySQLPipelineStep
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

describe('TypeORM SQL Autonomous Suite', () => {
	beforeAll(async () => {
		process.env.CFG_TYPEORM_TEST_TYPE = 'better-sqlite3';
		process.env.CFG_TYPEORM_TEST_SYNCHRONIZE = 'true';
		// in memory, kept in global cache, to make sure always use same one.
		process.env.CFG_TYPEORM_TEST_KEPT_ON_GLOBAL = 'true';
		// process.env.CFG_TYPEORM_TEST_LOGGING = 'true';
		await new TypeOrmDataSourceHelper(config).create({
			'TEST': [TestTable]
		});
		const repo = (await TypeOrmDataSourceManager.findDataSource('TEST')).getDataSource().getRepository(TestTable);
		await repo.insert({id: 1, content: 'hello world!'});
		await repo.insert({id: 2, content: 'good-bye world!'});
	});

	test('TypeORM load one by sql Pipeline Step Test #1', async () => {
		// noinspection SqlResolve
		const step = new TypeOrmLoadOneBySQLPipelineStep({
			config, logger, dataSourceName: 'TEST', sql: 'SELECT ID id, CONTENT content FROM T_TEST_TABLE WHERE ID = ?',
			autonomous: true
		});
		const request = {content: {params: [1]}};
		const response = await step.perform(request);
		expect(response.content).not.toBeNull();
		expect(response.content.id).toBe(1);
		expect(response.content.content).toBe('hello world!');
	});

	test('TypeORM insert one by sql Pipeline Step Test #1', async () => {
		// noinspection SqlResolve
		const step = new TypeOrmSaveBySQLPipelineStep({
			config, logger, dataSourceName: 'TEST', sql: 'INSERT INTO T_TEST_TABLE(ID, CONTENT) VALUES (?, ?)',
			autonomous: true, mergeRequest: 'id'
		});
		const request = {content: {values: [3, 'another world!']}};
		const response = await step.perform(request);
		expect(response.content).not.toBeNull();
		expect(response.content.id).toBe(3);
	});

	test('TypeORM update one by sql Pipeline Step Test #1', async () => {
		// noinspection SqlResolve
		const step = new TypeOrmSaveBySQLPipelineStep({
			config, logger, dataSourceName: 'TEST', sql: 'UPDATE T_TEST_TABLE SET CONTENT = ? WHERE ID = ?',
			autonomous: true, mergeRequest: 'count'
		});
		const request = {content: {values: ['world #3!', 3]}};
		const response = await step.perform(request);
		expect(response.content).not.toBeNull();
		// DON'T KNOW WHY THIS IS 3, SEEMS SHOULD BE 1 ACCORDING TO BETTER-SQLITE3 DOCUMENT
		// BUT CURRENTLY IT RETURNS COUNT OF THIS TABLE, NOT IMPACTED ROW COUNT
		expect(response.content.count).toBe(3);
	});

	test('TypeORM insert many by sql Pipeline Step Test #1', async () => {
		// noinspection SqlResolve
		const step = new TypeOrmBulkSaveBySQLPipelineStep({
			config, logger, dataSourceName: 'TEST', sql: 'INSERT INTO T_TEST_TABLE(ID, CONTENT) VALUES (?, ?)',
			autonomous: true, mergeRequest: 'ids'
		});
		const request = {
			content: {
				items: [[4, 'world #4!'], [5, 'world #5!']]
			}
		};
		const response = await step.perform(request);
		expect(response.content).not.toBeNull();
		expect(response.content.ids.length).toBe(2);
		expect(response.content.ids[0]).toBe(4);
		expect(response.content.ids[1]).toBe(5);
	});

	test('TypeORM load many by sql Pipeline Step Test #1', async () => {
		// noinspection SqlResolve
		const step = new TypeOrmLoadManyBySQLPipelineStep<any, Array<TestTable>>({
			config, logger, dataSourceName: 'TEST', sql: 'SELECT ID id, CONTENT content FROM T_TEST_TABLE',
			autonomous: true
		});
		const request = {content: (void 0)};
		const response = await step.perform(request);
		expect(response.content).not.toBeNull();
		expect(Array.isArray(response.content)).toBeTruthy();
		expect(response.content[2].content).toBe('world #3!');
	});

	afterAll((done) => {
		done();
	});
});
