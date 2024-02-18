import {DeleteObjectCommand, DeleteObjectCommandInput, DeleteObjectCommandOutput} from '@aws-sdk/client-s3';
import {PipelineStepData, PipelineStepPayload, PipelineStepType} from '@rainbow-o23/n1';
import {
	AbstractS3PipelineStep,
	AbstractS3PipelineStepBuilder,
	AbstractS3PipelineStepBuilderOptions,
	AbstractS3PipelineStepInFragment,
	AbstractS3PipelineStepOptions,
	AbstractS3PipelineStepOutFragment
} from './abstract-s3-pipline-step';

export type S3DeleteObjectPipelineStepInFragment = AbstractS3PipelineStepInFragment & DeleteObjectCommandInput;
export type S3DeleteObjectPipelineStepOutFragment = AbstractS3PipelineStepOutFragment & DeleteObjectCommandOutput;

export class S3DeleteObjectPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload>
	extends AbstractS3PipelineStep<In, Out, S3DeleteObjectPipelineStepInFragment, S3DeleteObjectPipelineStepOutFragment> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: S3DeleteObjectPipelineStepInFragment, _request: PipelineStepData<In>): Promise<S3DeleteObjectPipelineStepOutFragment> {
		const client = await this.createClient();
		return await client.send(new DeleteObjectCommand({...data, Bucket: this.getBucketName(data)}));
	}
}

export class S3DeleteObjectPipelineStepBuilder
	extends AbstractS3PipelineStepBuilder<AbstractS3PipelineStepBuilderOptions, AbstractS3PipelineStepOptions, S3DeleteObjectPipelineStep> {
	protected getStepType(): PipelineStepType<S3DeleteObjectPipelineStep> {
		return S3DeleteObjectPipelineStep;
	}
}
