import {PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {SnippetPipelineStep, SnippetPipelineStepOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_SNIPPET_NOT_DEFINED} from '../../error-codes';
import {redressSnippet} from '../utils';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions
} from './abstract-fragmentary-step-builder';

export type SnippetPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	snippet: SnippetPipelineStepOptions['snippet'];
}

export class SnippetPipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<SnippetPipelineStepBuilderOptions, SnippetPipelineStepOptions, SnippetPipelineStep> {
	protected getStepType(): PipelineStepType<SnippetPipelineStep> {
		return SnippetPipelineStep;
	}

	protected readMoreOptions(given: SnippetPipelineStepBuilderOptions, transformed: SnippetPipelineStepOptions): SnippetPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.snippet = redressSnippet(given.snippet);
		if (transformed.snippet == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_SNIPPET_NOT_DEFINED, `Snippet[snippet] not defined for snippet pipeline step[${given.name}].`);
		}
		return transformed;
	}
}
