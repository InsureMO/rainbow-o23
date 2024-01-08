import {EnhancedLogger, PipelineCode, PipelineRepository, PipelineStepCode, UncatchableError} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {ParsedPipelineDef, ParsedPipelineStepDef, registerDefaults} from '@rainbow-o23/n4';
import * as fs from 'fs';
import {glob} from 'glob';
import * as path from 'path';
import {ConfigUtils} from '../config';

export abstract class AbstractPipelineInitializer {
	public constructor() {
		registerDefaults();
		EnhancedLogger.enable(`${this.constructor.name}.log`);
	}

	/**
	 * default do nothing
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async registerSpecialSteps(_options: BootstrapOptions): Promise<void> {
		// do nothing
	}

	protected abstract getScanDir(options: BootstrapOptions): string;

	protected async scanDefFiles(options: BootstrapOptions): Promise<Array<string>> {
		let dir = this.getScanDir(options);
		// noinspection TypeScriptValidateJSTypes
		dir = dir.startsWith('/') ? dir : path.resolve(process.cwd(), dir);
		return glob(`${dir}/**/*.{yaml,yml}`);
	}

	protected getExcludedDirs(options: BootstrapOptions): Array<string> {
		const scanDir = this.getScanDir(options);
		return options.getEnvAsString('app.excluded.pipelines.dirs', '')
			.split(',')
			.map(dir => dir.trim())
			.filter(dir => dir.length !== 0)
			.map(dir => path.resolve(process.cwd(), scanDir, dir));
	}

	protected async readDefs(options: BootstrapOptions, add: (def: ParsedPipelineDef) => void): Promise<void> {
		const files = await this.scanDefFiles(options);
		const excludedDirs = this.getExcludedDirs(options);
		const map: Record<PipelineCode, string> = {};
		const stepMap: Record<PipelineStepCode, string> = {};
		const reader = ConfigUtils.createDefReader(options);
		files.filter(file => excludedDirs.every(dir => !file.startsWith(dir)))
			.sort()
			.forEach(file => {
				const content = fs.readFileSync(file);
				const def = reader.load(content.toString());
				if (def.type === 'step-sets' || def.type === 'step') {
					const parsed = def as ParsedPipelineStepDef;
					if (parsed.enabled === false) {
						options.getConfig().getLogger().warn(`Pipeline Step[${def.code}] is disabled, ignored.`);
					} else {
						if (stepMap[parsed.code] != null) {
							throw new UncatchableError('', `Duplicated pipeline step definitions[code=${parsed.code}, first=${stepMap[parsed.code]}, second=${file}] detected.`);
						}
						PipelineRepository.putStep({[parsed.code]: parsed.def});
						stepMap[parsed.code] = file;
					}
				} else {
					const parsed = def as ParsedPipelineDef;
					if (map[parsed.code] != null) {
						throw new UncatchableError('', `Duplicated pipeline definitions[code=${parsed.code}, first=${map[parsed.code]}, second=${file}] detected.`);
					}
					add(parsed);
					map[parsed.code] = file;
				}
			});
	}

	protected async executeInitPipelines(pipelines: Array<ParsedPipelineDef>, options: BootstrapOptions) {
		// startup pipelines
		const initOptions = {logger: options.getConfig().getLogger(), config: options.getConfig()};
		await pipelines
			.filter(def => {
				if (def.enabled === false) {
					options.getConfig().getLogger().warn(`Pipeline[${def.code}] is disabled, ignored.`);
					return false;
				} else {
					return true;
				}
			})
			.reduce(async (previous, {def}) => {
				await previous;
				const pipeline = await def.create(initOptions);
				// startup pipeline has no request/response payload
				await pipeline.perform({payload: (void 0)});
				return Promise.resolve();
			}, Promise.resolve());
	}
}