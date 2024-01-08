import {EnhancedLogger} from '@rainbow-o23/n1';
import {BootstrapOptions, DynamicModuleCreator} from '@rainbow-o23/n2';
import {ExposedParsedPipelineDef, ParsedPipelineDef} from '@rainbow-o23/n4';

export class ApiInitializer {
	public constructor() {
		EnhancedLogger.enable(`${ApiInitializer.name}.log`);
	}

	public async load(options: BootstrapOptions, pipelines: Array<ParsedPipelineDef>): Promise<void> {
		options.getConfig().getLogger().log(`Start to initialize pipeline(s) [${pipelines.map(p => p.code).join(', ')}] `, ApiInitializer.name);
		DynamicModuleCreator.create({
			moduleName: 'DynamicModule',
			pipelines: pipelines.map(pipeline => {
				const p = pipeline as ExposedParsedPipelineDef;
				return {
					// pipeline itself
					code: p.code, def: p.def,
					// exposed as api, in
					route: p.route, method: p.method,
					headers: p.headers, pathParams: p.pathParams, queryParams: p.queryParams,
					body: p.body, files: p.files,
					// exposed as api, out
					exposeHeaders: p.exposeHeaders, exposeFile: p.exposeFile
				};
			})
		}).registerMyself(options);
	}
}
