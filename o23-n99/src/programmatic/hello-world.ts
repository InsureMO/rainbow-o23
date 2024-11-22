import {PipelineDef, PipelineStepDef, SnippetPipelineStepBuilderOptions} from '@rainbow-o23/n4';
import {DefEnablement, ExposedPipelineDef} from '@rainbow-o23/n4/src';

export const HelloWorld = (): PipelineDef & ExposedPipelineDef & DefEnablement => {
	return {
		type: 'pipeline',
		code: 'hello-world',
		route: '/api/hello-world',
		method: 'get',
		enabled: true,
		steps: [
			{
				type: 'step',
				name: 'Say hello to world',
				use: 'snippet',
				snippet: async () => {
					return 'Hello, world!';
				}
			} as PipelineStepDef & SnippetPipelineStepBuilderOptions
		]
	};
};