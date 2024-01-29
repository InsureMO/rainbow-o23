import {PipelineStepData, PipelineStepPayload, UncatchableError} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from '@rainbow-o23/n3';
import {ERR_TEMPLATE_NOT_DEFINED} from './error-codes';

export interface PrintWordPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
}

export interface PrintWordPipelineStepInFragment {
	template: Buffer | string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;
}

export interface PrintWordPipelineStepOutFragment {
	file: Buffer;
}

export class PrintWordPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, >
	extends AbstractFragmentaryPipelineStep<In, Out, PrintWordPipelineStepInFragment, PrintWordPipelineStepOutFragment> {

	public constructor(options: PrintWordPipelineStepOptions<In, Out, PrintWordPipelineStepInFragment, PrintWordPipelineStepOutFragment>) {
		super(options);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
	protected async printWord(templateWord: Buffer | string, data: any): Promise<Buffer> {
		// TODO: implement
		return Buffer.from('');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: PrintWordPipelineStepInFragment, _request: PipelineStepData<In>): Promise<PrintWordPipelineStepOutFragment> {
		if (data.template == null) {
			throw new UncatchableError(ERR_TEMPLATE_NOT_DEFINED, 'Print template cannot be null.');
		}
		const file = await this.printWord(data.template, data.data);
		return {file};
	}
}
