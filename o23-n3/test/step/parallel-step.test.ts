import {createConfig, createLogger, PipelineStep, PipelineStepBuilder, PipelineStepOptions} from '@rainbow-o23/n1';
import {ParallelPipelineStepSets, SnippetPipelineStep} from '../../src';

const logger = createLogger();
const config = createConfig(logger);

test('Parallel Pipeline Step Test #1, + 100', async () => {
	const step = new ParallelPipelineStepSets({
		config, logger, steps: [
			new class implements PipelineStepBuilder {
				async create(options?: PipelineStepOptions): Promise<PipelineStep> {
					return new SnippetPipelineStep({config, logger, snippet: 'return $factor.base * 100;'});
				}
			},
			new class implements PipelineStepBuilder {
				async create(options?: PipelineStepOptions): Promise<PipelineStep> {
					return new SnippetPipelineStep({config, logger, snippet: 'return $factor.base * 200;'});
				}
			}
		]
	});
	const request = {content: {base: 1}};
	const response = await step.perform(request);
	expect(response.content).toEqual([100, 200]);
});
