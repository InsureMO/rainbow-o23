import {
	Pipeline,
	PipelineBuilder,
	PipelineCode,
	PipelineOptions,
	PipelineStepBuilder,
	PipelineStepCode
} from '../pipeline';
import {Undefinable} from '../utils';

export class PipelineRepository {
	private static readonly PIPELINE_BUILDERS: Record<PipelineCode, PipelineBuilder> = {};
	private static readonly STEP_BUILDERS: Record<PipelineStepCode, PipelineStepBuilder> = {};

	private constructor() {
		// avoid extend
	}

	public static async findPipeline(code: PipelineCode, options: PipelineOptions): Promise<Undefinable<Pipeline>> {
		const builder = PipelineRepository.PIPELINE_BUILDERS[code];
		if (builder == null) {
			return (void 0);
		} else {
			return await builder.create(options);
		}
	}

	public static putPipeline(builders: Record<PipelineCode, PipelineBuilder>): Record<PipelineCode, PipelineBuilder> {
		return Object.keys(builders).reduce((duplicated, code) => {
			const existing = PipelineRepository.PIPELINE_BUILDERS[code];
			PipelineRepository.PIPELINE_BUILDERS[code] = builders[code];
			if (existing != null) {
				duplicated[code] = existing;
			}
			return duplicated;
		}, {} as Record<PipelineCode, PipelineBuilder>);
	}

	public static async findStep(code: PipelineStepCode): Promise<Undefinable<PipelineStepBuilder>> {
		return PipelineRepository.STEP_BUILDERS[code];
	}

	public static putStep(builders: Record<PipelineStepCode, PipelineStepBuilder>): Record<PipelineStepCode, PipelineStepBuilder> {
		return Object.keys(builders).reduce((duplicated, code) => {
			const existing = PipelineRepository.STEP_BUILDERS[code];
			PipelineRepository.STEP_BUILDERS[code] = builders[code];
			if (existing != null) {
				duplicated[code] = existing;
			}
			return duplicated;
		}, {} as Record<PipelineStepCode, PipelineStepBuilder>);
	}
}