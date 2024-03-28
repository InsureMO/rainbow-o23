import {PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {FetchPipelineStep, FetchPipelineStepOptions} from '@rainbow-o23/n3';
import {
	ERR_PIPELINE_STEP_FETCH_ENDPOINT_NOT_DEFINED,
	ERR_PIPELINE_STEP_FETCH_ENDPOINT_SYSTEM_NOT_DEFINED
} from '../../error-codes';
import {AbstractFragmentaryPipelineStepBuilder, FragmentaryPipelineStepBuilderOptions} from '../basic';
import {redressSnippet, redressString} from '../utils';

export type FetchPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	system: FetchPipelineStepOptions['endpointSystemCode'];
	endpoint: FetchPipelineStepOptions['endpointName'];
	decorateUrl?: FetchPipelineStepOptions['urlGenerate'];
	method?: FetchPipelineStepOptions['method'];
	timeout?: FetchPipelineStepOptions['timeout'];
	generateHeaders?: FetchPipelineStepOptions['headersGenerate'];
	generateBody?: FetchPipelineStepOptions['bodyGenerate'];
	readResponse?: FetchPipelineStepOptions['responseGenerate'];
	responseErrorHandles?: FetchPipelineStepOptions['responseErrorHandles'];
}

export class FetchPipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<FetchPipelineStepBuilderOptions, FetchPipelineStepOptions, FetchPipelineStep> {
	protected getStepType(): PipelineStepType<FetchPipelineStep> {
		return FetchPipelineStep;
	}

	protected readMoreOptions(given: FetchPipelineStepBuilderOptions, transformed: FetchPipelineStepOptions): FetchPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.endpointSystemCode = redressString(given.system);
		if (transformed.endpointSystemCode == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_FETCH_ENDPOINT_SYSTEM_NOT_DEFINED, `Endpoint system[system] not defined for fetch pipeline step[${given.name}].`);
		}
		transformed.endpointName = redressString(given.endpoint);
		if (transformed.endpointSystemCode == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_FETCH_ENDPOINT_NOT_DEFINED, `Endpoint[endpoint] not defined for fetch pipeline step[${given.name}].`);
		}
		transformed.urlGenerate = redressSnippet(given.decorateUrl);
		transformed.method = redressString(given.method);
		transformed.timeout = given.timeout;
		transformed.headersGenerate = redressSnippet(given.generateHeaders);
		transformed.bodyGenerate = redressSnippet(given.generateBody);
		transformed.responseGenerate = redressSnippet(given.readResponse);
		if (given.responseErrorHandles != null) {
			transformed.responseErrorHandles = Object.keys(given.responseErrorHandles).reduce((handlers, status) => {
				handlers[status] = redressSnippet(given.responseErrorHandles[status]);
				return handlers;
			}, {});
		}

		return transformed;
	}
}

export class FetchPostPipelineStepBuilder extends FetchPipelineStepBuilder {
	protected readMoreOptions(given: FetchPipelineStepBuilderOptions, transformed: FetchPipelineStepOptions): FetchPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.method = 'post';
		return transformed;
	}
}

export class FetchGetPipelineStepBuilder extends FetchPipelineStepBuilder {
	protected readMoreOptions(given: FetchPipelineStepBuilderOptions, transformed: FetchPipelineStepOptions): FetchPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.method = 'get';
		return transformed;
	}
}
