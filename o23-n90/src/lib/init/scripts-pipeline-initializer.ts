import {BootstrapOptions} from '@rainbow-o23/n2';
import {ParsedPipelineDef, StepBuilders} from '@rainbow-o23/n4';
import {ConfigConstants} from '../config';
import {createScriptsLoadFilesStepBuilder} from '../pipeline';
import {AbstractPipelineInitializer} from './abstract-pipeline-initializer';
import {ExtendedBootstrapOptions} from './extended-bootstrap-options';
import prebuiltPipelines from './scripts';

export class ScriptsPipelineInitializer extends AbstractPipelineInitializer {
	protected async registerSpecialSteps(options: BootstrapOptions): Promise<void> {
		StepBuilders.register('scripts-load-files', createScriptsLoadFilesStepBuilder(options));
	}

	protected getDefaultScanDir(): string {
		return ConfigConstants.APP_SCRIPTS_INIT_PIPELINES_DEFAULT_DIR;
	}

	public async load(options: ExtendedBootstrapOptions): Promise<void> {
		await this.registerSpecialSteps(options);
		const pipelines: Array<ParsedPipelineDef> = [];
		await this.readDefs(options,
			(def) => pipelines.push(def),
			() => prebuiltPipelines);
		await this.executeInitPipelines(pipelines, options);
	}
}
