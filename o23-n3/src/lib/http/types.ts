import {PipelineStepData, PipelineStepHelpers, Undefinable} from '@rainbow-o23/n1';
import {Response} from 'node-fetch';

export type HttpGenerateUrl<In, InFragment> = ($endpointUrl: string, $factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<string>;
export type HttpGenerateHeaders<In, InFragment> = ($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<Undefinable<Record<string, string>>>;
export type HttpGenerateBody<In, InFragment, BodyData> = ($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<BodyData>;
export type HttpGenerateResponse<In, InFragment, OutFragment> = ($response: Response, $factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment>;

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

export interface HttpErrorHandleOptions<In, InFragment, E extends Error = Error> {
	$errorCode: HttpErrorCode;
	$error?: E;
	$url: string;
	$response?: Response;
	$factor: InFragment;
	$request: PipelineStepData<In>;
}

export type HttpHandleError<In, InFragment, OutFragment, E extends Error = Error> = ($options: HttpErrorHandleOptions<In, InFragment, E>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment> | never;