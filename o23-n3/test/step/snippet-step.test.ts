import {createConfig, createLogger, PipelineExecutionContext} from '@rainbow-o23/n1';
import {SnippetPipelineStep} from '../../src';

const logger = createLogger();
const config = createConfig(logger);

test('Snippet Pipeline Step Test #1, + 100', async () => {
	const snippet = 'return $factor.base + 100;';
	const step = new SnippetPipelineStep({config, logger, snippet});
	const request = {content: {base: 1}, $context: new PipelineExecutionContext()};
	const response = await step.perform(request);
	expect(response.content).toEqual(101);
});

test('Snippet Pipeline Step Test #2, async + 100', async () => {
	const snippet = 'return await new Promise(resolve => resolve($factor.base + 100));';
	const step = new SnippetPipelineStep({config, logger, snippet});
	const request = {content: {base: 1}, $context: new PipelineExecutionContext()};
	const response = await step.perform(request);
	expect(response.content).toEqual(101);
});
