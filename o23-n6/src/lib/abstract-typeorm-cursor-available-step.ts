import {PipelineStepHelpers, PipelineStepPayload} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from '@rainbow-o23/n3';
import {
	LoopDataIterator,
	StaticLoopDataIterator,
	TypeOrmDataIterator,
	TypeOrmDataIteratorOptions
} from './loop-data-iterator';

export type EnhancedPipelineStepHelpers = PipelineStepHelpers & {
	$createTypeOrmIterator: (options: Omit<TypeOrmDataIteratorOptions, 'name'>) => Promise<TypeOrmDataIterator>;
}

export abstract class AbstractTypeormCursorAvailableStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	protected _$enhancedHelpers: EnhancedPipelineStepHelpers;

	protected constructor(options: FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
	}

	public getHelpers(): EnhancedPipelineStepHelpers {
		if (this._$enhancedHelpers != null) {
			return this._$enhancedHelpers;
		}
		const helpers = super.getHelpers();
		this._$enhancedHelpers = {
			...helpers,
			$createTypeOrmIterator: async (options: Omit<TypeOrmDataIteratorOptions, 'name'>): Promise<TypeOrmDataIterator> => {
				const name = `${this.getName() ?? ''}/TypeOrmDataIterator`;
				return new TypeOrmDataIterator({...options, name});
			}
		};
		return this._$enhancedHelpers;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected createIterator(data: any): LoopDataIterator {
		let iterator: LoopDataIterator;
		if (data == null) {
			iterator = new StaticLoopDataIterator([]);
		} else if (Array.isArray(data)) {
			iterator = new StaticLoopDataIterator(data);
		} else if (data instanceof LoopDataIterator) {
			iterator = data;
		} else {
			iterator = new StaticLoopDataIterator([data]);
		}
		return iterator;
	}
}