import {PipelineStepData, PipelineStepHelpers, PipelineStepPayload, UncatchableError} from '@rainbow-o23/n1';
import fetch, {Response} from 'node-fetch';
import {ERR_FETCH_ERROR} from '../error-codes';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions, ScriptFuncOrBody, Utils} from '../step';
import {
	HttpAbortErrorCode,
	HttpErrorCode,
	HttpErrorHandleOptions,
	HttpGenerateBody,
	HttpGenerateHeaders,
	HttpGenerateResponse,
	HttpGenerateUrl,
	HttpHandleError,
	HttpUnknownErrorCode
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FetchPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out, BodyData = any>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	endpointSystemCode: string;
	endpointName: string;
	urlGenerate?: ScriptFuncOrBody<HttpGenerateUrl<In, InFragment>>;
	method?: string;
	/** on seconds */
	timeout?: number;
	transparentHeaderNames?: Array<string>;
	omittedTransparentHeaderNames?: Array<string>;
	headersGenerate?: ScriptFuncOrBody<HttpGenerateHeaders<In, InFragment>>;
	bodyUsed?: boolean;
	bodyGenerate?: ScriptFuncOrBody<HttpGenerateBody<In, InFragment, BodyData>>;
	responseGenerate?: ScriptFuncOrBody<HttpGenerateResponse<In, InFragment, OutFragment>>;
	responseErrorHandles?: ScriptFuncOrBody<HttpHandleError<In, InFragment, OutFragment>>
		| { [key: HttpErrorCode]: ScriptFuncOrBody<HttpHandleError<In, InFragment, OutFragment>>; };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FetchPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out, BodyData = any>
	extends AbstractFragmentaryPipelineStep<In, Out, InFragment, OutFragment> {
	private readonly _endpointSystemCode: string;
	private readonly _endpointName: string;
	private readonly _endpointKey: string;
	private readonly _endpointUrl: string;
	private readonly _endpointMethod: string;
	private readonly _endpointHeaders: Record<string, string>;
	private readonly _endpointTimeout: number;
	private readonly _urlGenerateSnippet: ScriptFuncOrBody<HttpGenerateUrl<In, InFragment>>;
	private readonly _urlGenerateFunc: HttpGenerateUrl<In, InFragment>;
	private readonly _transparentHeaderNames: Array<string>;
	private readonly _omittedTransparentHeaderNames: Array<string>;
	private readonly _headersGenerateSnippet: ScriptFuncOrBody<HttpGenerateHeaders<In, InFragment>>;
	private readonly _headersGenerateFunc: HttpGenerateHeaders<In, InFragment>;
	private readonly _endpointTraceIdHeaderName?: string;
	private readonly _endpointTraceIdScope?: 'system' | 'endpoint';
	private readonly _bodyUsed: boolean;
	private readonly _bodyGenerateSnippet: ScriptFuncOrBody<HttpGenerateBody<In, InFragment, BodyData>>;
	private readonly _bodyGenerateFunc: HttpGenerateBody<In, InFragment, BodyData>;
	private readonly _responseGenerateSnippet: ScriptFuncOrBody<HttpGenerateResponse<In, InFragment, OutFragment>>;
	private readonly _responseGenerateFunc: HttpGenerateResponse<In, InFragment, OutFragment>;
	private readonly _responseErrorHandleFunc: HttpHandleError<In, InFragment, OutFragment>;

	public constructor(options: FetchPipelineStepOptions<In, Out, InFragment, OutFragment>) {
		super(options);
		const config = this.getConfig();
		this._endpointSystemCode = options.endpointSystemCode;
		this._endpointName = options.endpointName;
		this._endpointKey = `${this._endpointSystemCode}.${this._endpointName}`;
		this._endpointUrl = config.getString(`endpoints.${this._endpointKey}.url`);
		this._endpointMethod = (options.method ?? 'POST').trim().toLowerCase();
		this._endpointHeaders = this.generateEndpointHeaders(
			config.getString(`endpoints.${this._endpointKey}.headers`),
			this.generateEndpointHeaders(config.getString(`endpoints.${this._endpointSystemCode}.global.headers`)));
		// in second
		this._endpointTimeout = options.timeout
			?? config.getNumber(`endpoints.${this._endpointKey}.timeout`)
			?? config.getNumber(`endpoints.${this._endpointSystemCode}.global.timeout`, -1);
		// to millisecond
		this._endpointTimeout = this._endpointTimeout > 0 ? this._endpointTimeout * 1000 : -1;
		this._urlGenerateSnippet = options.urlGenerate;
		this._urlGenerateFunc = Utils.createAsyncFunction(this.getUrlGenerateSnippet(), {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			createDefault: () => async ($endpointUrl: string, _$factor: InFragment, _$request: PipelineStepData<In>, _$helpers: PipelineStepHelpers, _$: PipelineStepHelpers) => $endpointUrl,
			getVariableNames: () => this.getUrlGenerateVariableName(),
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for url generate, snippet is [${this.getUrlGenerateSnippet()}].`);
				throw e;
			}
		});
		this._transparentHeaderNames = options.transparentHeaderNames
			?? this.generateTransparentHeaderNames(
				config.getString(`endpoints.${this._endpointKey}.headers.transparent`),
				this.generateTransparentHeaderNames(config.getString(`endpoints.${this._endpointSystemCode}.global.headers.transparent`)));
		this._omittedTransparentHeaderNames = options.omittedTransparentHeaderNames
			?? this.generateTransparentHeaderNames(
				config.getString(`endpoints.${this._endpointKey}.headers.transparent.omitted`),
				this.generateTransparentHeaderNames(config.getString(`endpoints.${this._endpointSystemCode}.global.headers.transparent.omitted`)));
		this._headersGenerateSnippet = options.headersGenerate;
		this._headersGenerateFunc = Utils.createAsyncFunction(this.getHeadersGenerateSnippet(), {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			createDefault: () => async (_$factor: InFragment, _$request: PipelineStepData<In>, _$helpers: PipelineStepHelpers, _$: PipelineStepHelpers) => (void 0),
			getVariableNames: () => this.getHeadersGenerateVariableNames(),
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for request headers generate, snippet is [${this.getHeadersGenerateSnippet()}].`);
				throw e;
			}
		});
		let traceIdHeaderName = config.getString(`endpoints.${this._endpointKey}.trace.header.name`)?.trim();
		if (traceIdHeaderName != null) {
			this._endpointTraceIdHeaderName = traceIdHeaderName.toLowerCase();
			this._endpointTraceIdScope = 'endpoint';
		} else {
			traceIdHeaderName = config.getString(`endpoints.${this._endpointSystemCode}.global.trace.header.name`)?.trim();
			if (traceIdHeaderName != null) {
				this._endpointTraceIdHeaderName = traceIdHeaderName.toLowerCase();
				this._endpointTraceIdScope = 'system';
			} else {
				this._endpointTraceIdHeaderName = (void 0);
				this._endpointTraceIdScope = (void 0);
			}
		}
		this._bodyUsed = options.bodyUsed;
		this._bodyGenerateSnippet = options.bodyGenerate;
		this._bodyGenerateFunc = Utils.createAsyncFunction(this.getBodyGenerateSnippet(), {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			createDefault: () => async ($factor: InFragment, _$request: PipelineStepData<In>, _$helpers: PipelineStepHelpers, _$: PipelineStepHelpers) => {
				return (($factor == null || (typeof $factor === 'string' && $factor.length === 0)) ? (void 0) : JSON.stringify($factor)) as BodyData;
			},
			getVariableNames: () => this.getBodyGenerateVariableNames(),
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for request body generate, snippet is [${this.getBodyGenerateSnippet()}].`);
				throw e;
			}
		});
		this._responseGenerateSnippet = options.responseGenerate;
		this._responseGenerateFunc = Utils.createAsyncFunction(this.getResponseGenerateSnippet(), {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			createDefault: () => async ($response: Response, _$factor: InFragment, _$request: PipelineStepData<In>, $helpers: PipelineStepHelpers, _$: PipelineStepHelpers) => {
				const contentEncoding = $response.headers?.get('content-encoding');
				if (contentEncoding === 'zstd') {
					const buffer = await $response.buffer();
					return JSON.parse(await $helpers.$zstd(buffer));
				} else {
					return await $response.json();
				}
			},
			getVariableNames: () => this.getResponseGenerateVariableName(),
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for response generate, snippet is [${this.getResponseGenerateSnippet()}].`);
				throw e;
			}
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const defaultHandler = async (options: HttpErrorHandleOptions<In, InFragment>, _$helpers: PipelineStepHelpers, _$: PipelineStepHelpers): Promise<OutFragment> | never => {
			throw new UncatchableError(ERR_FETCH_ERROR, `Error[${options.$errorCode}] caught when fetch data from remote[${options.$url}].`);
		};
		const createDefaultHandler = () => defaultHandler;
		const getVariableNames = () => this.getErrorHandlerVariableName();
		if (typeof options.responseErrorHandles === 'string' || typeof options.responseErrorHandles === 'function') {
			this._responseErrorHandleFunc = Utils.createAsyncFunction(options.responseErrorHandles, {
				createDefault: createDefaultHandler, getVariableNames,
				error: (e: Error) => {
					this.getLogger().error(`Failed on create function for response error handler, snippet is [${options.responseErrorHandles}].`);
					throw e;
				}
			});
		} else if (options.responseErrorHandles != null) {
			const handlers: Record<HttpErrorCode, HttpHandleError<In, InFragment, OutFragment>> = Object.keys(options.responseErrorHandles).reduce((handlers, status) => {
				handlers[status] = Utils.createAsyncFunction(options.responseErrorHandles[status], {
					createDefault: createDefaultHandler, getVariableNames,
					error: (e: Error) => {
						this.getLogger().error(`Failed on create function for response error handler[${status}], snippet is [${options.responseErrorHandles[status]}].`);
						throw e;
					}
				});
				return handlers;
			}, {});
			this._responseErrorHandleFunc = async ($options: HttpErrorHandleOptions<In, InFragment>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers): Promise<OutFragment> | never => {
				const {$errorCode} = $options;
				const givenErrorHandler = handlers[$errorCode];
				if (givenErrorHandler == null) {
					return await defaultHandler($options, $helpers, $);
				} else {
					return await givenErrorHandler($options, $helpers, $);
				}
			};
		} else {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			this._responseErrorHandleFunc = async ($options: HttpErrorHandleOptions<In, InFragment>, _$helpers: PipelineStepHelpers, _$: PipelineStepHelpers): Promise<OutFragment> | never => {
				throw new UncatchableError(ERR_FETCH_ERROR, `Error[${$options.$errorCode}] caught when fetch data from remote[${$options.$url}].`);
			};
		}
	}

	public getEndpointSystemCode(): string {
		return this._endpointSystemCode;
	}

	public getEndpointName(): string {
		return this._endpointName;
	}

	public getEndpointKey(): string {
		return this._endpointKey;
	}

	public getEndpointUrl(): string {
		return this._endpointUrl;
	}

	public getEndpointMethod(): string {
		return this._endpointMethod;
	}

	public getEndpointHeaders(): Record<string, string> {
		return this._endpointHeaders;
	}

	protected generateEndpointHeaders(headers?: string, base?: Record<string, string>): Record<string, string> {
		return `${headers || ''}`.split(';')
			.map(x => x.trim())
			.filter(x => x.length !== 0)
			.map(x => x.split('='))
			.map(([key, value]) => [key.trim(), value])
			.filter(([key]) => key.length !== 0)
			.reduce((map, [key, value]) => {
				map[key] = value;
				return map;
			}, base ?? {});
	}

	public getEndpointTimeout(): number {
		return this._endpointTimeout;
	}

	public needTimeout(): boolean {
		return this._endpointTimeout > 0;
	}

	public getUrlGenerateSnippet(): ScriptFuncOrBody<HttpGenerateUrl<In, InFragment>> {
		return this._urlGenerateSnippet;
	}

	/**
	 * override this method when want to use another variable name rather than "$endpointUrl", "$factor", "$request"
	 */
	protected getUrlGenerateVariableName(): Array<string> {
		return ['$endpointUrl', '$factor', '$request', ...this.getHelpersVariableNames()];
	}

	public getTransparentHeaderNames(): Array<string> {
		return this._transparentHeaderNames ?? [];
	}

	public getOmittedTransparentHeaderNames(): Array<string> {
		return this._omittedTransparentHeaderNames ?? [];
	}

	protected generateTransparentHeaderNames(headerNames?: string, base?: Array<string>): Array<string> {
		return [
			...(base ?? []),
			...new Set(`${headerNames || ''}`.split(';')
				.map(x => x.trim())
				.filter(x => x.length !== 0))
		];
	}

	public getHeadersGenerateSnippet(): ScriptFuncOrBody<HttpGenerateHeaders<In, InFragment>> {
		return this._headersGenerateSnippet;
	}

	/**
	 * override this method when want to use another variable name rather than "$endpointUrl", "$factor", "$request"
	 */
	protected getHeadersGenerateVariableNames(): Array<string> {
		return ['$factor', '$request', ...this.getHelpersVariableNames()];
	}

	public getEndpointTraceIdHeaderName(): string | undefined {
		return this._endpointTraceIdHeaderName;
	}

	public getEndpointTraceIdScope(): 'system' | 'endpoint' | undefined {
		return this._endpointTraceIdScope;
	}

	protected isBodyUsed(): boolean | undefined {
		return this._bodyUsed;
	}

	public getBodyGenerateSnippet(): ScriptFuncOrBody<HttpGenerateBody<In, InFragment, BodyData>> {
		return this._bodyGenerateSnippet;
	}

	/**
	 * override this method when want to use another variable name rather than "$endpointUrl", "$factor", "$request"
	 */
	protected getBodyGenerateVariableNames(): Array<string> {
		return ['$factor', '$request', ...this.getHelpersVariableNames()];
	}

	public getResponseGenerateSnippet(): ScriptFuncOrBody<HttpGenerateResponse<In, InFragment, OutFragment>> {
		return this._responseGenerateSnippet;
	}

	protected getResponseGenerateVariableName(): Array<string> {
		return ['$response', '$factor', '$request', ...this.getHelpersVariableNames()];
	}

	protected getErrorHandlerVariableName(): Array<string> {
		return ['$options', ...this.getHelpersVariableNames()];
	}

	protected syncEndpointTraceId(headers: Record<string, string>, request: PipelineStepData<In>): string | undefined {
		const endpointTraceIdHeaderName = this.getEndpointTraceIdHeaderName();
		if (endpointTraceIdHeaderName == null) {
			return (void 0);
		}

		const headerName = Object.keys(headers).find(name => name.toLowerCase() === endpointTraceIdHeaderName);
		if (headerName != null) {
			return (void 0);
		}
		let endpointTraceId = headers[headerName];
		const endpointTraceIdScope = this.getEndpointTraceIdScope();

		if (endpointTraceId != null) {
			// trace id found in headers, put into context
			if (endpointTraceIdScope === 'system') {
				request.$context.setScopedTraceId(this.getEndpointSystemCode(), endpointTraceIdHeaderName, endpointTraceId);
			} else {
				request.$context.setScopedTraceId(this.getEndpointKey(), endpointTraceIdHeaderName, endpointTraceId);
			}
		} else {
			// trace if not in headers, find in context, and put into header if found
			if (endpointTraceIdScope === 'system') {
				endpointTraceId = request.$context.findScopedTraceId(this.getEndpointSystemCode())?.[1];
			} else {
				endpointTraceId = request.$context.findScopedTraceId(this.getEndpointKey())?.[1];
			}
			if (endpointTraceId != null) {
				headers[endpointTraceIdHeaderName] = endpointTraceId;
			}
		}

		return endpointTraceId;
	}

	protected async generateRequestHeaders(data: InFragment, request: PipelineStepData<In>, $helpers: PipelineStepHelpers): Promise<Record<string, string>> {
		const staticHeaders = this.getEndpointHeaders() ?? {};
		const transparentHeaders = (this.getTransparentHeaderNames() ?? []).reduce((headers, name) => {
			const value = Utils.getValue(data, name);
			if (value == null) {
				// no value of given header name, ignored
			} else if (Array.isArray(value)) {
				const headerValue = value.filter(v => v != null && `${v}`.length !== 0).join(', ');
				if (headerValue.length !== 0) {
					headers[name] = headerValue;
				}
			} else if (typeof value === 'object') {
				Object.keys(value).forEach(key => {
					const headerValue = value[key];
					if (headerValue != null) {
						const s = `${headerValue}`;
						if (s.length !== 0) {
							headers[key] = s;
						}
					}
				});
			} else {
				const headerValue = `${value}`;
				if (headerValue.length !== 0) {
					headers[name] = headerValue;
				}
			}
			return headers;
		}, {});
		(this.getOmittedTransparentHeaderNames() ?? []).forEach(name => delete transparentHeaders[name]);

		const generatedHeaders = await this._headersGenerateFunc(data, request, $helpers, $helpers) ?? {};
		const headers = {...staticHeaders, ...transparentHeaders, ...generatedHeaders};
		// remove some headers, leave them to fetch to calculate automatically.
		// and get trace id when existing
		Object.keys(headers).filter(name => {
			return ['content-encoding', 'content-length'].includes(name.toLowerCase());
		}).forEach(name => {
			delete headers[name];
		});

		return headers;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async generateRequestBody(method: string, data: InFragment, request: PipelineStepData<In>, $helpers: PipelineStepHelpers): Promise<any> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let body: any;
		const bodyUsed = this.isBodyUsed();
		if (bodyUsed === true || (bodyUsed == null && method !== 'get')) {
			body = await this._bodyGenerateFunc(data, request, $helpers, $helpers);
		} else {
			body = (void 0);
		}
		if (body != null && typeof body !== 'string') {
			body = JSON.stringify(body);
		}
		return body;
	}

	protected tryToRetrieveTraceIdFromResponse(request: PipelineStepData<In>, response: Response): string | undefined {
		const endpointTraceIdHeaderName = this.getEndpointTraceIdHeaderName();
		if (endpointTraceIdHeaderName == null) {
			return (void 0);
		}

		const endpointTraceId = response.headers.get(endpointTraceIdHeaderName);
		if (endpointTraceId == null || endpointTraceId.length === 0) {
			return (void 0);
		}

		const endpointTraceIdScope = this.getEndpointTraceIdScope();
		if (endpointTraceIdScope === 'system') {
			request.$context.setScopedTraceId(this.getEndpointSystemCode(), endpointTraceIdHeaderName, endpointTraceId);
		} else {
			request.$context.setScopedTraceId(this.getEndpointKey(), endpointTraceIdHeaderName, endpointTraceId);
		}

		return endpointTraceId;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async sendRequest(url: string, method: string, headers: Record<string, string>, body: any,
	                            data: InFragment, request: PipelineStepData<In>,
	                            $helpers: PipelineStepHelpers): Promise<OutFragment> {
		const response = await fetch(url, {
			method, headers, body,
			signal: this.needTimeout() ? (() => {
				const controller = new AbortController();
				setTimeout(() => controller.abort(), this.getEndpointTimeout());
				return controller.signal;
			})() : (void 0)
		});
		// retrieve trace id from response anyway
		this.tryToRetrieveTraceIdFromResponse(request, response);
		const status = response.status;
		if (status >= 400) {
			return await this._responseErrorHandleFunc({
				$url: url, $factor: data, $request: request, $response: response,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				$errorCode: `${status}`
			}, $helpers, $helpers);
		} else {
			return await this._responseGenerateFunc(response, data, request, $helpers, $helpers);
		}
	}

	protected async doPerform(data: InFragment, request: PipelineStepData<In>): Promise<OutFragment> {
		const $helpers = this.getHelpers();
		let url = '';
		try {
			url = await this._urlGenerateFunc(this.getEndpointUrl(), data, request, $helpers, $helpers);
			const method = this.getEndpointMethod();
			const headers = await this.generateRequestHeaders(data, request, $helpers);
			this.syncEndpointTraceId(headers, request);
			const body = await this.generateRequestBody(method, data, request, $helpers);
			return await this.sendRequest(url, method, headers, body, data, request, $helpers);
		} catch (e) {
			if (e instanceof DOMException || e.name === 'AbortError') {
				return await this._responseErrorHandleFunc({
					$url: url, $factor: data, $request: request, $errorCode: HttpAbortErrorCode
				}, $helpers, $helpers);
			} else if (e instanceof UncatchableError) {
				// uncatchable error is thrown manually, do not handle it again.
				throw e;
			} else {
				return await this._responseErrorHandleFunc({
					$url: url, $factor: data, $request: request, $errorCode: HttpUnknownErrorCode
				}, $helpers, $helpers);
			}
		}
	}
}
