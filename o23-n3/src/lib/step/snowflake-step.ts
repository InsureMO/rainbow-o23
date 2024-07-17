import {PipelineStepData, PipelineStepPayload} from '@rainbow-o23/n1';
import {Snowflake, SnowflakeId} from '../utils';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from './abstract-fragmentary-pipeline-step';

/**
 * create a snowflake id as out fragment
 */
export class SnowflakePipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, SnowflakeId> {
	private readonly _shardId: number;

	public constructor(options: FragmentaryPipelineStepOptions<In, Out, InFragment, SnowflakeId>) {
		super(options);
		const config = this.getConfig();
		this._shardId = config.getNumber(`snowflake.shard.id`);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(_data: InFragment, _request: PipelineStepData<In>): Promise<SnowflakeId> {
		return Snowflake.generate({shardId: this._shardId});
	}
}
