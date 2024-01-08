import {
	PipelineRepository,
	PipelineStep,
	PipelineStepBuilder,
	PipelineStepCode,
	PipelineStepData,
	PipelineStepOptions,
	PipelineStepPayload,
	UncatchableError
} from '@rainbow-o23/n1';
import {ERR_PIPELINE_STEP_REF_NOT_EMPTY, ERR_PIPELINE_STEP_REF_NOT_FOUND} from '../error-codes';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from './abstract-fragmentary-pipeline-step';

export interface RefStepPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	code: PipelineStepCode;
}

export class RefStepPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _code: PipelineStepCode;
	private readonly _stepBuilder: PipelineStepBuilder;

	public constructor(options: RefStepPipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		if (options.code == null || options.code.trim().length === 0) {
			throw new UncatchableError(ERR_PIPELINE_STEP_REF_NOT_EMPTY, `Reference step code cannot be empty.`);
		}
		this._code = options.code;
		this._stepBuilder = {
			create: async (options?: PipelineStepOptions): Promise<PipelineStep> => {
				const builder = await PipelineRepository.findStep(this.getCode());
				if (builder == null) {
					throw new UncatchableError(ERR_PIPELINE_STEP_REF_NOT_FOUND, `Reference step builder[${this.getCode()}] not found.`);
				}
				return builder.create(options);
			}
		};
	}

	public getCode(): PipelineStepCode {
		return this._code;
	}

	protected getStepBuilder(): PipelineStepBuilder {
		return this._stepBuilder;
	}

	protected buildStepOptions(): Pick<PipelineStepOptions, 'config' | 'logger'> {
		return {config: this.getConfig(), logger: this.getLogger()};
	}

	protected async doPerform(data: InFragment, request: PipelineStepData<In>): Promise<OutFragment> {
		const builder = this.getStepBuilder();
		const step = await builder.create(this.buildStepOptions());
		const result = await step.perform({content: data, $context: request.$context});
		return result.content;
	}
}
