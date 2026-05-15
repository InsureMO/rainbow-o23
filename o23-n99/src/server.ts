import {BootstrapOptions} from '@rainbow-o23/n2';
import {ExtendedBootstrapOptions, launchServer} from '@rainbow-o23/n90';
import {usePluginsInitialize} from './plugins';
import {HelloWorld} from './programmatic';
import {SimpleModule} from './simple';

const useSimpleModule = async (options: BootstrapOptions) => {
	if (options.getEnvAsBoolean('app.examples.enabled', false)) {
		SimpleModule.registerMyself(options);
	}
};

// sample of customize logger format
// class MyBootstrapOptions extends ExtendedBootstrapOptions {
// 	customizedLoggerFormat(info: Logform.TransformableInfo): Logform.TransformableInfo {
// 		info.greeting = 'hello world';
// 		return info;
// 	}
// }

// process.env.CFG_LOGGER_COMBINED_LEVEL = 'info';
// EnhancedLogger.enableLevel('log');

// noinspection JSIgnoredPromiseFromCall
launchServer({
	beforeDoPipelineInitialization: async (options: ExtendedBootstrapOptions) => {
		await usePluginsInitialize(options);
		options.addProgrammaticPipelineDef({'HelloWorld': HelloWorld});
	},
	beforeDoServerLaunch: async (options: BootstrapOptions) => {
		await useSimpleModule(options);
	}
	// optionClass: MyBootstrapOptions
});
