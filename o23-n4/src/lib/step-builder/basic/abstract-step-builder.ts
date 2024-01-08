import {PipelineStep, PipelineStepBuilder, PipelineStepOptions, PipelineStepType} from '@rainbow-o23/n1';

export type PipelineStepBuilderOptions = Omit<PipelineStepOptions, 'config' | 'logger'>;

export abstract class AbstractPipelineStepBuilder<GivenOptions extends PipelineStepBuilderOptions, TransformedOptions extends PipelineStepOptions, S extends PipelineStep>
	implements PipelineStepBuilder {
	private readonly _options: TransformedOptions;
	private _singletonStepInstance: S;

	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	public constructor(options: GivenOptions) {
		this._options = this.readMoreOptions(options, {name: options.name} as TransformedOptions);
	}

	protected abstract readMoreOptions(given: GivenOptions, transformed: TransformedOptions): TransformedOptions;

	public getOptions(): TransformedOptions {
		return this._options;
	}

	protected abstract getStepType(): PipelineStepType<S>;

	/**
	 * default step instance can be used on singleton mode,
	 * overwrite this method and returns true if it is not.
	 */
	protected useSingletonStepInstance(): boolean {
		return true;
	}

	public async create(options?: Omit<TransformedOptions, 'name'>): Promise<S> {
		if (this.useSingletonStepInstance() && this._singletonStepInstance != null) {
			return this._singletonStepInstance;
		}

		const StepClass = this.getStepType();
		const stepInstance = new StepClass({...options, ...this.getOptions()}) as S;
		if (this.useSingletonStepInstance()) {
			this._singletonStepInstance = stepInstance;
		}
		return stepInstance;
	}
}
