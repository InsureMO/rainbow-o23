import {Body, Controller, Post} from '@nestjs/common';
import {PipelineExecutionContext} from '@rainbow-o23/n1';
import {AbstractController} from '@rainbow-o23/n2';
import {SimplePipeline} from './simple-pipeline';

export interface SimpleRequest {
	payload: number;
}

@Controller('/examples/simple')
export class SimpleController extends AbstractController {
	@Post('/test')
	public async invoke(@Body() request: SimpleRequest): Promise<number> {
		const {payload} = await new SimplePipeline(this.buildPipelineOptions()).perform({
			payload: request.payload,
			$context: new PipelineExecutionContext()
		});
		return payload;
	}
}
