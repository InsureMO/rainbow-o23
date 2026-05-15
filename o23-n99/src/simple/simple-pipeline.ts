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
		// this.getLogger().log('SimplePipelineStep1 Info Log Sample',
		// 	{contextValue: 'context-value'},
		// 	'ignored-whatever-given');
		// const output = {
		// 	'@timestamp': '2026-05-15T07:41:30.038Z',
		// 	'context': {'contextValue': 'context-value'},
		// 	'current_app_name': 'O23-N99',
		// 	'greeting': 'hello world',
		// 	'level': 'INFO',
		// 	'message': 'SimplePipelineStep1 Info Log Sample',
		// 	'provider': 'Rainbow Team'
		// };
		// this.getLogger().error('SimplePipelineStep1 Error Log Sample',
		// 	{stack0Value: 'stack-0-value'},
		// 	{contextValue: 'context-value'},
		// 	'ignored-whatever-given');
		// const output = {
		// 	'@timestamp': '2026-05-15T07:43:01.170Z',
		// 	'context': {'contextValue': 'context-value'},
		// 	'current_app_name': 'O23-N99',
		// 	'greeting': 'hello world',
		// 	'level': 'ERROR',
		// 	'message': 'SimplePipelineStep1 Error Log Sample',
		// 	'provider': 'Rainbow Team',
		// 	'stack': [{'stack0Value': 'stack-0-value'}]
		// };
		return Promise.resolve({content: request.content + 100, $context: request.$context});
	}
}

export class SimplePipelineStep2 extends AbstractPipelineStep<number, number> {
	public perform(request: PipelineStepData<number>): Promise<PipelineStepData<number>> {
		this.debug(() => `Perform (${request.content} * 2)`);
		return Promise.resolve({content: request.content * 2, $context: request.$context});
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
