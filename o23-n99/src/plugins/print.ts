import '@rainbow-o23/n91';
import {PipelineExecutionContext, PipelineRepository} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {PDF_PRINT_SETTINGS} from '@rainbow-o23/n5';

export const usePdfSubTemplates = (options: BootstrapOptions) => {
	PDF_PRINT_SETTINGS.findSubTemplate = async (_data: any, templateCode: string, $context: PipelineExecutionContext) => {
		const pipeline = await PipelineRepository.findPipeline(
			'PrintTemplateFindSubTemplate', {logger: options.getConfig().getLogger(), config: options.getConfig()});
		const response = await pipeline.perform({
			payload: {code: templateCode}, $context
		});
		// template file is on buffer format
		// noinspection JSUnresolvedReference
		return (response.payload?.templateFile ?? '').toString();
	};
};
