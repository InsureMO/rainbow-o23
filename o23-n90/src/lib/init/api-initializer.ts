import {EnhancedLogger} from '@rainbow-o23/n1';
import {BootstrapOptions, DynamicModuleCreator} from '@rainbow-o23/n2';
import {ExposedParsedPipelineDef, ParsedPipelineDef} from '@rainbow-o23/n4';

export class ApiInitializer {
	public constructor() {
		EnhancedLogger.enable(`${ApiInitializer.name}.log`);
	}

	public async load(options: BootstrapOptions, pipelines: Array<ParsedPipelineDef>): Promise<void> {
		const logger = options.getConfig().getLogger();
		if (pipelines.length === 0) {
			logger.log('No pipeline given.', ApiInitializer.name);
		} else {
			logger.log('Start to initialize pipeline(s):', ApiInitializer.name);
			pipelines.forEach(pipeline => {
				const p = pipeline as ExposedParsedPipelineDef;
				if (p.route != null && p.route.trim().length !== 0) {
					const authorizations = p.authorizations == null ? '' : (typeof p.authorizations === 'string' ? p.authorizations : p.authorizations.join(', '));
					if (authorizations.trim().length === 0) {
						logger.log(`Pipeline[${p.code}] is exposed as api[${p.method.toUpperCase()} ${p.route}].`, ApiInitializer.name);
					} else {
						logger.log(`Pipeline[${p.code}] is exposed as api[${p.method.toUpperCase()} ${p.route}], with authorization[${authorizations}].`, ApiInitializer.name);
					}
				} else {
					logger.log(`Pipeline[${p.code}] is loaded.`, ApiInitializer.name);
				}
			});
		}
		DynamicModuleCreator.create({
			moduleName: 'DynamicModule',
			pipelines: pipelines.map(pipeline => {
				const p = pipeline as ExposedParsedPipelineDef;
				return {
					// pipeline itself
					code: p.code, def: p.def,
					// authorizations
					authorizations: p.authorizations,
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
