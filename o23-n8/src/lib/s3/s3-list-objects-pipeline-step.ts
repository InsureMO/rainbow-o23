import {ListObjectsV2Command, ListObjectsV2CommandInput, ListObjectsV2CommandOutput} from '@aws-sdk/client-s3';
import {PipelineStepData, PipelineStepPayload, PipelineStepType} from '@rainbow-o23/n1';
import {
	AbstractS3PipelineStep,
	AbstractS3PipelineStepBuilder,
	AbstractS3PipelineStepBuilderOptions,
	AbstractS3PipelineStepInFragment,
	AbstractS3PipelineStepOptions,
	AbstractS3PipelineStepOutFragment
} from './abstract-s3-pipline-step';

export type S3ListObjectsPipelineStepInFragment = AbstractS3PipelineStepInFragment & ListObjectsV2CommandInput;
export type S3ListObjectsPipelineStepOutFragment = AbstractS3PipelineStepOutFragment & ListObjectsV2CommandOutput;

export class S3ListObjectsPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload>
	extends AbstractS3PipelineStep<In, Out, S3ListObjectsPipelineStepInFragment, S3ListObjectsPipelineStepOutFragment> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: S3ListObjectsPipelineStepInFragment, _request: PipelineStepData<In>): Promise<S3ListObjectsPipelineStepOutFragment> {
		const client = await this.createClient();
		return await client.send(new ListObjectsV2Command({...data, Bucket: this.getBucketName(data)}));
	}
}

export class S3ListObjectsPipelineStepBuilder
	extends AbstractS3PipelineStepBuilder<AbstractS3PipelineStepBuilderOptions, AbstractS3PipelineStepOptions, S3ListObjectsPipelineStep> {
	protected getStepType(): PipelineStepType<S3ListObjectsPipelineStep> {
		return S3ListObjectsPipelineStep;
	}
}
