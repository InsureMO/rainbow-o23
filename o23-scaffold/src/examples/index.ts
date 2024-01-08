import {BootstrapOptions} from '@rainbow-o23/n2';
import {DynamicModule} from './dynamic';
import {SimpleModule} from './simple';
import {SingleEntityModule} from './single-entity';

export const registerExampleModules = (options: BootstrapOptions) => {
	if (!options.getEnvAsBoolean('app.examples.enabled', false)) {
		return;
	}
	SimpleModule.registerMyself(options);
	SingleEntityModule.registerMyself(options);
	DynamicModule.registerMyself(options);
};
