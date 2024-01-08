import {Bootstrap, BootstrapOptions} from '@rainbow-o23/n2';
import {ApiInitializer, EnvironmentInitializer, ServerPipelineInitializer, TypeOrmInitializer} from './init';

export type BeforeDoServerLaunch = (options: BootstrapOptions) => Promise<void>;

export const launchServer = async (options: {
	beforeDoServerLaunch?: BeforeDoServerLaunch;
}) => {
	const {beforeDoServerLaunch} = options;

	// create bootstrap options
	const bootstrapOptions = await new EnvironmentInitializer().load();
	await new TypeOrmInitializer().load(bootstrapOptions);
	const pipelines = await new ServerPipelineInitializer().load(bootstrapOptions);
	await new ApiInitializer().load(bootstrapOptions, pipelines);
	if (beforeDoServerLaunch != null) {
		await beforeDoServerLaunch(bootstrapOptions);
	}
	// launch server
	return await Bootstrap.launch(bootstrapOptions);
};
