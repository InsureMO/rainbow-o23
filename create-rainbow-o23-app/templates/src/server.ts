import {BootstrapOptions} from '@rainbow-o23/n2';
import {launchServer} from '@rainbow-o23/n90';
import {usePluginsInitialize} from './plugins';
import {SimpleModule} from './simple';

const useSimpleModule = async (options: BootstrapOptions) => {
	if (options.getEnvAsBoolean('app.examples.enabled', false)) {
		SimpleModule.registerMyself(options);
	}
};
// noinspection JSIgnoredPromiseFromCall
launchServer({
	beforeDoPipelineInitialization: async (options: BootstrapOptions) => {
		await usePluginsInitialize(options);
	},
	beforeDoServerLaunch: async (options: BootstrapOptions) => {
		await useSimpleModule(options);
	}
});
