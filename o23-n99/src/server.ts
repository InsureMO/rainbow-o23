import {BootstrapOptions} from '@rainbow-o23/n2';
import {launchServer} from '@rainbow-o23/n90';
import '@rainbow-o23/n91';
import {SimpleModule} from './simple';

const useSimpleModule = async (options: BootstrapOptions) => {
	if (options.getEnvAsBoolean('app.examples.enabled', false)) {
		SimpleModule.registerMyself(options);
	}
};
// noinspection JSIgnoredPromiseFromCall
launchServer({beforeDoServerLaunch: useSimpleModule});
