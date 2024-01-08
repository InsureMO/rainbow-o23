import {Body, Controller, Post} from '@nestjs/common';
import {ERR_PIPELINE_NOT_FOUND, PipelineRepository, UncatchableError} from '@rainbow-o23/n1';
import {AbstractController} from './abstract-controller';
import {handleException} from './exception-handling';

export interface PipelineTrigger<C> {
	code: string;
	payload: C;
}

@Controller('/pipeline')
export class PipelineController extends AbstractController {
	/**
	 * this api is for trigger pipeline, which appointed by given code, and starts with given criteria.
	 * only json could be handled by this api.
	 */
	@Post()
	public async invoke<C, O>(@Body() request: PipelineTrigger<C>): Promise<O> {
		const pipeline = await PipelineRepository.findPipeline(request.code, this.buildPipelineOptions());
		if (pipeline == null) {
			handleException(this.getLogger(),
				new UncatchableError(ERR_PIPELINE_NOT_FOUND, `Pipeline[code=${request.code}] not found.`),
				PipelineController.name);
		} else {
			try {
				const result = await pipeline.perform({
					payload: request.payload
				});
				return result.payload as O;
			} catch (e) {
				handleException(this.getLogger(), e, PipelineController.name);
			}
		}
	}
}
