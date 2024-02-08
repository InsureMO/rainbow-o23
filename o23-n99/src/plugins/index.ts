import {BootstrapOptions} from '@rainbow-o23/n2';
import {usePdfSubTemplates} from './print';

export const usePluginsInitialize = async (options: BootstrapOptions) => {
	usePdfSubTemplates(options);
};
