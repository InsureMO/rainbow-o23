import {Module} from '@nestjs/common';
import {DefaultPipelineBuilder, PipelineRepository} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {SimpleController} from './simple-controller';
import {SimplePipeline} from './simple-pipeline';

@Module({controllers: [SimpleController]})
export class SimpleModule {
	public static registerMyself(bootstrap: BootstrapOptions) {
		// add module, handle by controller
		bootstrap.addModule(SimpleModule);
		// add pipeline, handle by standard pipeline controller
		PipelineRepository.putPipeline({'SimplePipeline': new DefaultPipelineBuilder(SimplePipeline)});
	}
}
