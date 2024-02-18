import {PutObjectCommand, PutObjectCommandInput, PutObjectCommandOutput} from '@aws-sdk/client-s3';
import {PipelineStepData, PipelineStepPayload, PipelineStepType} from '@rainbow-o23/n1';
import {
	AbstractS3PipelineStep,
	AbstractS3PipelineStepBuilder,
	AbstractS3PipelineStepBuilderOptions,
	AbstractS3PipelineStepInFragment,
	AbstractS3PipelineStepOptions,
	AbstractS3PipelineStepOutFragment
} from './abstract-s3-pipline-step';

export type S3PutObjectPipelineStepInFragment = AbstractS3PipelineStepInFragment & PutObjectCommandInput;
export type S3PutObjectPipelineStepOutFragment = AbstractS3PipelineStepOutFragment & PutObjectCommandOutput;

export class S3PutObjectPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload>
	extends AbstractS3PipelineStep<In, Out, S3PutObjectPipelineStepInFragment, S3PutObjectPipelineStepOutFragment> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: S3PutObjectPipelineStepInFragment, _request: PipelineStepData<In>): Promise<S3PutObjectPipelineStepOutFragment> {
		const client = await this.createClient();
		return await client.send(new PutObjectCommand({...data, Bucket: this.getBucketName(data)}));
	}
}

export class S3PutObjectPipelineStepBuilder
	extends AbstractS3PipelineStepBuilder<AbstractS3PipelineStepBuilderOptions, AbstractS3PipelineStepOptions, S3PutObjectPipelineStep> {
	protected getStepType(): PipelineStepType<S3PutObjectPipelineStep> {
		return S3PutObjectPipelineStep;
	}
}
