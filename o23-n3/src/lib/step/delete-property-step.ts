import {PipelineStepData, PipelineStepOptions, PipelineStepPayload} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStep} from './abstract-fragmentary-pipeline-step';

export interface DeletePropertyPipelineStepOptions extends PipelineStepOptions {
	propertyNames: string | Array<string>;
}

/**
 * delete given property names from in fragment, and return request content directly
 */
export class DeletePropertyPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _propertyNames: Array<string>;

	public constructor(options: DeletePropertyPipelineStepOptions) {
		super(options);
		this._propertyNames = (Array.isArray(options.propertyNames) ? options.propertyNames : [options.propertyNames])
			.filter(name => name != null && name.trim().length !== 0);
	}

	public getPropertyNames(): Array<string> {
		return this._propertyNames;
	}

	protected async doPerform(data: InFragment, request: PipelineStepData<In>): Promise<OutFragment> {
		if (data != null) {
			this.getPropertyNames().forEach(name => {
				delete data[name];
			});
		}
		return request.content as unknown as OutFragment;
	}
}