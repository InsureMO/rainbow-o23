import {PipelineStepData, PipelineStepPayload} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from './abstract-fragmentary-pipeline-step';
import {Utils} from './utils';

export interface GetPropertyPipelineStepOptions extends FragmentaryPipelineStepOptions {
	/** When obtaining hierarchical tree nodes, concatenate names by ".". */
	propertyName: string;
}

/**
 * get value from in fragment by given property name, recursive property names is supported.
 * array index in property name is not supported.
 */
export class GetPropertyPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _propertyName: string;

	public constructor(options: GetPropertyPipelineStepOptions) {
		super(options);
		this._propertyName = options.propertyName;
	}

	public getPropertyName(): string {
		return this._propertyName;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: InFragment, _request: PipelineStepData<In>): Promise<OutFragment> {
		if (data != null) {
			return Utils.getValue(data, this.getPropertyName());
		}
		return null;
	}
}
