import {
	AbstractPipelineStep,
	AbstractStaticPipeline,
	PipelineCode,
	PipelineStepData,
	PipelineStepType
} from '@rainbow-o23/n1';

export class DynamicPipelineStep1 extends AbstractPipelineStep<{ value: number }, number> {
	public perform(request: PipelineStepData<{ value: number }>): Promise<PipelineStepData<number>> {
		this.debug(() => `Perform (${request.content.value} + 100)`);
		return Promise.resolve({content: request.content.value + 100});
	}
}

export class DynamicPipelineStep2 extends AbstractPipelineStep<number, number> {
	public perform(request: PipelineStepData<number>): Promise<PipelineStepData<number>> {
		this.debug(() => `Perform (${request.content} * 2)`);
		return Promise.resolve({content: request.content * 2});
	}
}

export const DYNAMIC_PIPELINE_CODE = 'DynamicPipeline';

/**
 * use pipeline in as first step in,
 * use last step out as pipeline out
 */
export class DynamicPipeline extends AbstractStaticPipeline<number, number> {
	public getCode(): PipelineCode {
		return DYNAMIC_PIPELINE_CODE;
	}

	protected getStepTypes(): Array<PipelineStepType> {
		return [DynamicPipelineStep1, DynamicPipelineStep2];
	}
}
