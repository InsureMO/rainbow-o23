import {UncatchableError} from '@rainbow-o23/n1';
import {ERR_PIPELINE_STEP_BUILDER_NOT_FOUND} from '../error-codes';
import {StepBuilders} from '../step-builder';
import {ParsedPipelineStepDef, PipelineStepSetsDef} from './types';

export class PipelineStepSetsReader {
	private constructor() {
		// avoid extend
	}

	public static read(def: PipelineStepSetsDef): ParsedPipelineStepDef {
		const {code, use, ...rest} = def;
		const StepBuilderClass = StepBuilders.find(use);
		if (StepBuilderClass == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_BUILDER_NOT_FOUND, `Pipeline step builder for [${use}] not found.`);
		} else {
			return {code, type: 'step-sets', def: new StepBuilderClass(def), ...rest};
		}
	}
}
