import {PipelineStepType} from '@rainbow-o23/n1';
import {ParallelPipelineStepSets, ParallelPipelineStepSetsOptions} from '@rainbow-o23/n3';
import {redressSnippet} from '../utils';
import {PipelineStepSetsBuilder, PipelineStepSetsBuilderOptions} from './step-sets-builder';

export type ParallelPipelineStepSetsBuilderOptions = PipelineStepSetsBuilderOptions & {
	cloneData?: ParallelPipelineStepSetsOptions['cloneData'];
	race?: ParallelPipelineStepSetsOptions['race'];
}

export class ParallelPipelineStepSetsBuilder
	extends PipelineStepSetsBuilder<ParallelPipelineStepSetsBuilderOptions, ParallelPipelineStepSetsOptions, ParallelPipelineStepSets> {
	protected getStepType(): PipelineStepType<ParallelPipelineStepSets> {
		return ParallelPipelineStepSets;
	}

	protected readMoreOptions(given: ParallelPipelineStepSetsBuilderOptions, transformed: ParallelPipelineStepSetsOptions): ParallelPipelineStepSetsOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.cloneData = redressSnippet(given.cloneData);
		transformed.race = given.race;
		return transformed;
	}
}
