import {PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {GetPropertyPipelineStep, GetPropertyPipelineStepOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_PROPERTY_NAME_NOT_DEFINED} from '../../error-codes';
import {redressString} from '../utils';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions
} from './abstract-fragmentary-step-builder';

export type GetPropertyPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	property: GetPropertyPipelineStepOptions['propertyName'];
}

export class GetPropertyPipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<GetPropertyPipelineStepBuilderOptions, GetPropertyPipelineStepOptions, GetPropertyPipelineStep> {
	protected getStepType(): PipelineStepType<GetPropertyPipelineStep> {
		return GetPropertyPipelineStep;
	}

	protected readMoreOptions(given: GetPropertyPipelineStepBuilderOptions, transformed: GetPropertyPipelineStepOptions): GetPropertyPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.propertyName = redressString(given.property);
		if (transformed.propertyName == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_PROPERTY_NAME_NOT_DEFINED, `Property name[property] of request not defined for get request property pipeline step[${given.name}].`);
		}
		return transformed;
	}
}
