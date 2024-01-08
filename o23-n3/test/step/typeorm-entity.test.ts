import {createConfig, createLogger} from '@rainbow-o23/n1';
import {Column, Entity, PrimaryColumn} from 'typeorm';
import {TypeOrmDataSourceHelper, TypeOrmDataSourceManager, TypeOrmLoadEntityByIdPipelineStep} from '../../src';

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

describe('TypeORM Entity Suite', () => {
	beforeAll(async () => {
		process.env.CFG_TYPEORM_TEST_TYPE = 'better-sqlite3';
		process.env.CFG_TYPEORM_TEST_SYNCHRONIZE = 'true';
		// in memory, kept in global cache, to make sure always use same one.
		process.env.CFG_TYPEORM_TEST_KEPT_ON_GLOBAL = 'true';
		await new TypeOrmDataSourceHelper(config).create({
			'TEST': [TestTable]
		});
		const repo = (await TypeOrmDataSourceManager.findDataSource('TEST')).getDataSource().getRepository(TestTable);
		await repo.insert({id: 1, content: 'hello world!'});
	});

	test('TypeORM load entity by id Pipeline Step Test #1', async () => {
		const step = new TypeOrmLoadEntityByIdPipelineStep({
			config, logger, dataSourceName: 'TEST', entityName: 'TestTable',
			autonomous: true
		});
		const request = {content: 1};
		const response = await step.perform(request);
		expect(response.content).not.toBeNull();
		expect(response.content.id).toBe(1);
		expect(response.content.content).toBe('hello world!');
	});

	afterAll((done) => {
		done();
	});
});
