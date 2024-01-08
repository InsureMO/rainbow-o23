import {
	AbstractPipeline,
	LoggerUtils,
	Pipeline,
	PipelineCode,
	PipelineOptions,
	PipelineRepository,
	PipelineStepBuilder,
	PipelineStepData,
	PipelineStepPayload,
	PipelineStepType,
	UncatchableError,
	Undefinable
} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from '@rainbow-o23/n3';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions,
	ParsedDef,
	ParsedPipelineDef,
	ParsedPipelineStepDef,
	PipelineStepBuilderType,
	Reader
} from '@rainbow-o23/n4';
import {ConfigUtils} from '../config';
import {ERR_PIPELINE_NOT_FOUND_BY_TRIGGER, ERR_PIPELINE_TRIGGER_NOT_SUPPORTED} from '../error-codes';
import {CryptoUtils, MD5} from '../utils';

export type TriggerPipelinePipelineStepOptions = FragmentaryPipelineStepOptions & {
	reader: () => Promise<Reader<string>>;
};

export interface PipelineTrigger {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any;
}

export interface PipelineTriggerByContent extends PipelineTrigger {
	content?: string | ParsedDef;
	cacheKey?: string;
}

export interface PipelineTriggerByCode extends PipelineTrigger {
	code?: PipelineCode;
}

const PIPELINE_CACHE: Record<string, [MD5, ParsedPipelineDef]> = {};

export class TriggerPipelinePipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, OutFragment = Out>
	extends AbstractFragmentaryPipelineStep<In, Out, PipelineTrigger, OutFragment> {
	private readonly _createReader: () => Promise<Reader<string>>;

	public constructor(options: TriggerPipelinePipelineStepOptions) {
		super(options);
		this._createReader = options.reader;
	}

	protected isTriggerByCode(trigger: PipelineTrigger): trigger is PipelineTriggerByCode {
		const code = (trigger as PipelineTriggerByCode).code;
		return code != null && code.trim().length !== 0;
	}

	protected isTriggerByContent(trigger: PipelineTrigger): trigger is PipelineTriggerByContent {
		const content = (trigger as PipelineTriggerByContent).content;
		if (content == null) {
			return false;
		}
		if (typeof content !== 'string') {
			return true;
		}
		return content.trim().length !== 0;
	}

	protected async createReader(): Promise<Reader<string>> {
		return await this._createReader();
	}

	protected buildPipelineOptions(): PipelineOptions {
		return {config: this.getConfig(), logger: this.getLogger()};
	}

	protected isPipelineDef(def: ParsedDef): def is ParsedPipelineDef {
		return def.type === 'pipeline';
	}

	protected async findPipeline(trigger: PipelineTrigger): Promise<Undefinable<Pipeline>> {
		if (this.isTriggerByCode(trigger)) {
			return await PipelineRepository.findPipeline(trigger.code, this.buildPipelineOptions());
		} else if (this.isTriggerByContent(trigger)) {
			const {content, cacheKey} = trigger;
			let def: ParsedDef = null;
			let md5: MD5 = null;
			if (typeof content === 'string') {
				if (cacheKey != null && cacheKey.trim().length !== 0) {
					[md5, def] = PIPELINE_CACHE[cacheKey] ?? [];
					if (md5 != null && def != null) {
						const currentMd5 = CryptoUtils.md5(content);
						if (currentMd5 === md5) {
							// content not change, use def from cache
							return (def as ParsedPipelineDef).def.create(this.buildPipelineOptions());
						}
					}
				}
				// not returned, which means no cache or content changed
				// read content
				def = (await this.createReader()).load(content) as ParsedDef;
			} else {
				// content is parsed def, use it directly
				def = content;
			}
			if (!this.isPipelineDef(def)) {
				// build a temporary pipeline to wrap given step def
				const stepDef = def as ParsedPipelineStepDef;
				const code = `TemporaryPipelineForStep${stepDef.code}`;
				def = {
					code,
					type: 'pipeline',
					def: {
						create: async (options?: PipelineOptions): Promise<Pipeline> => {
							const PipelineClass = class extends AbstractPipeline {
								public getCode(): PipelineCode {
									return code;
								}

								protected getStepBuilders(): Array<PipelineStepBuilder> {
									return [stepDef.def];
								}
							};
							Object.defineProperty(PipelineClass, 'name', {value: code});
							return new PipelineClass(options);
						}
					}
				} as ParsedPipelineDef;
			}

			if (cacheKey != null && cacheKey.trim().length !== 0 && typeof content === 'string') {
				// only when content is string and cache key declared
				PIPELINE_CACHE[cacheKey] = [CryptoUtils.md5(content), def as ParsedPipelineDef];
			}
			return (def as ParsedPipelineDef).def.create(this.buildPipelineOptions());
		} else {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
			const {data, cacheKey, ...rest} = trigger as any;
			throw new UncatchableError(ERR_PIPELINE_TRIGGER_NOT_SUPPORTED, `Pipeline trigger[${LoggerUtils.stringifyObject(rest)}] not supported.`);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(trigger: PipelineTrigger, request: PipelineStepData<In>): Promise<OutFragment> {
		const pipeline = await this.findPipeline(trigger);
		if (pipeline == null) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
			const {data, cacheKey, ...rest} = trigger as any;
			throw new UncatchableError(ERR_PIPELINE_NOT_FOUND_BY_TRIGGER, `Pipeline trigger[${LoggerUtils.stringifyObject(rest)}] not found.`);
		}
		const {data} = trigger;
		const result = await pipeline.perform({payload: data});
		return result.payload;
	}
}

export type TriggerPipelinePipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions;

export const createTriggerPipelineStepBuilder = (options: BootstrapOptions): PipelineStepBuilderType => {
	return class TriggerPipelinePipelineStepBuilder
		extends AbstractFragmentaryPipelineStepBuilder<TriggerPipelinePipelineStepBuilderOptions, TriggerPipelinePipelineStepOptions, TriggerPipelinePipelineStep> {
		protected getStepType(): PipelineStepType<TriggerPipelinePipelineStep> {
			return TriggerPipelinePipelineStep;
		}

		protected readMoreOptions(given: TriggerPipelinePipelineStepBuilderOptions, transformed: TriggerPipelinePipelineStepOptions): TriggerPipelinePipelineStepOptions {
			transformed = super.readMoreOptions(given, transformed);
			transformed.reader = async () => ConfigUtils.createDefReader(options);
			return transformed;
		}
	};
};
