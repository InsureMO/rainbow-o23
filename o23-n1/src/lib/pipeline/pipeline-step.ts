import {Config, Logger} from '../utils';
import {PipelineExecutionContext} from './pipeline';
import {AbstractPipelineExecution, PipelineExecutionOptions} from './pipeline-execution';
import {createStepHelpers, PipelineStepHelpers} from './step-helpers';

export type PipelineStepCode = string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PipelineStepPayload = any;

export interface PipelineStepData<C = PipelineStepPayload, CTX = PipelineExecutionContext> {
	/** this is runtime context */
	$context?: CTX;
	content: C;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PipelineStep<In = any, Out = any> {
	getName(): string;

	perform(request: PipelineStepData<In>): Promise<PipelineStepData<Out>>;
}

export interface PipelineStepOptions extends PipelineExecutionOptions {
	name?: string;
	config?: Config;
	logger?: Logger;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export interface PipelineStepType<S = PipelineStep> extends Function {
	new(options?: PipelineStepOptions): S;
}

export abstract class AbstractPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload>
	extends AbstractPipelineExecution implements PipelineStep<In, Out> {
	private _$helpers: PipelineStepHelpers;
	protected readonly _name?: string;

	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	public constructor(options?: PipelineStepOptions) {
		super(options);
		this._name = options?.name;
	}

	public getName(): string {
		return (this._name == null || this._name.trim().length === 0) ? this.constructor.name : this._name;
	}

	public getHelpers(): PipelineStepHelpers {
		if (this._$helpers == null) {
			this._$helpers = createStepHelpers(this.getConfig(), this.getLogger());
		}
		return this._$helpers;
	}

	protected getHelpersVariableNames(): Array<string> {
		return ['$helpers', '$'];
	}

	public abstract perform(request: PipelineStepData<In>): Promise<PipelineStepData<Out>>;
}

export interface PipelineStepBuilder {
	create(options?: PipelineStepOptions): Promise<PipelineStep>;
}

export class DefaultPipelineStepBuilder implements PipelineStepBuilder {
	public constructor(protected readonly step: PipelineStepType) {
	}

	public async create(options?: PipelineStepOptions): Promise<PipelineStep> {
		return new this.step(options);
	}
}

