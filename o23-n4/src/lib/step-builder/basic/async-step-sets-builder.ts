import {PipelineStepType} from '@rainbow-o23/n1';
import {AsyncPipelineStepSets, PipelineStepSetsOptions} from '@rainbow-o23/n3';
import {PipelineStepSetsBuilder, PipelineStepSetsBuilderOptions} from './step-sets-builder';

export class AsyncPipelineStepSetsBuilder
	extends PipelineStepSetsBuilder<PipelineStepSetsBuilderOptions, PipelineStepSetsOptions, AsyncPipelineStepSets> {
	protected getStepType(): PipelineStepType<AsyncPipelineStepSets> {
		return AsyncPipelineStepSets;
	}
}
