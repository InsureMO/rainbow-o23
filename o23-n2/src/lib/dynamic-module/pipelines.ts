import {DefaultPipelineBuilder, PipelineBuilder, PipelineCode, PipelineType} from '@rainbow-o23/n1';
import {DynamicModulePipeline} from './types';

export class DynamicModulePipelines {
	private constructor() {
		// avoid extend
	}

	public static createBuilder(typeOrBuilder: PipelineType | PipelineBuilder): PipelineBuilder {
		if (typeof typeOrBuilder === 'function') {
			return new DefaultPipelineBuilder(typeOrBuilder);
		} else {
			return typeOrBuilder;
		}
	}

	public static create(pipelines?: Array<DynamicModulePipeline>): Record<PipelineCode, PipelineBuilder> {
		return (pipelines ?? []).reduce((built, pipeline) => {
			built[pipeline.code] = DynamicModulePipelines.createBuilder(pipeline.def);
			return built;
		}, {} as Record<PipelineCode, PipelineBuilder>);
	}
}