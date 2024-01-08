import {Module} from '@nestjs/common';
import {DefaultPipelineBuilder, PipelineRepository} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {SingleEntityController} from './single-entity-controller';
import {LoadSingleEntityPipeline} from './single-entity-pipeline';

@Module({controllers: [SingleEntityController]})
export class SingleEntityModule {
	public static registerMyself(bootstrap: BootstrapOptions) {
		// add module, handle by controller
		bootstrap.addModule(SingleEntityModule);
		// add pipeline, handle by standard pipeline controller
		PipelineRepository.putPipeline({
			'LoadSingleEntityPipeline': new DefaultPipelineBuilder(LoadSingleEntityPipeline)
		});
	}
}
