import {Undefinable} from '@rainbow-o23/n1';
import {
	AsyncPipelineStepSetsBuilder,
	ConditionalPipelineStepSetsBuilder,
	DeletePropertyPipelineStepBuilder,
	EachPipelineStepSetsBuilder,
	GetPropertyPipelineStepBuilder,
	PipelineStepSetsBuilder,
	RefPipelinePipelineStepBuilder,
	RefStepPipelineStepBuilder,
	RoutesPipelineStepSetsBuilder,
	SnippetPipelineStepBuilder,
	SnowflakePipelineStepBuilder
} from './basic';
import {FetchPipelineStepBuilder} from './http';
import {
	TypeOrmBulkSaveBySQLPipelineStepBuilder,
	TypeOrmBySnippetPipelineStepBuilder,
	TypeOrmLoadEntityByIdPipelineStepBuilder,
	TypeOrmLoadManyBySQLPipelineStepBuilder,
	TypeOrmLoadOneBySQLPipelineStepBuilder,
	TypeOrmSaveBySQLPipelineStepBuilder,
	TypeOrmSaveEntityPipelineStepBuilder,
	TypeOrmTransactionalPipelineStepSetsBuilder
} from './typeorm';
import {PipelineStepBuilderType, PipelineStepRegisterKey} from './types';

export class StepBuilders {
	private static readonly BUILDERS: Record<PipelineStepRegisterKey, PipelineStepBuilderType> = {};

	private constructor() {
		// avoid extend
	}

	public static register(key: PipelineStepRegisterKey, builderType: PipelineStepBuilderType): Undefinable<PipelineStepBuilderType> {
		key = (key ?? '').trim().toLowerCase();
		const existing = StepBuilders.BUILDERS[key];
		StepBuilders.BUILDERS[key] = builderType;
		return existing;
	}

	public static find(key: PipelineStepRegisterKey): Undefinable<PipelineStepBuilderType> {
		return StepBuilders.BUILDERS[(key ?? '').trim().toLowerCase()];
	}
}

export enum DefaultSteps {
	SNIPPET = 'snippet',
	SNOWFLAKE = 'snowflake',
	GET_PROPERTY = 'get-property',
	DEL_PROPERTY = 'del-property',
	DELETE_PROPERTIES = 'del-properties',

	SETS = 'sets',
	ASYNC_SETS = 'async-sets',
	EACH_SETS = 'each',
	CONDITIONAL_SETS = 'conditional',
	ROUTES_SETS = 'routes',

	TYPEORM_BY_SNIPPET = 'typeorm-snippet',
	TYPEORM_LOAD_ENTITY_BY_ID = 'typeorm-load-entity',
	TYPEORM_SAVE_ENTITY = 'typeorm-save-entity',
	TYPEORM_LOAD_ONE_BY_SQL = 'typeorm-load-one',
	TYPEORM_LOAD_MANY_BY_SQL = 'typeorm-load-many',
	TYPEORM_SAVE_BY_SQL = 'typeorm-save',
	TYPEORM_BULK_SAVE_BY_SQL = 'typeorm-bulk-save',
	TYPEORM_TRANSACTIONAL = 'typeorm-transactional',

	HTTP_FETCH = 'http-fetch',

	REF_PIPELINE = 'ref-pipeline',
	REF_STEP = 'ref-step'
}

export const registerDefaults = () => {
	StepBuilders.register(DefaultSteps.SNIPPET, SnippetPipelineStepBuilder);
	StepBuilders.register(DefaultSteps.SNOWFLAKE, SnowflakePipelineStepBuilder);
	StepBuilders.register(DefaultSteps.GET_PROPERTY, GetPropertyPipelineStepBuilder);
	StepBuilders.register(DefaultSteps.DEL_PROPERTY, DeletePropertyPipelineStepBuilder);
	StepBuilders.register(DefaultSteps.DELETE_PROPERTIES, DeletePropertyPipelineStepBuilder);

	StepBuilders.register(DefaultSteps.SETS, PipelineStepSetsBuilder);
	StepBuilders.register(DefaultSteps.ASYNC_SETS, AsyncPipelineStepSetsBuilder);
	StepBuilders.register(DefaultSteps.EACH_SETS, EachPipelineStepSetsBuilder);
	StepBuilders.register(DefaultSteps.CONDITIONAL_SETS, ConditionalPipelineStepSetsBuilder);
	StepBuilders.register(DefaultSteps.ROUTES_SETS, RoutesPipelineStepSetsBuilder);

	StepBuilders.register(DefaultSteps.TYPEORM_BY_SNIPPET, TypeOrmBySnippetPipelineStepBuilder);
	StepBuilders.register(DefaultSteps.TYPEORM_LOAD_ENTITY_BY_ID, TypeOrmLoadEntityByIdPipelineStepBuilder);
	StepBuilders.register(DefaultSteps.TYPEORM_SAVE_ENTITY, TypeOrmSaveEntityPipelineStepBuilder);
	StepBuilders.register(DefaultSteps.TYPEORM_LOAD_ONE_BY_SQL, TypeOrmLoadOneBySQLPipelineStepBuilder);
	StepBuilders.register(DefaultSteps.TYPEORM_LOAD_MANY_BY_SQL, TypeOrmLoadManyBySQLPipelineStepBuilder);
	StepBuilders.register(DefaultSteps.TYPEORM_SAVE_BY_SQL, TypeOrmSaveBySQLPipelineStepBuilder);
	StepBuilders.register(DefaultSteps.TYPEORM_BULK_SAVE_BY_SQL, TypeOrmBulkSaveBySQLPipelineStepBuilder);
	StepBuilders.register(DefaultSteps.TYPEORM_TRANSACTIONAL, TypeOrmTransactionalPipelineStepSetsBuilder);

	StepBuilders.register(DefaultSteps.HTTP_FETCH, FetchPipelineStepBuilder);

	StepBuilders.register(DefaultSteps.REF_PIPELINE, RefPipelinePipelineStepBuilder);
	StepBuilders.register(DefaultSteps.REF_STEP, RefStepPipelineStepBuilder);
};
