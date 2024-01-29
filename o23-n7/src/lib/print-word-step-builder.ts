import {PipelineStepType} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStepBuilder, FragmentaryPipelineStepBuilderOptions} from '@rainbow-o23/n4';
import {PrintWordPipelineStep, PrintWordPipelineStepOptions} from './print-word-step';

export type PrintWordPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	cmd?: PrintWordPipelineStepOptions['cmdDelimiter'];
	literalXmlDelimiter?: PrintWordPipelineStepOptions['literalXmlDelimiter'];
	processLineBreaks?: PrintWordPipelineStepOptions['processLineBreaks'];
	noSandbox?: PrintWordPipelineStepOptions['noSandbox'];
	failFast?: PrintWordPipelineStepOptions['failFast'];
	rejectNullish?: PrintWordPipelineStepOptions['rejectNullish'];
	fixSmartQuotes?: PrintWordPipelineStepOptions['fixSmartQuotes'];
	processLineBreaksAsNewText?: PrintWordPipelineStepOptions['processLineBreaksAsNewText'];
};

export class PrintWordPipelineStepBuilder
	extends AbstractFragmentaryPipelineStepBuilder<PrintWordPipelineStepBuilderOptions, PrintWordPipelineStepOptions, PrintWordPipelineStep> {
	protected getStepType(): PipelineStepType<PrintWordPipelineStep> {
		return PrintWordPipelineStep;
	}

	protected readMoreOptions(given: PrintWordPipelineStepBuilderOptions, transformed: PrintWordPipelineStepOptions): PrintWordPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.cmdDelimiter = given.cmd;
		transformed.literalXmlDelimiter = given.literalXmlDelimiter;
		transformed.processLineBreaks = given.processLineBreaks;
		transformed.noSandbox = given.noSandbox;
		transformed.failFast = given.failFast;
		transformed.rejectNullish = given.rejectNullish;
		transformed.fixSmartQuotes = given.fixSmartQuotes;
		transformed.processLineBreaksAsNewText = given.processLineBreaksAsNewText;
		return transformed;
	}
}
