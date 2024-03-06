import {EnhancedLogger} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {ParsedPipelineDef, StepBuilders} from '@rainbow-o23/n4';
import {ConfigConstants} from '../config';
import {
	createParsePipelineDefStepBuilder,
	createServerInitSnippetStepBuilder,
	createTriggerPipelineStepBuilder
} from '../pipeline';
import {ServerPipelineStepRegistrar} from '../plugins';
import {AbstractPipelineInitializer} from './abstract-pipeline-initializer';
import {prebuilt} from './server';

interface InitOnlyPipelineDef extends ParsedPipelineDef {
	initOnly: boolean;
}

export class ServerPipelineInitializer extends AbstractPipelineInitializer {
	public constructor() {
		super();
		EnhancedLogger.enable(`ApiTest.log`);
	}

	protected async registerSpecialSteps(options: BootstrapOptions): Promise<void> {
		StepBuilders.register('trigger-pipeline', createTriggerPipelineStepBuilder(options));
		StepBuilders.register('parse-pipeline-def', createParsePipelineDefStepBuilder(options));
		ServerPipelineStepRegistrar.registerAll(options);
	}

	protected getScanDir(options: BootstrapOptions): string {
		return options.getEnvAsString(ConfigConstants.APP_INIT_PIPELINES_DIR, ConfigConstants.APP_SERVER_INIT_PIPELINES_DEFAULT_DIR);
	}

	protected isInitOnly(def: ParsedPipelineDef): def is InitOnlyPipelineDef {
		return (def as InitOnlyPipelineDef).initOnly === true;
	}

	public async load(options: BootstrapOptions): Promise<Array<ParsedPipelineDef>> {
		await this.registerSpecialSteps(options);
		const initPipelines: Array<ParsedPipelineDef> = [];
		const serverPipelines: Array<ParsedPipelineDef> = [];
		StepBuilders.register('server-init-snippet', createServerInitSnippetStepBuilder(options,
			(pipelines) => {
				serverPipelines.push(...pipelines.filter(def => {
					if (def.enabled === false) {
						options.getConfig().getLogger().warn(`Pipeline[${def.code}] is disabled, ignored.`);
						return false;
					} else {
						return true;
					}
				}));
			}));
		await this.readDefs(options,
			(def) => {
				if (this.isInitOnly(def)) {
					// for startup
					initPipelines.push(def);
				} else {
					serverPipelines.push(def);
				}
			}, (options) => {
				const {
					initServer,
					apiTest,
					print,
					d9Config,
					pipelineDef
				} = prebuilt;
				const apiTestEnabled = options.getEnvAsBoolean('app.api.test', false);
				const printEnabled = options.getEnvAsBoolean('app.plugins.print', false);
				return [
					...initServer,
					...(apiTestEnabled ? apiTest : []),
					...(printEnabled ? print : []),
					...d9Config, ...pipelineDef
				];
			});
		// startup pipelines
		await this.executeInitPipelines(initPipelines, options);
		// register pipelines to server
		return serverPipelines.filter(def => {
			if (def.enabled === false) {
				options.getConfig().getLogger().warn(`Pipeline[${def.code}] is disabled, ignored.`);
				return false;
			} else {
				return true;
			}
		});
	}
}
