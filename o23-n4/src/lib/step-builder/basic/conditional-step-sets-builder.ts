import {PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {ConditionalPipelineStepSets, ConditionalPipelineStepSetsOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_SNIPPET_NOT_DEFINED} from '../../error-codes';
import {PipelineStepDef, PipelineStepSetsDef} from '../../reader';
import {redressSnippet} from '../utils';
import {PipelineStepSetsBuilder, PipelineStepSetsBuilderOptions} from './step-sets-builder';

export type ConditionalPipelineStepSetsBuilderOptions = PipelineStepSetsBuilderOptions & {
	check: ConditionalPipelineStepSetsOptions['check'];
	otherwise?: Array<PipelineStepDef | PipelineStepSetsDef>;
}

export class ConditionalPipelineStepSetsBuilder
	extends PipelineStepSetsBuilder<ConditionalPipelineStepSetsBuilderOptions, ConditionalPipelineStepSetsOptions, ConditionalPipelineStepSets> {
	protected getStepType(): PipelineStepType<ConditionalPipelineStepSets> {
		return ConditionalPipelineStepSets;
	}

	protected readMoreOptions(given: ConditionalPipelineStepSetsBuilderOptions, transformed: ConditionalPipelineStepSetsOptions): ConditionalPipelineStepSetsOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.check = redressSnippet(given.check);
		if (transformed.check == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_SNIPPET_NOT_DEFINED, `Snippet[snippet] not defined for conditional pipeline step sets[${given.name}].`);
		}
		if (given.otherwise != null) {
			transformed.otherwiseSteps = given.otherwise.map(step => this.readSubStep(step).def);
		}
		return transformed;
	}
}
