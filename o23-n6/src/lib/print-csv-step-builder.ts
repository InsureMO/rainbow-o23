import {PipelineStepType} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStepBuilder, FragmentaryPipelineStepBuilderOptions} from '@rainbow-o23/n4';
import {PrintCsvPipelineStep, PrintCsvPipelineStepOptions} from './print-csv-step';

export type PrintCsvPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	delimiter?: string;
	escape?: string;
	useTempFile?: boolean;
	linesFresh?: number;
}

export class PrintCsvPipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<PrintCsvPipelineStepBuilderOptions, PrintCsvPipelineStepOptions, PrintCsvPipelineStep> {
	protected getStepType(): PipelineStepType<PrintCsvPipelineStep> {
		return PrintCsvPipelineStep;
	}

	protected readMoreOptions(given: PrintCsvPipelineStepBuilderOptions, transformed: PrintCsvPipelineStepOptions): PrintCsvPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.delimiter = given.delimiter;
		transformed.escapeChar = given.escape;
		transformed.useTempFile = given.useTempFile;
		transformed.linesFreshToFile = given.linesFresh;
		return transformed;
	}
}
