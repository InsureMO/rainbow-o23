import {createConfig, createLogger, PipelineExecutionContext} from '@rainbow-o23/n1';
import {TypeOrmDataSourceHelper, TypeOrmLoadManyBySQLUseCursorPipelineStep} from '../../src';

const logger = createLogger();
const config = createConfig(logger);

describe('TypeORM Cursor Suite', () => {
	beforeAll(async () => {
		process.env.CFG_TYPEORM_TEST_HOST = 'localhost';
		process.env.CFG_TYPEORM_TEST_USERNAME = 'o23';
		process.env.CFG_TYPEORM_TEST_PASSWORD = 'o23';
		// process.env.CFG_TYPEORM_TEST_STREAM_PAUSE_ENABLED = 'true'
		const type = 'my' + 'sql';
		if (type === 'mysql') {
			process.env.CFG_TYPEORM_TEST_TYPE = 'mysql';
			process.env.CFG_TYPEORM_TEST_PORT = '3306';
			process.env.CFG_TYPEORM_TEST_DATABASE = 'o23';
		} else if (type === 'pgsql') {
			process.env.CFG_TYPEORM_TEST_TYPE = 'pgsql';
			process.env.CFG_TYPEORM_TEST_PORT = '5432';
			process.env.CFG_TYPEORM_TEST_DATABASE = 'postgres';
			process.env.CFG_TYPEORM_TEST_SCHEMA = 'o23';
		} else if (type === 'mssql') {
			process.env.CFG_TYPEORM_TEST_TYPE = 'mssql';
			process.env.CFG_TYPEORM_TEST_PORT = '1433';
			process.env.CFG_TYPEORM_TEST_PASSWORD = 'o23O23o23!';
			process.env.CFG_TYPEORM_TEST_DATABASE = 'o23';
			process.env.CFG_TYPEORM_TEST_SCHEMA = 'dbo';
			process.env.CFG_TYPEORM_TEST_TRUST_SERVER_CERTIFICATE = 'true';
		} else {
			process.env.CFG_TYPEORM_TEST_TYPE = 'oracle';
			process.env.CFG_TYPEORM_TEST_HOST = '127.0.0.1';
			process.env.CFG_TYPEORM_TEST_PORT = '1521';
			process.env.CFG_TYPEORM_TEST_SERVICE_NAME = 'orcl';
		}
		// process.env.CFG_TYPEORM_TEST_LOGGING = 'true';
		await new TypeOrmDataSourceHelper(config).create({});
		// const repo = (await TypeOrmDataSourceManager.findDataSource('TEST', config)).getDataSource().getRepository(TestTable);
	});

	test('TypeORM load many using cursor #1', async () => {
		// noinspection SqlResolve
		const step = new TypeOrmLoadManyBySQLUseCursorPipelineStep<any, any>({
			config, logger, dataSourceName: 'TEST', sql: 'SELECT * FROM T_O23_DB_CHANGE_LOG',
			autonomous: true
		});
		const request = {content: (void 0), $context: new PipelineExecutionContext()};
		const response = await step.perform(request);
		expect(response.content).not.toBeNull();
		console.log(response.content);
	});

	afterAll((done) => {
		done();
	});
});
