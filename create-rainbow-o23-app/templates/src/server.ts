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
// noinspection JSIgnoredPromiseFromCall
launchServer({
	beforeDoPipelineInitialization: async (options: ExtendedBootstrapOptions) => {
		await usePluginsInitialize(options);
		options.addProgrammaticPipelineDef({'HelloWorld': HelloWorld});
	},
	beforeDoServerLaunch: async (options: BootstrapOptions) => {
		await useSimpleModule(options);
	}
});
