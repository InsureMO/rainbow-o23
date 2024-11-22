import {Bootstrap} from '@rainbow-o23/n2';
import {ApiInitializer, EnvironmentInitializer, ServerPipelineInitializer, TypeOrmInitializer} from './init';
import {BeforeDoPipelineInitialization, BeforeDoServerLaunch} from './types';

export const launchServer = async (options?: {
	beforeDoPipelineInitialization?: BeforeDoPipelineInitialization;
	beforeDoServerLaunch?: BeforeDoServerLaunch;
}) => {
	const {beforeDoPipelineInitialization, beforeDoServerLaunch} = options ?? {};

	// create bootstrap options
	const bootstrapOptions = await new EnvironmentInitializer().load();
	await new TypeOrmInitializer().load(bootstrapOptions);
	if (beforeDoPipelineInitialization != null) {
		await beforeDoPipelineInitialization(bootstrapOptions);
	}
	const pipelines = await new ServerPipelineInitializer().load(bootstrapOptions);
	await new ApiInitializer().load(bootstrapOptions, pipelines);
	if (beforeDoServerLaunch != null) {
		await beforeDoServerLaunch(bootstrapOptions);
	}
	// launch server
	return await Bootstrap.launch(bootstrapOptions);
};
