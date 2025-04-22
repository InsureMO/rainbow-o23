import {
	Pipeline,
	PipelineBuilder,
	PipelineCode,
	PipelineOptions,
	PipelineRepository,
	PipelineStepData,
	PipelineStepOptions,
	PipelineStepPayload,
	UncatchableError
} from '@rainbow-o23/n1';
import {ERR_PIPELINE_REF_NOT_EMPTY, ERR_PIPELINE_REF_NOT_FOUND} from '../error-codes';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from './abstract-fragmentary-pipeline-step';

export interface RefPipelinePipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	code: PipelineCode;
}

export class RefPipelinePipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _code: PipelineCode;
	private readonly _pipelineBuilder: PipelineBuilder;

	public constructor(options: RefPipelinePipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		if (options.code == null || options.code.trim().length === 0) {
			throw new UncatchableError(ERR_PIPELINE_REF_NOT_EMPTY, `Reference pipeline code cannot be empty.`);
		}
		this._code = options.code;
		this._pipelineBuilder = {
			create: async (options?: PipelineOptions): Promise<Pipeline> => {
				const pipeline = await PipelineRepository.findPipeline(this.getCode(), options ?? this.buildPipelineOptions());
				if (pipeline == null) {
					throw new UncatchableError(ERR_PIPELINE_REF_NOT_FOUND, `Reference pipeline builder[${this.getCode()}] not found.`);
				}
				return pipeline;
			}
		};
	}

	public getCode(): PipelineCode {
		return this._code;
	}

	protected getPipelineBuilder(): PipelineBuilder {
		return this._pipelineBuilder;
	}

	protected buildPipelineOptions(): PipelineOptions {
		return {config: this.getConfig(), logger: this.getLogger()};
	}

	protected buildStepOptions(): Pick<PipelineStepOptions, 'config' | 'logger'> {
		return {config: this.getConfig(), logger: this.getLogger()};
	}

	protected async doPerform(data: InFragment, request: PipelineStepData<In>): Promise<OutFragment> {
		const pipeline = await this.getPipelineBuilder().create(this.buildPipelineOptions());
		const result = await pipeline.perform({payload: data, $context: request.$context});
		return result.payload;
	}
}
