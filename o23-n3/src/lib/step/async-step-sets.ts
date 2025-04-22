import {PipelineStepData, PipelineStepPayload} from '@rainbow-o23/n1';
import {PipelineStepSets, PipelineStepSetsExecutionContext} from './step-sets';

/**
 * pipeline steps to execute sets of steps asynchronous.
 *
 * Execution context will be copied and will not be retrieved back to the main thread.
 * The transaction context will not be passed to asynchronous sub - steps.
 */
export class AsyncPipelineStepSets<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In>
	extends PipelineStepSets<In, Out, InFragment, void> {

	protected inheritContext(request: PipelineStepData<In>): PipelineStepSetsExecutionContext {
		// $trans does not inherit by sub step
		return request.$context.clone('$trans');
	}

	protected async doPerform(data: InFragment, request: PipelineStepData<In>): Promise<void> {
		// noinspection ES6MissingAwait
		super.doPerform(data, request);
		return;
	}
}
