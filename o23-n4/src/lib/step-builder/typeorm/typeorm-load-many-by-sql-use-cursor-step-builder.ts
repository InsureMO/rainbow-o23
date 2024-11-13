import {PipelineStepType} from '@rainbow-o23/n1';
import {
	TypeOrmLoadManyBySQLUseCursorPipelineStep,
	TypeOrmLoadManyBySQLUseCursorPipelineStepOptions
} from '@rainbow-o23/n3';
import {PipelineStepDef, PipelineStepSetsDef} from '../../reader';
import {redressSnippet} from '../utils';
import {
	AbstractTypeOrmBySQLPipelineStepBuilder,
	TypeOrmBySQLPipelineStepBuilderOptions
} from './abstract-typeorm-by-sql-step-builder';

export type TypeOrmLoadManyBySQLUseCursorPipelineStepBuilderOptions = TypeOrmBySQLPipelineStepBuilderOptions & {
	fetchSize?: TypeOrmLoadManyBySQLUseCursorPipelineStepOptions['fetchSize'];
	streamTo?: TypeOrmLoadManyBySQLUseCursorPipelineStepOptions['streamTo'];
	steps?: Array<PipelineStepDef | PipelineStepSetsDef>;
}

export class TypeOrmLoadManyBySQLUseCursorPipelineStepBuilder
	extends AbstractTypeOrmBySQLPipelineStepBuilder<TypeOrmLoadManyBySQLUseCursorPipelineStep> {
	protected getStepType(): PipelineStepType<TypeOrmLoadManyBySQLUseCursorPipelineStep> {
		return TypeOrmLoadManyBySQLUseCursorPipelineStep;
	}

	protected readMoreOptions(given: TypeOrmLoadManyBySQLUseCursorPipelineStepBuilderOptions, transformed: TypeOrmLoadManyBySQLUseCursorPipelineStepOptions): TypeOrmLoadManyBySQLUseCursorPipelineStepOptions {
		transformed = super.readMoreOptions(given, transformed);
		transformed.fetchSize = given.fetchSize;
		transformed.streamTo = redressSnippet(given.streamTo);
		transformed.steps = (given.steps || []).map(step => {
			const def = this.readSubStep(step);
			return def.def;
		});
		if (transformed.steps.length === 0) {
			delete transformed.steps;
		}
		return transformed;
	}
}
