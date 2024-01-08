import {
	AbstractPipeline,
	Pipeline,
	PipelineBuilder,
	PipelineCode,
	PipelineOptions,
	PipelineStepBuilder
} from '@rainbow-o23/n1';
import {SubStepsReader} from './sub-steps-reader';
import {ParsedPipelineDef, PipelineDef} from './types';

export class PipelineReader {
	private constructor() {
		// avoid extend
	}

	public static read(def: PipelineDef): ParsedPipelineDef {
		const {code, steps, ...rest} = def;
		(steps ?? []).forEach(step => step.type = 'step');

		return {code, type: 'pipeline', def: {create: this.createBuilder(def)}, ...rest};
	}

	protected static createBuilder(def: PipelineDef): PipelineBuilder['create'] {
		const {code, steps} = def;
		const stepBuilders = steps.map(step => SubStepsReader.readSubStep(step).def);
		// pipeline is a wrapper of steps, all steps builders were built, and in context.
		return async (options?: PipelineOptions): Promise<Pipeline> => {
			const PipelineClass = class extends AbstractPipeline {
				public getCode(): PipelineCode {
					return code;
				}

				protected getStepBuilders(): Array<PipelineStepBuilder> {
					return stepBuilders;
				}
			};
			Object.defineProperty(PipelineClass, 'name', {value: code});
			return new PipelineClass(options);
		};
	}
}