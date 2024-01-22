import {BootstrapOptions} from '@rainbow-o23/n2';
import {launchServer} from '@rainbow-o23/n90';
import {usePdfSubTemplates} from './plugins/print';
import {SimpleModule} from './simple';

const useSimpleModule = async (options: BootstrapOptions) => {
	if (options.getEnvAsBoolean('app.examples.enabled', false)) {
		SimpleModule.registerMyself(options);
	}
};
// noinspection JSIgnoredPromiseFromCall
launchServer({
	beforeDoPipelineInitialization: async (options: BootstrapOptions) => {
		usePdfSubTemplates(options);
	},
	beforeDoServerLaunch: async (options: BootstrapOptions) => {
		await useSimpleModule(options);
	}
});
