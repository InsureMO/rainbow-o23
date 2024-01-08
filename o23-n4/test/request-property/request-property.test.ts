import {createConfig, createLogger} from '@rainbow-o23/n1';
import * as fs from 'fs';
import * as path from 'path';
import {ParsedPipelineDef, registerDefaults, YmlReader} from '../../src';

const logger = createLogger();
const config = createConfig(logger);

test('Test Request Property Pipeline', async () => {
	const content = fs.readFileSync(path.resolve(__dirname, './request-property.yaml'), 'utf8');
	registerDefaults();
	const {code, def} = new YmlReader({config}).load(content) as ParsedPipelineDef;
	expect(code).toBe('RequestPropertyPipeline');
	const pipeline = await def.create({logger, config});
	const {payload} = await pipeline.perform({
		payload: {
			person: {
				name: 'John', age: 31,
				gender: 'M', birth: '2000/01/01',
				height: 180.0, weight: 78.4
			}
		}
	});
	expect(payload).not.toBeNull();
	expect(payload.name).toBe('John');
	expect(payload.person).not.toBeNull();
	expect(payload.person.name).toBe('John');
	expect(payload.person.age).toBeUndefined();
	expect(payload.person.gender).toBeUndefined();
	expect(payload.person.birth).toBeUndefined();
	expect(payload.person.height).toBeUndefined();
	expect(payload.person.weight).toBeUndefined();
	expect(Object.keys(payload.person).length).toBe(1);
});
