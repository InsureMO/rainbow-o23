import {GetObjectCommand, GetObjectCommandInput, GetObjectCommandOutput} from '@aws-sdk/client-s3';
import {PipelineStepData, PipelineStepPayload, PipelineStepType, Undefinable} from '@rainbow-o23/n1';
import {redressString} from '@rainbow-o23/n4';
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

export enum S3GetObjectPipelineStepContentAs {
	BUFFER = 'buffer',
	STRING = 'string'
}

export interface S3GetPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, OutFragment = S3GetObjectPipelineStepOutFragment>
	extends AbstractS3PipelineStepOptions<In, Out, S3GetObjectPipelineStepInFragment, OutFragment> {
	contentAs?: S3GetObjectPipelineStepContentAs;
	ignoreNotFound?: boolean;
}

export class S3GetObjectPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, OutFragment = S3GetObjectPipelineStepOutFragment>
	extends AbstractS3PipelineStep<In, Out, S3GetObjectPipelineStepInFragment, OutFragment> {
	private readonly _contentAs: Undefinable<S3GetObjectPipelineStepContentAs>;
	private readonly _ignoreNotFound: boolean;

	public constructor(options: S3GetPipelineStepOptions<In, Out, OutFragment>) {
		super(options);
		this._contentAs = options.contentAs;
		this._ignoreNotFound = options.ignoreNotFound ?? false;
	}

	protected getContentAs(): Undefinable<S3GetObjectPipelineStepContentAs> {
		return this._contentAs;
	}

	protected ignoreWhenNotFound(): boolean {
		return this._ignoreNotFound;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: S3GetObjectPipelineStepInFragment, _request: PipelineStepData<In>): Promise<OutFragment> {
		const client = await this.createClient();
		try {
			const result = await client.send(new GetObjectCommand({...data, Bucket: this.getBucketName(data)}));
			const contentAs = this.getContentAs();
			const {Body, ...rest} = result;
			switch (true) {
				case contentAs === S3GetObjectPipelineStepContentAs.STRING:
					return {Body: await Body.transformToString(), ...rest} as OutFragment;
				case contentAs === S3GetObjectPipelineStepContentAs.BUFFER:
					return {Body: (await Body.transformToByteArray()).buffer, ...rest} as OutFragment;
				default:
					return result as OutFragment;
			}
		} catch (e) {
			if (this.ignoreWhenNotFound() && e.Code === 'NoSuchKey') {
				return {Body: null} as OutFragment;
			}
			throw e;
		}
	}
}

export interface S3GetObjectPipelineStepBuilderOptions extends AbstractS3PipelineStepBuilderOptions {
	contentAs?: S3GetObjectPipelineStepContentAs;
	ignoreNotFound?: boolean;
}

export class S3GetObjectPipelineStepBuilder
	extends AbstractS3PipelineStepBuilder<S3GetObjectPipelineStepBuilderOptions, S3GetPipelineStepOptions, S3GetObjectPipelineStep> {
	protected getStepType(): PipelineStepType<S3GetObjectPipelineStep> {
		return S3GetObjectPipelineStep;
	}

	protected readMoreOptions(given: S3GetObjectPipelineStepBuilderOptions, transformed: S3GetPipelineStepOptions): S3GetPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.contentAs = redressString(given.contentAs) as S3GetObjectPipelineStepContentAs;
		transformed.ignoreNotFound = given.ignoreNotFound;
		return transformed;
	}
}
