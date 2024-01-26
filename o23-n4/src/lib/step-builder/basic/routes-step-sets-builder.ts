import {PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {
	ConditionCheckFunc,
	RoutesPipelineStepSets,
	RoutesPipelineStepSetsOptions,
	ScriptFuncOrBody
} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_SETS_STEP_NOT_DEFINED} from '../../error-codes';
import {PipelineStepDef, PipelineStepSetsDef} from '../../reader';
import {redressSnippet} from '../utils';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions
} from './abstract-fragmentary-step-builder';

export interface RoutesConditionalStepBuilderOptions {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	check: ScriptFuncOrBody<ConditionCheckFunc<any, any>>,
	steps?: Array<PipelineStepDef | PipelineStepSetsDef>;
}

export type RoutesPipelineStepSetsBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	routes: Array<RoutesConditionalStepBuilderOptions>;
	otherwise?: Array<PipelineStepDef | PipelineStepSetsDef>;
}

export class RoutesPipelineStepSetsBuilder
	extends AbstractFragmentaryPipelineStepBuilder<RoutesPipelineStepSetsBuilderOptions, RoutesPipelineStepSetsOptions, RoutesPipelineStepSets> {
	protected getStepType(): PipelineStepType<RoutesPipelineStepSets> {
		return RoutesPipelineStepSets;
	}

	protected readMoreOptions(given: RoutesPipelineStepSetsBuilderOptions, transformed: RoutesPipelineStepSetsOptions): RoutesPipelineStepSetsOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.conditionalSteps = (given.routes || []).map(({check, steps}) => {
			return {
				check: redressSnippet(check),
				steps: steps != null ? steps.map(step => this.readSubStep(step).def) : (void 0)
			};
		});
		if (transformed.conditionalSteps == null || transformed.conditionalSteps.length === 0) {
			throw new UncatchableError(ERR_PIPELINE_STEP_SETS_STEP_NOT_DEFINED, `Route step[routes] not defined for routes pipeline step sets[${given.name}].`);
		}
		if (given.otherwise != null) {
			transformed.otherwiseSteps = given.otherwise.map(step => this.readSubStep(step).def);
		}
		return transformed;
	}
}
