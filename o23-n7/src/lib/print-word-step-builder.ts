import {PipelineStepType} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStepBuilder, FragmentaryPipelineStepBuilderOptions} from '@rainbow-o23/n4';
import {PrintWordPipelineStep, PrintWordPipelineStepOptions} from './print-word-step';

export type PrintWordPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions;

export class PrintWordPipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<PrintWordPipelineStepBuilderOptions, PrintWordPipelineStepOptions, PrintWordPipelineStep> {
	protected getStepType(): PipelineStepType<PrintWordPipelineStep> {
		return PrintWordPipelineStep;
	}

	protected readMoreOptions(given: PrintWordPipelineStepBuilderOptions, transformed: PrintWordPipelineStepOptions): PrintWordPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		return transformed;
	}
}
