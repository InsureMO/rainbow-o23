import {BootstrapOptions} from '@rainbow-o23/n2';
import {usePdfSubTemplates} from './print';
import './aws';

export const usePluginsInitialize = async (options: BootstrapOptions) => {
	usePdfSubTemplates(options);
};
