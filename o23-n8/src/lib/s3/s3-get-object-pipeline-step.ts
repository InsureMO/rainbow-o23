import {GetObjectCommand, GetObjectCommandInput, GetObjectCommandOutput} from '@aws-sdk/client-s3';
import {PipelineStepData, PipelineStepPayload, PipelineStepType} from '@rainbow-o23/n1';
import {
	AbstractS3PipelineStep,
	AbstractS3PipelineStepBuilder,
	AbstractS3PipelineStepBuilderOptions,
	AbstractS3PipelineStepInFragment,
	AbstractS3PipelineStepOptions,
	AbstractS3PipelineStepOutFragment
} from './abstract-s3-pipline-step';

export type S3GetObjectPipelineStepInFragment = AbstractS3PipelineStepInFragment & GetObjectCommandInput;
export type S3GetObjectPipelineStepOutFragment = AbstractS3PipelineStepOutFragment & GetObjectCommandOutput;

export class S3GetObjectPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload>
	extends AbstractS3PipelineStep<In, Out, S3GetObjectPipelineStepInFragment, S3GetObjectPipelineStepOutFragment> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: S3GetObjectPipelineStepInFragment, _request: PipelineStepData<In>): Promise<S3GetObjectPipelineStepOutFragment> {
		const client = await this.createClient();
		return await client.send(new GetObjectCommand({...data, Bucket: this.getBucketName(data)}));
	}
}

export class S3GetObjectPipelineStepBuilder
	extends AbstractS3PipelineStepBuilder<AbstractS3PipelineStepBuilderOptions, AbstractS3PipelineStepOptions, S3GetObjectPipelineStep> {
	protected getStepType(): PipelineStepType<S3GetObjectPipelineStep> {
		return S3GetObjectPipelineStep;
	}
}
