import {PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {PipelineStepSets, PipelineStepSetsOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_SETS_STEP_NOT_DEFINED} from '../../error-codes';
import {PipelineStepDef, PipelineStepSetsDef} from '../../reader';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions
} from './abstract-fragmentary-step-builder';

export type PipelineStepSetsBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	steps: Array<PipelineStepDef | PipelineStepSetsDef>;
}

export class PipelineStepSetsBuilder<G extends PipelineStepSetsBuilderOptions = PipelineStepSetsBuilderOptions, O extends PipelineStepSetsOptions = PipelineStepSetsOptions, S extends PipelineStepSets = PipelineStepSets>
	extends AbstractFragmentaryPipelineStepBuilder<G, O, S> {
	protected getStepType(): PipelineStepType<S> {
		return PipelineStepSets as unknown as PipelineStepType<S>;
	}

	protected readMoreOptions(given: G, transformed: O): O {
		transformed = super.readMoreOptions(given, transformed);
		transformed.steps = (given.steps || []).map(step => {
			const def = this.readSubStep(step);
			return def.def;
		});
		if (transformed.steps.length === 0) {
			throw new UncatchableError(ERR_PIPELINE_STEP_SETS_STEP_NOT_DEFINED, `Sub step[steps] not defined for pipeline step sets[${given.name}].`);
		}
		return transformed;
	}
}
