import {
	DefEnablement,
	ExposedPipelineDef,
	PipelineDef,
	PipelineStepDef,
	SnippetPipelineStepBuilderOptions
} from '@rainbow-o23/n4';

export const HelloWorld = (): PipelineDef & ExposedPipelineDef & DefEnablement => {
	return {
		type: 'pipeline',
		code: 'HelloWorld',
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