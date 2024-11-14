import {PipelineStepData, PipelineStepOptions} from '@rainbow-o23/n1';
import {
	TypeOrmLoadBasis,
	TypeOrmLoadManyBySQLUseCursorPipelineStep,
	TypeOrmLoadManyBySQLUseCursorPipelineStepOptions,
	TypeOrmPipelineStepOptions
} from '@rainbow-o23/n3';

export abstract class LoopDataIterator {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public abstract forEachItem(apply: (item: any, index: number) => Promise<void>): Promise<void>;
}

export class StaticLoopDataIterator extends LoopDataIterator {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public constructor(private items: Array<any>) {
		super();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async forEachItem(apply: (item: any, index: number) => Promise<void>): Promise<void> {
		await this.items.reduce(async (previous, item, index) => {
			await previous;
			return await apply(item, index);
		}, Promise.resolve());
	}
}

export interface TypeOrmDataIteratorOptions extends Pick<PipelineStepOptions, 'config' | 'logger'> {
	name: string;
	dataSourceName: TypeOrmPipelineStepOptions['dataSourceName'];
	transactionName?: TypeOrmPipelineStepOptions['transactionName'];
	autonomous?: TypeOrmPipelineStepOptions['autonomous'];
	sql: TypeOrmLoadBasis['sql'],
	fetchSize?: TypeOrmLoadManyBySQLUseCursorPipelineStepOptions['fetchSize']
	// variables binding of given sql
	params?: TypeOrmLoadBasis['params'],
	// context to execute, find datasource by context, it is mandatory
	$context: PipelineStepData['$context'];
}

export class TypeOrmDataIterator extends LoopDataIterator {
	public constructor(private options: TypeOrmDataIteratorOptions) {
		super();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async forEachItem(apply: (item: any, index: number) => Promise<void>): Promise<void> {
		const {params, $context, ...rest} = this.options;
		let index = 0;
		const step = new TypeOrmLoadManyBySQLUseCursorPipelineStep({
			...rest,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			streamTo: async ($factor: Array<any>): Promise<void> => {
				await $factor.reduce(async (previous, item, itemIndex) => {
					await previous;
					return await apply(item, index + itemIndex);
				}, Promise.resolve());
				index = index + $factor.length;
				// release memory, no return
			}
		});
		await step.perform({content: {params} as TypeOrmLoadBasis, $context: $context});
	}
}
