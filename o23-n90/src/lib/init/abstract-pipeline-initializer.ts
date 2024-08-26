import {EnhancedLogger, PipelineCode, PipelineRepository, PipelineStepCode, UncatchableError} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {ParsedDef, ParsedPipelineDef, ParsedPipelineStepDef, registerDefaults} from '@rainbow-o23/n4';
import * as fs from 'fs';
import {glob} from 'glob';
import * as path from 'path';
import {ConfigConstants, ConfigUtils} from '../config';
import {ERR_DUPLICATED_PIPELINE, ERR_DUPLICATED_PIPELINE_STEP} from '../error-codes';

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

	protected getScanDir(options: BootstrapOptions): Array<string> {
		const dirs = options.getEnvAsString(ConfigConstants.APP_INIT_PIPELINES_DIR, this.getDefaultScanDir())
			.split(',')
			.map(dir => dir.trim())
			.filter(dir => dir.length !== 0)
			.map(dir => dir.endsWith(path.sep) ? dir.slice(0, -1) : dir);
		return [...new Set(dirs)];
	}

	protected abstract getDefaultScanDir(): string;

	protected async scanDefFiles(options: BootstrapOptions): Promise<Array<string>> {
		return (await Promise.all(this.getScanDir(options)
			.map(dir => path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir))
			.map(dir => glob(path.resolve(dir, '**', options.getEnvAsString(ConfigConstants.APP_INIT_PIPELINE_FILE, '*.{yaml,yml}')).replace(/\\/g, '/')))))
			.flat();
	}

	protected getExcludedDirs(options: BootstrapOptions): Array<string> {
		const scanDirs = this.getScanDir(options);
		return options.getEnvAsString(ConfigConstants.APP_EXCLUDED_PIPELINE_DIR, '')
			.split(',')
			.map(dir => dir.trim())
			.filter(dir => dir.length !== 0)
			.map(dir => scanDirs.map(scanDir => path.resolve(process.cwd(), scanDir, dir)))
			.flat();
	}

	private parseDef(options: {
		key: string; def: ParsedDef;
		pipelineMap: Record<PipelineCode, string>; stepMap: Record<PipelineStepCode, string>;
		options: BootstrapOptions;
		add: (def: ParsedPipelineDef) => void
	}) {
		const {
			key, def,
			pipelineMap, stepMap,
			options: bootstrapOptions, add
		} = options;

		if (def.type === 'step-sets' || def.type === 'step') {
			const parsed = def as ParsedPipelineStepDef;
			if (parsed.enabled === false) {
				bootstrapOptions.getConfig().getLogger().warn(`Pipeline Step[${def.code}] is disabled, ignored.`);
			} else {
				if (stepMap[parsed.code] != null) {
					throw new UncatchableError(ERR_DUPLICATED_PIPELINE_STEP, `Duplicated pipeline step definitions[code=${parsed.code}, first=${stepMap[parsed.code]}, second=${key}] detected.`);
				}
				PipelineRepository.putStep({[parsed.code]: parsed.def});
				stepMap[parsed.code] = key;
			}
		} else {
			const parsed = def as ParsedPipelineDef;
			if (pipelineMap[parsed.code] != null) {
				throw new UncatchableError(ERR_DUPLICATED_PIPELINE, `Duplicated pipeline definitions[code=${parsed.code}, first=${pipelineMap[parsed.code]}, second=${key}] detected.`);
			}
			add(parsed);
			pipelineMap[parsed.code] = key;
		}
	}

	protected async readDefs(
		options: BootstrapOptions,
		add: (def: ParsedPipelineDef) => void,
		prebuilt?: (options: BootstrapOptions) => Array<{ key: string; content: string }>
	): Promise<void> {
		const files = await this.scanDefFiles(options);
		const excludedDirs = this.getExcludedDirs(options);
		const pipelineMap: Record<PipelineCode, string> = {};
		const stepMap: Record<PipelineStepCode, string> = {};
		const reader = ConfigUtils.createDefReader(options);

		const prebuiltDefs = prebuilt == null ? [] : prebuilt(options);
		prebuiltDefs.forEach(({key, content}) => {
			const def = reader.load(content);
			this.parseDef({key, def, pipelineMap, stepMap, options, add});
		});
		files.filter(file => excludedDirs.every(dir => !file.startsWith(dir)))
			.sort()
			.forEach(file => {
				const content = fs.readFileSync(file);
				const def = reader.load(content.toString());
				this.parseDef({key: file, def, pipelineMap, stepMap, options, add});
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