import {S3Client} from '@aws-sdk/client-s3';
import {PipelineStepPayload, UncatchableError} from '@rainbow-o23/n1';
import {redressString} from '@rainbow-o23/n4';
import {ERR_AWS_S3_BUCKET_NOT_DEFINED} from '../error-codes';
import {
	AbstractRegionPipelineStep,
	AbstractRegionPipelineStepBuilder,
	AbstractRegionPipelineStepBuilderOptions,
	AbstractRegionPipelineStepInFragment,
	AbstractRegionPipelineStepOptions,
	AbstractRegionPipelineStepOutFragment,
	RegionClientHelper
} from '../region';

export interface AbstractS3PipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractRegionPipelineStepOptions<In, Out, InFragment, OutFragment> {
	bucketName?: string;
}

export interface AbstractS3PipelineStepInFragment extends AbstractRegionPipelineStepInFragment {
	Bucket?: string | undefined;
}

export interface AbstractS3PipelineStepOutFragment extends AbstractRegionPipelineStepOutFragment {
}

export abstract class AbstractS3PipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = AbstractS3PipelineStepInFragment, OutFragment = AbstractS3PipelineStepOutFragment>
	extends AbstractRegionPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _bucketName?: string;

	public constructor(options: AbstractS3PipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		if (options.bucketName == null || options.bucketName.trim().length === 0) {
			this._bucketName = this.getConfig().getString(`aws.s3.${this.getClientName()}.bucket`);
		} else {
			this._bucketName = options.bucketName;
		}
	}

	protected async createClient(): Promise<S3Client> {
		return await new RegionClientHelper(this.getConfig()).createS3Client(this.getClientName());
	}

	protected getBucketName(data: AbstractS3PipelineStepInFragment): string {
		const bucketName = data.Bucket || this._bucketName;
		if (bucketName == null || bucketName.trim().length === 0) {
			throw new UncatchableError(ERR_AWS_S3_BUCKET_NOT_DEFINED, `Aws S3 bucket name cannot be empty.`);
		}
		return bucketName;
	}
}

export type AbstractS3PipelineStepBuilderOptions = AbstractRegionPipelineStepBuilderOptions & {
	bucket?: AbstractS3PipelineStepOptions['bucketName'];
};

export abstract class AbstractS3PipelineStepBuilder<G extends AbstractS3PipelineStepBuilderOptions, O extends AbstractS3PipelineStepOptions, S extends AbstractS3PipelineStep>
	extends AbstractRegionPipelineStepBuilder<G, O, S> {
	protected readMoreOptions(given: G, transformed: O): O {
		transformed = super.readMoreOptions(given, transformed);
		transformed.bucketName = redressString(given.bucket);
		return transformed;
	}
}
