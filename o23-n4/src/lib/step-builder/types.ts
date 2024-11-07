import {PipelineStepBuilder, PipelineStepOptions} from '@rainbow-o23/n1';

export type PipelineStepRegisterKey = string;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export interface PipelineStepBuilderType<B = PipelineStepBuilder, O = Omit<PipelineStepOptions, 'logger' | 'config'>> extends Function {
	new(options?: O): B;
}
