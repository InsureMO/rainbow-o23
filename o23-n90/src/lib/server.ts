import {Type} from '@nestjs/common';
import {Bootstrap} from '@rainbow-o23/n2';
import {
	ApiInitializer,
	EnvironmentInitializer,
	ExtendedBootstrapOptions,
	ServerPipelineInitializer,
	TypeOrmInitializer
} from './init';
import {BeforeDoPipelineInitialization, BeforeDoServerLaunch} from './types';

export const launchServer = async <O extends ExtendedBootstrapOptions>(options?: {
	beforeDoPipelineInitialization?: BeforeDoPipelineInitialization;
	beforeDoServerLaunch?: BeforeDoServerLaunch;
	optionClass?: Type<O>
}) => {
	const {beforeDoPipelineInitialization, beforeDoServerLaunch, optionClass} = options ?? {};

	// create bootstrap options
	const bootstrapOptions = await new EnvironmentInitializer().load(optionClass);
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
