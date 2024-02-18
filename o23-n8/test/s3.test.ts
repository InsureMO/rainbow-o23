import {createConfig, createLogger} from '@rainbow-o23/n1';
import {S3PutObjectPipelineStep} from '../lib/s3';

const logger = createLogger();
const config = createConfig(logger);

test('S3', async () => {
	process.env.CFG_AWS_S3_TEST_CLIENT_TYPE = 'default';
	process.env.CFG_AWS_CLIENT_TEST_REGION = 'ap-east-1';
	process.env.CFG_AWS_CLIENT_TEST_ACCESS_KEY = 'access-key';
	process.env.CFG_AWS_CLIENT_TEST_SECRET_KEY = 'secret-key';
	process.env.CFG_AWS_S3_TEST_BUCKET = 'bucket';
	const putObject = new S3PutObjectPipelineStep({config, logger, clientName: 'test'});
	const putResult = await putObject.perform({content: {Key: 'test.txt', Body: 'hello world'}});
	expect(putResult).not.toBeNull();
});
