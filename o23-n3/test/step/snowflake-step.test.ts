import {createConfig, createLogger, PipelineExecutionContext} from '@rainbow-o23/n1';
import {SnowflakePipelineStep} from '../../src';

const logger = createLogger();
const config = createConfig(logger);

test('Snowflake Pipeline Step Test #1, replace content', async () => {
	const step = new SnowflakePipelineStep({config, logger, mergeRequest: '$id'});
	const request = {content: (void 0), $context: new PipelineExecutionContext()};
	const response = await step.perform(request);
	expect(response.content).not.toBeNull();
	expect(response.content.$id).not.toBeNull();
});

test('Snowflake Pipeline Step Test #2, merge content', async () => {
	const step = new SnowflakePipelineStep({config, logger, mergeRequest: '$id'});
	const request = {content: {base: 1}, $context: new PipelineExecutionContext()};
	const response = await step.perform(request);
	expect(response.content).not.toBeNull();
	expect(response.content.base).toEqual(1);
	expect(response.content.$id).not.toBeNull();
});
