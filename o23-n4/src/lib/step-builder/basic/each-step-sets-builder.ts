import {PipelineStepType} from '@rainbow-o23/n1';
import {EachPipelineStepSets, EachPipelineStepSetsOptions} from '@rainbow-o23/n3';
import {redressString} from '../utils';
import {PipelineStepSetsBuilder, PipelineStepSetsBuilderOptions} from './step-sets-builder';

export type EachPipelineStepSetsBuilderOptions = PipelineStepSetsBuilderOptions & {
	originalContentName?: EachPipelineStepSetsOptions['originalContentName'];
	itemName?: EachPipelineStepSetsOptions['itemName'];
}

export class EachPipelineStepSetsBuilder
	extends PipelineStepSetsBuilder<EachPipelineStepSetsBuilderOptions, EachPipelineStepSetsOptions, EachPipelineStepSets> {
	protected getStepType(): PipelineStepType<EachPipelineStepSets> {
		return EachPipelineStepSets;
	}

	protected readMoreOptions(given: EachPipelineStepSetsBuilderOptions, transformed: EachPipelineStepSetsOptions): EachPipelineStepSetsOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.originalContentName = redressString(given.originalContentName);
		transformed.itemName = redressString(given.itemName);
		return transformed;
	}
}
