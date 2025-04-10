import {PipelineStepCode, PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {RefStepPipelineStep, RefStepPipelineStepOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_REF_NOT_DEFINED} from '../../error-codes';
import {redressString} from '../utils';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions
} from './abstract-fragmentary-step-builder';

export type RefStepPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	ref?: PipelineStepCode;
	/**
	 * @deprecated use {#ref} instead
	 */
	code?: PipelineStepCode;
};

export class RefStepPipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<RefStepPipelineStepBuilderOptions, RefStepPipelineStepOptions, RefStepPipelineStep> {
	protected getStepType(): PipelineStepType<RefStepPipelineStep> {
		return RefStepPipelineStep;
	}

	protected readMoreOptions(given: RefStepPipelineStepBuilderOptions, transformed: RefStepPipelineStepOptions): RefStepPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		const code = redressString(given.ref) ?? redressString(given.code);
		if (code == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_REF_NOT_DEFINED, `Reference code[code] not defined for ref pipeline step[${given.name}].`);
		}
		transformed.code = code;
		return transformed;
	}
}
