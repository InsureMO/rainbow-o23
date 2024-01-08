import {createConfig, createLogger} from '@rainbow-o23/n1';
import * as fs from 'fs';
import * as path from 'path';
import {ParsedPipelineDef, registerDefaults, YmlReader} from '../../src';

const logger = createLogger();
const config = createConfig(logger);

test('Test Simple Pipeline', async () => {
	const content = fs.readFileSync(path.resolve(__dirname, './simple.yaml'), 'utf8');
	registerDefaults();
	const {code, def} = new YmlReader({config}).load(content) as ParsedPipelineDef;
	expect(code).toBe('SimplePipeline');
	const pipeline = await def.create({logger, config});
	const {payload: {result, result2}} = await pipeline.perform({payload: {value: 1}});
	expect(result).toBe(202);
	expect(result2).toBe(102);
});
