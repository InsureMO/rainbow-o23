import {PipelineStepData, PipelineStepPayload, UncatchableError} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from '@rainbow-o23/n3';
import createReport from 'docx-templates';
import {UserOptions} from 'docx-templates/lib/types';
import {ERR_TEMPLATE_NOT_DEFINED} from './error-codes';

export interface PrintWordPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	cmdDelimiter?: string | [string, string];
	literalXmlDelimiter?: string;
	processLineBreaks?: boolean;
	noSandbox?: boolean;
	failFast?: boolean;
	rejectNullish?: boolean;
	fixSmartQuotes?: boolean;
	processLineBreaksAsNewText?: boolean;
}

export interface PrintWordPipelineStepInFragment {
	template: Buffer;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;
	jsContext?: Object;
}

export interface PrintWordPipelineStepOutFragment {
	file: Buffer;
}

export class PrintWordPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, >
	extends AbstractFragmentaryPipelineStep<In, Out, PrintWordPipelineStepInFragment, PrintWordPipelineStepOutFragment> {
	private readonly _cmdDelimiter?: string | [string, string];
	private readonly _literalXmlDelimiter?: string;
	private readonly _processLineBreaks?: boolean;
	private readonly _noSandbox?: boolean;
	private readonly _failFast?: boolean;
	private readonly _rejectNullish?: boolean;
	private readonly _fixSmartQuotes?: boolean;
	private readonly _processLineBreaksAsNewText?: boolean;

	public constructor(options: PrintWordPipelineStepOptions<In, Out, PrintWordPipelineStepInFragment, PrintWordPipelineStepOutFragment>) {
		super(options);
		this._cmdDelimiter = options.cmdDelimiter ?? '+++';
		this._literalXmlDelimiter = options.literalXmlDelimiter ?? '||';
		this._processLineBreaks = options.processLineBreaks ?? true;
		this._noSandbox = options.noSandbox ?? true;
		this._failFast = options.failFast ?? true;
		this._rejectNullish = options.rejectNullish ?? false;
		this._fixSmartQuotes = options.fixSmartQuotes ?? false;
		this._processLineBreaksAsNewText = options.processLineBreaksAsNewText ?? false;
	}

	protected getCreateReportOptions(): Omit<UserOptions, 'template' | 'data'> {
		return {
			cmdDelimiter: this._cmdDelimiter,
			literalXmlDelimiter: this._literalXmlDelimiter,
			processLineBreaks: this._processLineBreaks,
			noSandbox: this._noSandbox,
			failFast: this._failFast,
			rejectNullish: this._rejectNullish,
			fixSmartQuotes: this._fixSmartQuotes,
			processLineBreaksAsNewText: this._processLineBreaksAsNewText
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async printWord(templateWord: Buffer, data: any, jsContext?: Object): Promise<Buffer> {
		const buffer = await createReport({
			...this.getCreateReportOptions(),
			template: templateWord, data, additionalJsContext: jsContext
		});
		return Buffer.from(buffer.buffer);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: PrintWordPipelineStepInFragment, _request: PipelineStepData<In>): Promise<PrintWordPipelineStepOutFragment> {
		if (data.template == null) {
			throw new UncatchableError(ERR_TEMPLATE_NOT_DEFINED, 'Print template cannot be null.');
		}
		const file = await this.printWord(data.template, data.data, data.jsContext);
		return {file};
	}
}
