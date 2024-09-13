import {PipelineStepData, PipelineStepPayload, UncatchableError} from '@rainbow-o23/n1';
import {ERR_EACH_FRAGMENT_NOT_ANY_ARRAY} from '../error-codes';
import {PipelineStepSets, PipelineStepSetsOptions} from './step-sets';

export interface EachPipelineStepSetsOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends PipelineStepSetsOptions<In, Out, InFragment, OutFragment> {
	originalContentName?: string;
	itemName?: string;
}

/**ß
 * pipeline steps to execute internal step conditional
 */
export class EachPipelineStepSets<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends PipelineStepSets<In, Out, InFragment, OutFragment> {
	private readonly _originalContentPropertyName: string;
	private readonly _itemPropertyName: string;

	public constructor(options: EachPipelineStepSetsOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		this._originalContentPropertyName = options.originalContentName || '$content';
		if (this._originalContentPropertyName.trim().length === 0) {
			this._originalContentPropertyName = '$content';
		}
		this._itemPropertyName = options.itemName || '$item';
		if (this._itemPropertyName.trim().length === 0) {
			this._itemPropertyName = '$item';
		}
	}

	protected getOriginalContentPropertyName(): string {
		return this._originalContentPropertyName;
	}

	/**
	 * override this method when want to use another variable name rather than "$item"
	 */
	protected getItemPropertyName(): string {
		return this._itemPropertyName;
	}

	public async perform(request: PipelineStepData<In>): Promise<PipelineStepData<Out>> {
		return await this.performAndCatch(request, async (fragment) => {
			if (fragment == null) {
				// simply pass request as response
				return request as unknown as PipelineStepData<Out>;
			}
			if (!Array.isArray(fragment)) {
				// noinspection ExceptionCaughtLocallyJS
				throw new UncatchableError(ERR_EACH_FRAGMENT_NOT_ANY_ARRAY, `Given in fragment[${JSON.stringify(fragment)}] is not an array, cannot be performed in for each step.`);
			}
			if (fragment.length === 0) {
				// simply pass request as response
				return request as unknown as PipelineStepData<Out>;
			}
			// should create request for each item
			const $context = request.$context;
			const content = request.content;
			const semaphore = Symbol();
			// sequential
			const results = [];
			for (const item of fragment) {
				// build item content
				const itemContent = {
					[this.getOriginalContentPropertyName()]: content,
					[this.getItemPropertyName()]: item,
					$semaphore: semaphore
				};
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const result = await this.doPerform(itemContent as any, {content: itemContent as any, $context});
				if (result === semaphore) {
					break;
				}
				results.push(result);
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return await this.setToOutput(results as any, request);
		});
	}
}
