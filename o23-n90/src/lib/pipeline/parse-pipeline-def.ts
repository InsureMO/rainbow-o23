import {PipelineStepData, PipelineStepPayload, PipelineStepType, StepHelpersUtils} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from '@rainbow-o23/n3';
import {
	AbstractFragmentaryPipelineStepBuilder,
	ExposedParsedPipelineDef,
	FragmentaryPipelineStepBuilderOptions,
	ParsedDef,
	ParsedPipelineDef,
	PipelineStepBuilderType,
	Reader
} from '@rainbow-o23/n4';
import {ConfigUtils} from '../config';
import {O23PipelineDefs} from '../types';
import {TriggerPipelinePipelineStepBuilderOptions} from './trigger-pipeline-step';

export interface ParsePipelineDefPipelineStepOptions extends FragmentaryPipelineStepOptions {
	reader: () => Promise<Reader<string>>;
}

export class ParsePipelineDefPipelineStep
	extends AbstractFragmentaryPipelineStep<PipelineStepPayload, PipelineStepPayload, O23PipelineDefs, null> {
	private readonly _createReader: () => Promise<Reader<string>>;

	public constructor(options: ParsePipelineDefPipelineStepOptions) {
		super(options);
		this._createReader = options.reader;
	}

	protected async createReader(): Promise<Reader<string>> {
		return await this._createReader();
	}

	protected isPipelineDef(def: ParsedDef): def is ParsedPipelineDef {
		return def.type === 'pipeline';
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: O23PipelineDefs, _request: PipelineStepData): Promise<null> {
		const config = data.config;
		if (config == null || config.trim().length === 0) {
			// no configuration to parse, do nothing
		} else {
			try {
				const parsed = (await this.createReader()).load(config) as ParsedDef;
				data.defCode = parsed.code;
				if (this.isPipelineDef(parsed)) {
					const route = (parsed as ExposedParsedPipelineDef).route;
					if (StepHelpersUtils.isNotBlank(route)) {
						data.exposeApi = true;
						data.exposeRoute = (route ?? '').trim();
					} else {
						data.exposeApi = false;
						delete data.exposeRoute;
					}
				}
			} catch {
				// do nothing
			}
		}
		// return nothing, given data might be changed in-memory
		return null;
	}
}

export const createParsePipelineDefStepBuilder = (options: BootstrapOptions): PipelineStepBuilderType => {
	return class ParsePipelineDefPipelineStepBuilder
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		extends AbstractFragmentaryPipelineStepBuilder<FragmentaryPipelineStepBuilderOptions, ParsePipelineDefPipelineStepOptions, ParsePipelineDefPipelineStep> {
		protected getStepType(): PipelineStepType<ParsePipelineDefPipelineStep> {
			return ParsePipelineDefPipelineStep;
		}

		protected readMoreOptions(given: TriggerPipelinePipelineStepBuilderOptions, transformed: ParsePipelineDefPipelineStepOptions): ParsePipelineDefPipelineStepOptions {
			transformed = super.readMoreOptions(given, transformed);
			transformed.reader = async () => ConfigUtils.createDefReader(options);
			return transformed;
		}
	};
};