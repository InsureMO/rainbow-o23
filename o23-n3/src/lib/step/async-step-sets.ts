import {PipelineStepData, PipelineStepPayload} from '@rainbow-o23/n1';
import {PipelineStepSets} from './step-sets';

/**
 * pipeline steps to execute sets of steps asynchronous.
 */
export class AsyncPipelineStepSets<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In>
	extends PipelineStepSets<In, Out, InFragment, void> {
	protected async doPerform(data: InFragment, request: PipelineStepData<In>): Promise<void> {
		// noinspection ES6MissingAwait
		super.doPerform(data, request);
		return;
	}
}
