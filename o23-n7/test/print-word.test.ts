import {createConfig, createLogger} from '@rainbow-o23/n1';
import * as fs from 'fs';
import * as path from 'path';
import {PrintWordPipelineStep} from '../src';

const logger = createLogger();
const config = createConfig(logger);

test('Test Print Word', async () => {
	const template = fs.readFileSync(path.resolve(__dirname, 'template.docx'));
	const logoData = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="63" height="20" role="img" aria-label="InsureMO"><title>InsureMO</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="63" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="0" height="20" fill="#777af2"/><rect x="0" width="63" height="20" fill="#777af2"/><rect width="63" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110"><text aria-hidden="true" x="315" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="530">InsureMO</text><text x="315" y="140" transform="scale(.1)" fill="#fff" textLength="530">InsureMO</text></g></svg>`, 'utf-8');
	const data = {
		createDate: '2023-12-1',
		project: {
			name: 'Rainbow O23',
			url: 'https://github.com/InsureMO/rainbow-o23'
		},
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
		]
	};

	const step = new PrintWordPipelineStep({config, logger});
	const {content: {file}} = await step.perform({
		content: {
			template, data, jsContext: {
				link: () => {
					return {url: data.project.url, label: data.project.name};
				},
				logo: () => {
					const data = logoData;
					return {width: 1.66687479, height: 0.5291666, data, extension: '.svg'};
				},
				html: () => {
					return `<meta charset="UTF-8"><body><strong style="color: red;">This paragraph should be red and strong</strong></body>`;
				}
			}
		}
	});
	expect(file).not.toBeNull();
	fs.writeFileSync(path.resolve(__dirname, 'output.docx'), file);
});
