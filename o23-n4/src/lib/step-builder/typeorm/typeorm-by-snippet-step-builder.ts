import {PipelineStepType, UncatchableError} from '@rainbow-o23/n1';
import {TypeOrmBySnippetPipelineStep, TypeOrmBySnippetPipelineStepOptions} from '@rainbow-o23/n3';
import {ERR_PIPELINE_STEP_SNIPPET_NOT_DEFINED} from '../../error-codes';
import {redressSnippet} from '../utils';
import {AbstractTypeOrmPipelineStepBuilder, TypeOrmPipelineStepBuilderOptions} from './abstract-typeorm-step-builder';

export type TypeOrmBySnippetPipelineStepBuilderOptions = TypeOrmPipelineStepBuilderOptions & {
	snippet: TypeOrmBySnippetPipelineStepOptions['snippet'];
}

export class TypeOrmBySnippetPipelineStepBuilder
	extends AbstractTypeOrmPipelineStepBuilder<TypeOrmBySnippetPipelineStepBuilderOptions, TypeOrmBySnippetPipelineStepOptions, TypeOrmBySnippetPipelineStep> {
	protected getStepType(): PipelineStepType<TypeOrmBySnippetPipelineStep> {
		return TypeOrmBySnippetPipelineStep;
	}

	protected readMoreOptions(given: TypeOrmBySnippetPipelineStepBuilderOptions, transformed: TypeOrmBySnippetPipelineStepOptions): TypeOrmBySnippetPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.snippet = redressSnippet(given.snippet);
		if (transformed.snippet == null) {
			throw new UncatchableError(ERR_PIPELINE_STEP_SNIPPET_NOT_DEFINED, `Snippet[snippet] not defined for typeorm by snippet pipeline step[${given.name}].`);
		}
		return transformed;
	}
}
