import {PipelineStepData, PipelineStepPayload} from '@rainbow-o23/n1';
import {Snowflake} from '@theinternetfolks/snowflake';
import {AbstractFragmentaryPipelineStep} from './abstract-fragmentary-pipeline-step';

export type SnowflakeId = string;

/**
 * create a snowflake id as out fragment
 */
export class SnowflakePipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, SnowflakeId> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(_data: InFragment, _request: PipelineStepData<In>): Promise<SnowflakeId> {
		return Snowflake.generate();
	}
}
