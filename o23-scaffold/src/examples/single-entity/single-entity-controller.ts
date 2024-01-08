import {Body, Controller, Post} from '@nestjs/common';
import {PartialBy} from '@rainbow-o23/n1';
import {AbstractController} from '@rainbow-o23/n2';
import {TypeOrmDataSourceHelper} from '@rainbow-o23/n3';
import {SingleEntity} from './single-entity-model';
import {LoadSingleEntityPipeline, SaveSingleEntityPipeline} from './single-entity-pipeline';

export interface LoadSingleEntityRequest {
	id: bigint;
}

export interface SingleEntityResponse {
	entity?: SingleEntity;
}

export interface SaveSingleEntityRequest {
	entity: PartialBy<SingleEntity, 'id'>;
}

@Controller('/examples/single-entity')
export class SingleEntityController extends AbstractController {
	private _initialized: boolean = false;

	protected isInitialized(): boolean {
		return this._initialized;
	}

	protected async initialize() {
		if (this.isInitialized()) {
			return;
		}
		// setup in-memory database
		process.env.CFG_TYPEORM_SINGLEENTITYDS_TYPE = 'better-sqlite3';
		process.env.CFG_TYPEORM_SINGLEENTITYDS_SYNCHRONIZE = 'true';
		await new TypeOrmDataSourceHelper(this.getConfig()).create({
			'SingleEntityDS': [SingleEntity]
		});
		this._initialized = true;
	}

	@Post('/load')
	public async load(@Body() request: LoadSingleEntityRequest): Promise<SingleEntityResponse> {
		await this.initialize();
		const {payload} = await new LoadSingleEntityPipeline(this.buildPipelineOptions()).perform({payload: request.id});
		return {entity: payload};
	}

	@Post('/save')
	public async save(@Body() request: SaveSingleEntityRequest): Promise<SingleEntityResponse> {
		await this.initialize();
		const {payload} = await new SaveSingleEntityPipeline(this.buildPipelineOptions()).perform({payload: request.entity});
		return {entity: payload};
	}
}
