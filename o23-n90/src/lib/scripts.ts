import {EnvironmentInitializer, ScriptsPipelineInitializer, TypeOrmInitializer} from './init';

export const launchScripts = async () => {
	// create bootstrap options
	const options = await new EnvironmentInitializer().load();
	await new TypeOrmInitializer().load(options);
	await new ScriptsPipelineInitializer().load(options);
	process.exit(0);
};
