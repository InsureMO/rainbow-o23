import {PipelineStepType} from '@rainbow-o23/n1';
import {FragmentaryPipelineStepOptions, SnowflakePipelineStep} from '@rainbow-o23/n3';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions
} from './abstract-fragmentary-step-builder';

export class SnowflakePipelineStepBuilder extends AbstractFragmentaryPipelineStepBuilder<FragmentaryPipelineStepBuilderOptions, FragmentaryPipelineStepOptions, SnowflakePipelineStep> {
	protected getStepType(): PipelineStepType<SnowflakePipelineStep> {
		return SnowflakePipelineStep;
	}
}
