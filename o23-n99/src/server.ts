import {PipelineRepository} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {PDF_PRINT_SETTINGS} from '@rainbow-o23/n5';
import {launchServer} from '@rainbow-o23/n90';
import '@rainbow-o23/n91';
import {SimpleModule} from './simple';

const useSimpleModule = async (options: BootstrapOptions) => {
	if (options.getEnvAsBoolean('app.examples.enabled', false)) {
		SimpleModule.registerMyself(options);
	}
};
const usePdfSubTemplates = (options: BootstrapOptions) => {
	PDF_PRINT_SETTINGS.findSubTemplate = async (_data: any, templateCode: string) => {
		const pipeline = await PipelineRepository.findPipeline(
			'PrintTemplateFindSubTemplate', {logger: options.getConfig().getLogger(), config: options.getConfig()});
		const response = await pipeline.perform({payload: {code: templateCode}});
		// template file is on buffer format
		// noinspection JSUnresolvedReference
		return (response.payload?.templateFile ?? '').toString();
	};
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
