import {PipelineStepType} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStepBuilder, FragmentaryPipelineStepBuilderOptions} from '@rainbow-o23/n4';
import {PDFOptions, Viewport} from 'puppeteer';
import {PrintPdfPipelineStep, PrintPdfPipelineStepOptions} from './print-pdf-step';

export type PrintPdfPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	browserArgs?: string | Array<string>;
	viewport?: Viewport;
	pdfOptions?: PDFOptions;
};

export class PrintPdfPipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<PrintPdfPipelineStepBuilderOptions, PrintPdfPipelineStepOptions, PrintPdfPipelineStep> {
	protected getStepType(): PipelineStepType<PrintPdfPipelineStep> {
		return PrintPdfPipelineStep;
	}

	protected readMoreOptions(given: PrintPdfPipelineStepBuilderOptions, transformed: PrintPdfPipelineStepOptions): PrintPdfPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.browserArgs = given.browserArgs;
		transformed.viewport = given.viewport;
		transformed.pdfOptions = given.pdfOptions;
		return transformed;
	}
}
