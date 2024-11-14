import {createConfig, createLogger, PipelineStepData} from '@rainbow-o23/n1';
import {TypeOrmDataSourceHelper} from '@rainbow-o23/n3';
import * as fs from 'fs';
import * as path from 'path';
import {EnhancedPipelineStepHelpers, PrintCsvPipelineStep, PrintExcelPipelineStep} from '../src';

const logger = createLogger();
const config = createConfig(logger);

describe('Print CSV Use TypeOrm Suite', () => {
	beforeAll(async () => {
		process.env.CFG_PRINT_EXCEL_TEMPORARY_FILE_KEEP = 'true';

		process.env.CFG_TYPEORM_TEST_TYPE = 'pgsql';
		process.env.CFG_TYPEORM_TEST_HOST = 'localhost';
		process.env.CFG_TYPEORM_TEST_PORT = '5432';
		process.env.CFG_TYPEORM_TEST_USERNAME = 'o23';
		process.env.CFG_TYPEORM_TEST_PASSWORD = 'o23';
		process.env.CFG_TYPEORM_TEST_DATABASE = 'postgres';
		process.env.CFG_TYPEORM_TEST_SCHEMA = 'o23';
		// process.env.CFG_TYPEORM_TEST_LOGGING = 'true';
		await new TypeOrmDataSourceHelper(config).create({});
		// const repo = (await TypeOrmDataSourceManager.findDataSource('TEST', config)).getDataSource().getRepository(TestTable);
	});

	const fromRequest = async ($factor: any, $request: PipelineStepData<any>, $helpers: EnhancedPipelineStepHelpers) => {
		const {template, data} = $factor;
		return {
			template,
			data: {
				...data,
				logs: await $helpers.$createTypeOrmIterator({
					dataSourceName: 'TEST',
					autonomous: true,
					sql: 'SELECT id, author, file_name as "fileName" from t_o23_db_change_log where id < $id',
					params: {id: 100},
					fetchSize: 5,
					$context: $request.$context
				})
			}
		};
	};

	test('Test Print CSV Use TypeOrm', async () => {
		const template = `column1,column2
$type
Id,Author,File Name
$logs.start
$id,$author,$fileName
$logs.end`;
		const data = {
			type: 'Test CSV Use TypeOrm'
		};

		// use from request to build a typeorm iterator
		const step = new PrintCsvPipelineStep({name: 'TestPrintCsvUseCursor', config, logger, fromRequest});
		const {content: {file}} = await step.perform({content: {template, data}});
		expect(file).not.toBeNull();
		expect(file.toString()).toEqual(`column1,column2
Test CSV Use TypeOrm
Id,Author,File Name
1,brad.wu,/db-scripts/pgsql/0.1.0/01-server/001-pipelines.ddl.sql
2,brad.wu,/db-scripts/pgsql/0.1.0/02-d9/001-d9.ddl.sql
3,brad.wu,/db-scripts/pgsql/0.1.0/02-d9/002-d9-samples.dml.sql
4,brad.wu,/db-scripts/pgsql/0.1.0/03-print/001-print-templates.ddl.sql
5,brad.wu,/db-scripts/pgsql/0.1.0/03-print/002-print-tasks.ddl.sql
6,brad.wu,/db-scripts/pgsql/0.1.0/03-print/003-print-samples.dml.sql
7,brad.wu,/db-scripts/pgsql/0.1.0/03-print/004-print-samples.dml.sql
8,brad.wu,/db-scripts/pgsql/0.1.0/03-print/005-print-templates.ddl.sql
9,brad.wu,/db-scripts/pgsql/0.1.0/03-print/006-print-samples.dml.sql
`);
	});

	test('Test Print Excel Use TypeOrm', async () => {
		const template = fs.readFileSync(path.resolve(__dirname, 'use-typeorm.xlsx'));
		const step = new PrintExcelPipelineStep({name: 'TestPrintExcelUseCursor', config, logger, fromRequest});
		const data = {
			type: 'Test Excel Use TypeOrm'
		};
		const {content: {file}} = await step.perform({content: {template, data}});
		expect(file).not.toBeNull();
	});

	afterAll((done) => {
		done();
	});
});
