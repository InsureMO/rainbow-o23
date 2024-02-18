import {PipelineStepPayload, UncatchableError} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from '@rainbow-o23/n3';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions,
	redressString
} from '@rainbow-o23/n4';
import {ERR_AWS_CLIENT_NAME_NOT_DEFINED} from '../error-codes';

export interface AbstractRegionPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	clientName: string;
}

export interface AbstractRegionPipelineStepInFragment {
}

export interface AbstractRegionPipelineStepOutFragment {
}

export abstract class AbstractRegionPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = AbstractRegionPipelineStepInFragment, OutFragment = AbstractRegionPipelineStepOutFragment>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _clientName?: string;

	public constructor(options: AbstractRegionPipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		if (options.clientName == null || options.clientName.trim().length === 0) {
			throw new UncatchableError(ERR_AWS_CLIENT_NAME_NOT_DEFINED, `Aws S3 client name cannot be empty.`);
		}
		this._clientName = options.clientName.trim();
	}

	protected getClientName(): string {
		return this._clientName;
	}
}

export type AbstractRegionPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	client?: AbstractRegionPipelineStepOptions['clientName'];
};

export abstract class AbstractRegionPipelineStepBuilder<G extends AbstractRegionPipelineStepBuilderOptions, O extends AbstractRegionPipelineStepOptions, S extends AbstractRegionPipelineStep>
	extends AbstractFragmentaryPipelineStepBuilder<G, O, S> {
	protected readMoreOptions(given: G, transformed: O): O {
		transformed = super.readMoreOptions(given, transformed);
		transformed.clientName = redressString(given.client);
		if (transformed.clientName == null) {
			throw new UncatchableError(ERR_AWS_CLIENT_NAME_NOT_DEFINED, `Aws client name[client] not defined for aws region pipeline step[${given.name}].`);
		}
		return transformed;
	}
}
