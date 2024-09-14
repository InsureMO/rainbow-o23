import {PipelineStepData, PipelineStepHelpers, Undefinable} from '@rainbow-o23/n1';
import {Response} from 'node-fetch';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HttpGenerateUrl<In, InFragment> = ($endpointUrl: string, $factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HttpGenerateHeaders<In, InFragment> = ($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<Undefinable<Record<string, string>>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HttpGenerateBody<In, InFragment> = ($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HttpGenerateResponse<In, InFragment> = ($response: Response, $factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<any>;

export type HttpUnpredictedErrorCode = `0${number}`;
export const HttpUnknownErrorCode: HttpUnpredictedErrorCode = '000';
export type HttpClientErrorCode = `4${number}`;
export type HttpServerErrorCode = `5${number}`;
export type HttpCustomizedErrorCode = `6${number}`;
export const HttpAbortErrorCode: HttpCustomizedErrorCode = '600';
export type HttpErrorCode =
	HttpUnpredictedErrorCode
	| HttpClientErrorCode
	| HttpServerErrorCode
	| HttpCustomizedErrorCode;

export interface HttpErrorHandleOptions<In, InFragment> {
	$errorCode: HttpErrorCode;
	$url: string;
	$response?: Response;
	$factor: InFragment;
	$request: PipelineStepData<In>;
}

export type HttpHandleError<In, InFragment, OutFragment> = ($options: HttpErrorHandleOptions<In, InFragment>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment> | never;