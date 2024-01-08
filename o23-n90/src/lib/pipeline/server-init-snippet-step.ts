import {PipelineRepository, PipelineStepHelpers, PipelineStepPayload, PipelineStepType} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {SnippetPipelineStep, SnippetPipelineStepOptions} from '@rainbow-o23/n3';
import {
	ParsedPipelineDef,
	ParsedPipelineStepDef,
	PipelineStepBuilderType,
	Reader,
	SnippetPipelineStepBuilder
} from '@rainbow-o23/n4';
import {ConfigUtils} from '../config';

export interface ServerInitPipelineStepHelpers {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	createDefReader: () => Reader<any>;
	registerStep: (def: ParsedPipelineStepDef) => void;
	registerPipelines: (defs: Array<ParsedPipelineDef>) => void;
}

export interface ServerInitSnippetPipelineStepOptions extends SnippetPipelineStepOptions {
	$helpers: ServerInitPipelineStepHelpers;
}

export class ServerInitSnippetPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends SnippetPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _helpers: ServerInitPipelineStepHelpers;

	public constructor(options: ServerInitSnippetPipelineStepOptions) {
		super(options);
		this._helpers = options.$helpers;
	}

	public getHelpers(): PipelineStepHelpers & ServerInitPipelineStepHelpers {
		return {...super.getHelpers(), ...this._helpers};
	}
}

export const createServerInitSnippetStepBuilder = (
	bootstrapOptions: BootstrapOptions,
	registerPipelines: ServerInitPipelineStepHelpers['registerPipelines']): PipelineStepBuilderType => {
	return class InitSnippetPipelineStepBuilder extends SnippetPipelineStepBuilder {
		protected getStepType(): PipelineStepType<ServerInitSnippetPipelineStep> {
			return ServerInitSnippetPipelineStep;
		}

		public async create(options?: Omit<SnippetPipelineStepOptions, 'name'>): Promise<SnippetPipelineStep> {
			return super.create({
				...(options || {}),
				$helpers: {
					createDefReader: () => ConfigUtils.createDefReader(bootstrapOptions),
					registerStep: (def: ParsedPipelineStepDef) => PipelineRepository.putStep({[def.code]: def.def}),
					registerPipelines
				} as ServerInitPipelineStepHelpers
			} as unknown as ServerInitSnippetPipelineStepOptions);
		}
	};
};
