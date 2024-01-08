import {BootstrapOptions, DynamicModuleCreator} from '@rainbow-o23/n2';
import {DYNAMIC_PIPELINE_CODE, DynamicPipeline} from './dynamic-pipeline';

export class DynamicModule {
	public static registerMyself(bootstrap: BootstrapOptions) {
		DynamicModuleCreator.create({
			moduleName: 'DynamicModule',
			pipelines: [
				{code: DYNAMIC_PIPELINE_CODE, route: '/examples/dynamic', method: 'post', def: DynamicPipeline}
			]
		}).registerMyself(bootstrap);
	}
}
