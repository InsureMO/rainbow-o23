import {PipelineBuilder, PipelineCode, PipelineStepBuilder, PipelineStepCode} from '@rainbow-o23/n1';
import {DynamicModulePipeline} from '@rainbow-o23/n2';
import {PipelineStepRegisterKey} from '../step-builder';

export type DefType = 'pipeline' | 'step-sets' | 'step';

export interface Def {
	type: DefType;
}

export interface PipelineStepDef extends Def {
	// only works when step is defined standalone
	code?: PipelineStepCode;
	name: string;
	type: 'step';
	use: PipelineStepRegisterKey;
}

export interface PipelineStepSetsDef extends Def {
	// only works when step is defined standalone
	code?: PipelineStepCode;
	name: string;
	type: 'step-sets';
	use: PipelineStepRegisterKey;
}

export interface PipelineDef extends Def {
	code: PipelineCode;
	type: 'pipeline';
	steps: Array<PipelineStepDef | PipelineStepSetsDef>;
}

export interface ExposedPipelineDef extends PipelineDef {
	authorizations?: DynamicModulePipeline['authorizations'];
	route: DynamicModulePipeline['route'];
	method: DynamicModulePipeline['method'];
	headers?: DynamicModulePipeline['headers'];
	pathParams?: DynamicModulePipeline['pathParams'];
	queryParams?: DynamicModulePipeline['queryParams'];
	body?: DynamicModulePipeline['body'];
	files?: DynamicModulePipeline['files'];
	exposeHeaders?: DynamicModulePipeline['exposeHeaders'];
	exposeFile?: DynamicModulePipeline['exposeFile'];
}

export interface ParsedDef {
	code: PipelineCode | PipelineStepCode;
	type: DefType;
	/** default is true */
	enabled?: boolean;
}

export interface ParsedPipelineDef extends ParsedDef {
	code: PipelineCode;
	type: 'pipeline';
	def: PipelineBuilder;
}

export interface ExposedParsedPipelineDef extends ParsedPipelineDef, ExposedPipelineDef {
}

export interface ParsedPipelineStepDef extends ParsedDef {
	code: PipelineStepCode;
	type: 'step-sets' | 'step';
	def: PipelineStepBuilder;
}
