import {PipelineStepType} from '@rainbow-o23/n1';
import {ScriptFunctionBody} from '@rainbow-o23/n3';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions,
	redressSnippet
} from '@rainbow-o23/n4';
import {PrintPdfPipelineStep, PrintPdfPipelineStepOptions} from './print-pdf-step';

export interface PdfPrintSettings {
	findSubTemplate: Exclude<PrintPdfPipelineStepOptions['findSubTemplate'], ScriptFunctionBody>;
}

export const PDF_PRINT_SETTINGS: PdfPrintSettings = {
	findSubTemplate: (void 0)
};

export type PrintPdfPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	browserArgs?: PrintPdfPipelineStepOptions['browserArgs'];
	viewport?: PrintPdfPipelineStepOptions['viewport'];
	pdfOptions?: PrintPdfPipelineStepOptions['pdfOptions'];
	findSubTemplate?: PrintPdfPipelineStepOptions['findSubTemplate'];
};

export class PrintPdfPipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<PrintPdfPipelineStepBuilderOptions, PrintPdfPipelineStepOptions, PrintPdfPipelineStep> {
	public constructor(options: PrintPdfPipelineStepBuilderOptions) {
		super(options);
	}

	protected getStepType(): PipelineStepType<PrintPdfPipelineStep> {
		return PrintPdfPipelineStep;
	}

	protected readMoreOptions(given: PrintPdfPipelineStepBuilderOptions, transformed: PrintPdfPipelineStepOptions): PrintPdfPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.findSubTemplate = redressSnippet(given.findSubTemplate) ?? PDF_PRINT_SETTINGS.findSubTemplate;
		transformed.browserArgs = given.browserArgs;
		transformed.viewport = given.viewport;
		transformed.pdfOptions = given.pdfOptions;
		return transformed;
	}
}
