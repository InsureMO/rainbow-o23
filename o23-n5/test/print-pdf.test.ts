import {createConfig, createLogger} from '@rainbow-o23/n1';
import {PrintPdfPipelineStep} from '../src';

const logger = createLogger();
const config = createConfig(logger);

describe('Test Print PDF', () => {
	test('Test Print PDF', async () => {
		// process.env.CFG_PUPPETEER_PAGE_KEEP = 'true';
		process.env.CFG_PUPPETEER_BROWSER_CACHE = 'false';
		const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <div>
        <h1 style="color: red" data-print="field" data-print-field="type">Name</h1>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Birthday</th>
                </tr>
            </thead>
            <tbody>
                <tr data-print="loop" data-print-field="information">
                    <td data-print="field" style="color: red" data-print-field="name">Name</td>
                    <td data-print="field" data-print-field="age">Age</td>
                    <td data-print="field" data-print-field="birthday">Birthday</td>
                    <td>
                        <span data-print="loop" data-print-field="addresses">
                            <span data-print="field" data-print-field="" style="display: block">Address</span>
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
        <table>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Product Name</th>
                    <th>Product Info</th>
                </tr>
            </thead>
            <tbody>
                <tr data-print="loop" data-print-field="policy">
                    <td data-print="field" style="color: red" data-print-field="id">id</td>
                    <td data-print="field" data-print-field="productName">productName</td>
                    <td data-print="field" data-print-field="productInfo">productInfo</td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
`;
		const data = {
			type: 'Test Pdf',
			information: [
				{name: 'John', age: 25, birthday: '1998-03-27', addresses: ['address line 1', 'address line 2']},
				{name: 'Jane', age: 27, birthday: '1996-08-12', addresses: ['address line 3']},
				{name: 'Mike', age: 21, birthday: '2002-11-20'}
			],
			policy: [
				{id: 1000001, productName: 'PRDT-001', productInfo: 'PRDT-001-INFO'},
				{id: 1000002, productName: 'PRDT-002', productInfo: 'PRDT-002-INFO'}
			]
		};

		const step = new PrintPdfPipelineStep({config, logger});
		const {content: {file}} = await step.perform({content: {template, data}});
		expect(file).not.toBeNull();
	});

	// afterAll(async (done) => {
	// 	done();
	// });
});