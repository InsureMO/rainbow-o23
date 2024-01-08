import {Module} from '@nestjs/common';
import {PipelineRepository} from '@rainbow-o23/n1';
import {BootstrapOptions} from '../bootstrap-options';
import {DynamicModuleController} from './controllers';
import {DynamicModulePipelines} from './pipelines';
import {DynamicModule, DynamicModuleOptions} from './types';

export class DynamicModuleCreator {
	// noinspection JSUnusedLocalSymbols
	private constructor() {
		// avoid extend
	}

	public static create(options: DynamicModuleOptions): DynamicModule {
		const {moduleName, pipelines} = options;
		const ModuleClass = class {
		};
		Object.defineProperty(ModuleClass, 'name', {value: moduleName});
		Object.defineProperty(ModuleClass, 'registerMyself', {
			value: (bootstrap: BootstrapOptions) => {
				// add module, handle by controller
				bootstrap.addModule(ModuleClass);
				// add pipeline, handle by standard pipeline controller
				PipelineRepository.putPipeline(DynamicModulePipelines.create(pipelines));
			}
		});
		// decorate module class with given pipelines
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		Reflect.decorate([Module({controllers: DynamicModuleController.createControllers(pipelines)})], ModuleClass, void 0, void 0);

		return ModuleClass as unknown as DynamicModule;
	}
}
