import {PipelineStepType} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStepBuilder, FragmentaryPipelineStepBuilderOptions} from '@rainbow-o23/n4';
import {PrintExcelPipelineStep, PrintExcelPipelineStepOptions} from './print-excel-step';

export type PrintExcelPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	allowMultipleVariables?: boolean;
};

export class PrintExcelPipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<PrintExcelPipelineStepBuilderOptions, PrintExcelPipelineStepOptions, PrintExcelPipelineStep> {
	protected getStepType(): PipelineStepType<PrintExcelPipelineStep> {
		return PrintExcelPipelineStep;
	}

	protected readMoreOptions(given: PrintExcelPipelineStepBuilderOptions, transformed: PrintExcelPipelineStepOptions): PrintExcelPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.allowMultipleVariables = given.allowMultipleVariables;
		return transformed;
	}
}
