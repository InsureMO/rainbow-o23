import {BootstrapOptions} from '@rainbow-o23/n2';
import {StepBuilders} from '@rainbow-o23/n4';
import {
	S3DeleteObjectPipelineStepBuilder,
	S3GetObjectPipelineStepBuilder,
	S3ListObjectsPipelineStepBuilder,
	S3PutObjectPipelineStepBuilder
} from '@rainbow-o23/n8';
import {ServerPipelineStepRegistrar} from '@rainbow-o23/n90';

export const importAwsS3Service = (options: BootstrapOptions) => {
	if (options.getEnvAsBoolean('app.plugins.aws.s3', false)) {
		StepBuilders.register('aws-s3-get', S3GetObjectPipelineStepBuilder);
		StepBuilders.register('aws-s3-put', S3PutObjectPipelineStepBuilder);
		StepBuilders.register('aws-s3-delete', S3DeleteObjectPipelineStepBuilder);
		StepBuilders.register('aws-s3-list', S3ListObjectsPipelineStepBuilder);
	}
};

ServerPipelineStepRegistrar.register(importAwsS3Service);
