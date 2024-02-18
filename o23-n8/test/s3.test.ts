import {createConfig, createLogger} from '@rainbow-o23/n1';
import {
	S3DeleteObjectPipelineStep,
	S3GetObjectPipelineStep,
	S3GetObjectPipelineStepContentAs,
	S3ListObjectsPipelineStep,
	S3PutObjectPipelineStep
} from '../src';

const logger = createLogger();
const config = createConfig(logger);

test('S3', async () => {
	process.env.CFG_AWS_S3_TEST_CLIENT_TYPE = 'default';
	process.env.CFG_AWS_CLIENT_TEST_REGION = 'your-region';
	process.env.CFG_AWS_CLIENT_TEST_ACCESS_KEY = 'your-access-key';
	process.env.CFG_AWS_CLIENT_TEST_SECRET_KEY = 'your-secret-key';
	process.env.CFG_AWS_S3_TEST_BUCKET = 'your-bucket';

	const listObjects = new S3ListObjectsPipelineStep({config, logger, clientName: 'test'});
	const listResult1 = await listObjects.perform({content: {Prefix: 'test'}});
	expect(listResult1).not.toBeNull();

	const putObject = new S3PutObjectPipelineStep({config, logger, clientName: 'test'});
	const putResult = await putObject.perform({content: {Key: 'test/test.txt', Body: 'hello world'}});
	expect(putResult).not.toBeNull();

	const listResult2 = await listObjects.perform({content: {Prefix: 'test'}});
	expect(listResult2).not.toBeNull();

	const getObject = new S3GetObjectPipelineStep({
		config, logger, clientName: 'test',
		ignoreNotFound: true, contentAs: S3GetObjectPipelineStepContentAs.STRING
	});
	const getResult = await getObject.perform({content: {Key: 'test/test.txt'}});
	expect(getResult).not.toBeNull();
	expect(getResult.content.Body).toBe('hello world');

	const delObject = new S3DeleteObjectPipelineStep({config, logger, clientName: 'test'});
	const delResult = await delObject.perform({content: {Key: 'test/test.txt'}});
	expect(delResult).not.toBeNull();

	const listResult3 = await listObjects.perform({content: {Prefix: 'test'}});
	expect(listResult3).not.toBeNull();
}, 20000);
