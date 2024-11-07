import {PipelineBuilder, PipelineCode, PipelineType} from '@rainbow-o23/n1';
import {BootstrapOptions} from '../bootstrap-options';

export interface DynamicModule {
	registerMyself(bootstrap: BootstrapOptions): void;
}

export type DynamicModuleVisitPermit = string;
export type DynamicModuleAuthorization = 'anonymous' | 'authenticated' | DynamicModuleVisitPermit;

export interface DynamicModuleFileValidator {
	maxSize?: string | number;
	mimeType?: string;
}

export interface DynamicModuleNonameOrNamedFiles extends DynamicModuleFileValidator {
	/** noname means any file */
	name?: string;
	/** multiple is ignored when noname declared */
	multiple?: boolean;
}

export type DynamicModuleNamedFile = string | { name: string; maxCount?: number; };

export type DynamicModuleMultipleNamedFiles = { names: Array<DynamicModuleNamedFile> } & DynamicModuleFileValidator;

export interface DynamicModulePipeline {
	code: PipelineCode;
	def: PipelineType | PipelineBuilder;
	authorizations?: DynamicModuleAuthorization | Array<DynamicModuleAuthorization>;
	route?: string;
	method: 'get' | 'post' | 'patch' | 'delete' | 'put';
	headers?: Array<string> | true;
	pathParams?: Array<string> | true;
	queryParams?: Array<string> | true;
	body?: boolean;
	files?: boolean     // any files
		// single or multiple files with single name
		| string
		// with single name, explicitly declared it is single or multiple. default multiple is false
		| DynamicModuleNonameOrNamedFiles
		// multiple files with multiple names
		| Array<DynamicModuleNamedFile>
		| DynamicModuleMultipleNamedFiles;
	exposeHeaders?: Record<string, string>;
	exposeFile?: boolean;
}

export interface ScheduledModulePipeline {
	code: PipelineCode;
	def: PipelineType | PipelineBuilder;
	schedule: string;
}

export interface DynamicModuleOptions {
	moduleName: string;
	pipelines?: Array<DynamicModulePipeline>;
}

// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
export type ParameterDecoratorDelegate = (target: Object, key: string | symbol | undefined) => void;

export enum ParameterType {
	BODY = 'body', FILE = 'file', HEADER = 'header', PATH = 'path', QUERY = 'query',
	RESPONSE = 'response', REQUEST = 'request'
}

export interface ParameterDecoratorDelegateDef {
	delegate: ParameterDecoratorDelegate;
	index: number;
	type: ParameterType;
	name: string;
}
