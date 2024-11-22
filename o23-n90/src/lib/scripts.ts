import {EnvironmentInitializer, ScriptsPipelineInitializer, TypeOrmInitializer} from './init';
import {BeforeDoPipelineInitialization} from './types';

export const launchScripts = async (options?: {
	beforeDoPipelineInitialization?: BeforeDoPipelineInitialization;
}) => {
	const {beforeDoPipelineInitialization} = options ?? {};
	// create bootstrap options
	const bootstrapOptions = await new EnvironmentInitializer().load();
	await new TypeOrmInitializer().load(bootstrapOptions);
	if (beforeDoPipelineInitialization != null) {
		await beforeDoPipelineInitialization(bootstrapOptions);
	}
	await new ScriptsPipelineInitializer().load(bootstrapOptions);
	process.exit(0);
};
