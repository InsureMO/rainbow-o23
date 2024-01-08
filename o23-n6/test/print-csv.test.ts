import {createConfig, createLogger} from '@rainbow-o23/n1';
import {PrintCsvPipelineStep} from '../src';

const logger = createLogger();
const config = createConfig(logger);

test('Test Print CSV', async () => {
	const template = `column1,column2
$type
Name,Age,Birthday
$information.start
$name,$age,$birthday
$addresses.start
$.$
$addresses.end
$information.end
Id,Product Name,Product Info
$policy.start
$id,$productName,$productInfo
$policy.end`;
	const data = {
		type: 'Test CSV',
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

	const step = new PrintCsvPipelineStep({config, logger});
	const {content: {file}} = await step.perform({content: {template, data}});
	expect(file).not.toBeNull();
	expect(file.toString()).toEqual(`column1,column2
Test CSV
Name,Age,Birthday
John,25,1998-03-27
address line 1
address line 2
Jane,27,1996-08-12
address line 3
Mike,21,2002-11-20
Id,Product Name,Product Info
1000001,PRDT-001,PRDT-001-INFO
1000002,PRDT-002,PRDT-002-INFO
`);
});