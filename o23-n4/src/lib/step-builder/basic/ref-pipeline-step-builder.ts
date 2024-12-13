import {PipelineCode, PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {RefPipelinePipelineStep, RefPipelinePipelineStepOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_PIPELINE_REF_NOT_DEFINED} from '../../error-codes';
import {redressString} from '../utils';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions
} from './abstract-fragmentary-step-builder';

export type RefPipelinePipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	ref?: PipelineCode;
	/**
	 * @deprecated use {#ref} instead
	 */
	code: PipelineCode;
};

export class RefPipelinePipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<RefPipelinePipelineStepBuilderOptions, RefPipelinePipelineStepOptions, RefPipelinePipelineStep> {
	protected getStepType(): PipelineStepType<RefPipelinePipelineStep> {
		return RefPipelinePipelineStep;
	}

	protected readMoreOptions(given: RefPipelinePipelineStepBuilderOptions, transformed: RefPipelinePipelineStepOptions): RefPipelinePipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		const code = redressString(given.ref) ?? redressString(given.code);
		if (code == null) {
			throw new UncatchableError(ERR_PIPELINE_PIPELINE_REF_NOT_DEFINED, `Reference code[code] not defined for ref pipeline[${given.name}].`);
		}
		transformed.code = code;
		return transformed;
	}
}
