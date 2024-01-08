import {
	AbstractPipelineStep,
	AbstractStaticPipeline,
	PipelineCode,
	PipelineStepData,
	PipelineStepType
} from '@rainbow-o23/n1';

export class SimplePipelineStep1 extends AbstractPipelineStep<number, number> {
	public perform(request: PipelineStepData<number>): Promise<PipelineStepData<number>> {
		this.debug(() => `Perform (${request.content} + 100)`);
		return Promise.resolve({content: request.content + 100});
	}
}

export class SimplePipelineStep2 extends AbstractPipelineStep<number, number> {
	public perform(request: PipelineStepData<number>): Promise<PipelineStepData<number>> {
		this.debug(() => `Perform (${request.content} * 2)`);
		return Promise.resolve({content: request.content * 2});
	}
}

/**
 * use pipeline in as first step in,
 * use last step out as pipeline out
 */
export class SimplePipeline extends AbstractStaticPipeline<number, number> {
	public getCode(): PipelineCode {
		return 'SimplePipeline';
	}

	protected getStepTypes(): Array<PipelineStepType> {
		return [SimplePipelineStep1, SimplePipelineStep2];
	}
}
