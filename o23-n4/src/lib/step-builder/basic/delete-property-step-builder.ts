import {PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {DeletePropertyPipelineStep, DeletePropertyPipelineStepOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_PROPERTY_NAME_NOT_DEFINED} from '../../error-codes';
import {redressString} from '../utils';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions
} from './abstract-fragmentary-step-builder';

export type DeletePropertyPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	property: DeletePropertyPipelineStepOptions['propertyNames'];
}

export class DeletePropertyPipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<DeletePropertyPipelineStepBuilderOptions, DeletePropertyPipelineStepOptions, DeletePropertyPipelineStep> {
	protected getStepType(): PipelineStepType<DeletePropertyPipelineStep> {
		return DeletePropertyPipelineStep;
	}

	protected readMoreOptions(given: DeletePropertyPipelineStepBuilderOptions, transformed: DeletePropertyPipelineStepOptions): DeletePropertyPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		if (Array.isArray(given.property)) {
			transformed.propertyNames = given.property
				.map(property => redressString(property))
				.filter(property => property != null);
		} else if (given.property != null) {
			transformed.propertyNames = given.property.trim().split(',')
				.map(property => redressString(property))
				.filter(property => property != null);
		}
		if (transformed.propertyNames == null || transformed.propertyNames.length === 0) {
			throw new UncatchableError(ERR_PIPELINE_STEP_PROPERTY_NAME_NOT_DEFINED, `Property name[property] of request not defined for delete request property pipeline step[${given.name}].`);
		}
		return transformed;
	}
}
