import {S3Client} from '@aws-sdk/client-s3';
import {PipelineStepPayload, UncatchableError} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from '@rainbow-o23/n3';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions,
	redressString
} from '@rainbow-o23/n4';
import {ERR_AWS_S3_BUCKET_NOT_DEFINED, ERR_AWS_S3_CLIENT_NAME_NOT_DEFINED} from '../error-codes';
import {S3ClientHelper} from './client-manager';

export interface AbstractS3PipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	clientName: string;
	bucketName?: string;
}

export interface AbstractS3PipelineStepInFragment {
	Bucket?: string | undefined;
}

export interface AbstractS3PipelineStepOutFragment {
}

export abstract class AbstractS3PipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = AbstractS3PipelineStepInFragment, OutFragment = AbstractS3PipelineStepOutFragment>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _clientName?: string;
	private readonly _bucketName?: string;

	public constructor(options: AbstractS3PipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		if (options.clientName == null || options.clientName.trim().length === 0) {
			throw new UncatchableError(ERR_AWS_S3_CLIENT_NAME_NOT_DEFINED, `Aws S3 client name cannot be empty.`);
		}
		this._clientName = options.clientName.trim();
		if (options.bucketName == null || options.bucketName.trim().length === 0) {
			this._bucketName = this.getConfig().getString(`aws.s3.${this._clientName}.bucket`);
		} else {
			this._bucketName = options.bucketName;
		}
	}

	protected getClientName(): string {
		return this._clientName;
	}

	protected async createClient(): Promise<S3Client> {
		return await new S3ClientHelper(this.getConfig()).create(this.getClientName());
	}

	protected getBucketName(data: AbstractS3PipelineStepInFragment): string {
		const bucketName = data.Bucket || this._bucketName;
		if (bucketName == null || bucketName.trim().length === 0) {
			throw new UncatchableError(ERR_AWS_S3_BUCKET_NOT_DEFINED, `Aws S3 bucket name cannot be empty.`);
		}
		return bucketName;
	}
}

export type AbstractS3PipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	client?: AbstractS3PipelineStepOptions['clientName'];
	bucket?: AbstractS3PipelineStepOptions['bucketName'];
};

export abstract class AbstractS3PipelineStepBuilder<G extends AbstractS3PipelineStepBuilderOptions, O extends AbstractS3PipelineStepOptions, S extends AbstractS3PipelineStep>
	extends AbstractFragmentaryPipelineStepBuilder<G, O, S> {
	protected readMoreOptions(given: G, transformed: O): O {
		transformed = super.readMoreOptions(given, transformed);
		transformed.clientName = redressString(given.client);
		if (transformed.clientName == null) {
			throw new UncatchableError(ERR_AWS_S3_CLIENT_NAME_NOT_DEFINED, `Aws S3 client name[client] not defined for aws s3 pipeline step[${given.name}].`);
		}
		transformed.bucketName = redressString(given.bucket);
		return transformed;
	}
}
