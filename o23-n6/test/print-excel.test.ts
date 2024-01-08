import {createConfig, createLogger} from '@rainbow-o23/n1';
import * as fs from 'fs';
import * as path from 'path';
import {PrintExcelPipelineStep} from '../src';

const logger = createLogger();
const config = createConfig(logger);

test('Test Print Excel', async () => {
	process.env.CFG_PRINT_EXCEL_TEMPORARY_FILE_KEEP = 'true';
	const template = fs.readFileSync(path.resolve(__dirname, 'template.xlsx'));
	const data = {
		createDate: '2023-12-1',
		groups: [
			{
				depts: [
					{name: 'Development', cashierName: 'John', cashInTxn: 134.4, cashInAmt: 1344},
					{name: 'Research', cashierName: 'Joe', cashInTxn: 159.67, cashInAmt: 1277.36}
				],
				subTotal: {
					cashInTxn: 294.07, cashInAmt: 2621.36
				}
			},
			{
				depts: [
					{name: 'Development', cashierName: 'John', cashInTxn: 104.4, cashInAmt: 1044},
					{name: 'Research', cashierName: 'Joe', cashInTxn: 129.67, cashInAmt: 977.36}
				],
				subTotal: {
					cashInTxn: 234.07, cashInAmt: 2021.36
				}
			}
		],
		cashInTxnTotal: 528.14,
		cashInAmtTotal: 4642.72,
		persons: [
			{name: 'John', age: 25, birthday: '1998-03-27'},
			{name: 'Joe', age: 27, birthday: '1996-08-12'}
		],
		summary: {
			field1: 100,
			field2: 200
		}
	};

	const step = new PrintExcelPipelineStep({config, logger});
	const {content: {file}} = await step.perform({content: {template, data}});
	expect(file).not.toBeNull();
});