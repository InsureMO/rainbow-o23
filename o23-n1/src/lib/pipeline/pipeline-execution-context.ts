import {nanoid} from 'nanoid';

export interface PipelineRequestAuthorizationRole {
	code?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PipelineRequestAuthorization<A = any> {
	readonly authorized: boolean;
	/** undefined when authorized is false */
	readonly authentication?: A;
	/** empty array when authorized is false */
	readonly roles: Array<PipelineRequestAuthorizationRole>;
	/** headers should be added to response */
	readonly headers?: Record<string, string>;
}

export class PipelineExecutionContext {
	private readonly _authorization?: PipelineRequestAuthorization;
	private readonly _traceId: string;
	/*
	 * typically, when calling a remote service, and which is from some microservices group,
	 * there might be some trace ids brought in.
	 * therefore, these trace ids should be collected and put into pipeline context.
	 * the key is tracing group, and value is trace id of this tracing group.
	 * Record<scope key, [name, value]>
	 */
	private readonly _scopedTraceIds: Record<string, [string, string]>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private readonly _others: Record<string, any> = {};

	constructor(authorization?: PipelineRequestAuthorization, traceId?: string, scopedTraceIds?: Record<string, [string, string]>) {
		this._authorization = authorization;
		this._traceId = traceId || nanoid(16);
		this._scopedTraceIds = scopedTraceIds || {};
	}

	get authorization(): PipelineRequestAuthorization {
		return this._authorization;
	}

	get traceId(): string {
		return this._traceId;
	}

	get scopedTraceIds(): Record<string, string> {
		return Object.values(this._scopedTraceIds).reduce((acc, [name, value]) => {
			if (value != null && value.trim().length !== 0) {
				acc[name] = value;
			}
			return acc;
		}, {});
	}

	findScopedTraceId(scopeKey: string): [string, string] | undefined {
		return this._scopedTraceIds[scopeKey];
	}

	setScopedTraceId(scopeKey: string, name: string, value: string): void {
		this._scopedTraceIds[scopeKey] = [name, value];
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	findOther(key: string): any | undefined {
		return this._others[key];
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setOther(key: string, value: any): void {
		this._others[key] = value;
	}

	shallowClone(...omittedKeys: Array<string>): PipelineExecutionContext {
		const cloned = new PipelineExecutionContext(this.authorization, this.traceId, this._scopedTraceIds);
		Object.keys(this._others).forEach(key => {
			if (omittedKeys.includes(key)) {
				return;
			}
			cloned.setOther(key, this.findOther(key));
		});
		return cloned;
	}

	clone(...omittedKeys: Array<string>): PipelineExecutionContext {
		const cloned = new PipelineExecutionContext(this.authorization, this.traceId);
		Object.keys(this._others).forEach(key => {
			if (omittedKeys.includes(key)) {
				return;
			}
			cloned.setOther(key, this.findOther(key));
		});
		return cloned;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	temporaryWith(temporaryContext: Record<string, any>): PipelineExecutionContext {
		return new TemporaryExecutionContext(this, temporaryContext);
	}
}

/**
 * everything same as parent context, except things in given temporary context
 */
export class TemporaryExecutionContext extends PipelineExecutionContext {
	private readonly _parent: PipelineExecutionContext;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private readonly _temporaryContext: Record<string, any>;
	private readonly _temporaryKeys: Array<string>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(parent: PipelineExecutionContext, temporaryContext: Record<string, any>) {
		super();
		this._parent = parent;
		this._temporaryContext = temporaryContext ?? {};
		this._temporaryKeys = Object.keys(this._temporaryContext);
	}

	protected get parent(): PipelineExecutionContext {
		return this._parent;
	}

	get authorization(): PipelineRequestAuthorization {
		return this.parent.authorization;
	}

	get traceId(): string {
		return this.parent.traceId;
	}

	get scopedTraceIds(): Record<string, string> {
		return this.parent.scopedTraceIds;
	}

	findScopedTraceId(scopeKey: string): [string, string] | undefined {
		return this.parent.findScopedTraceId(scopeKey);
	}

	setScopedTraceId(scopeKey: string, name: string, value: string) {
		this.parent.setScopedTraceId(scopeKey, name, value);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get temporaryContext(): Record<string, any> {
		return this._temporaryContext;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	findOther(key: string): any {
		if (this._temporaryKeys.includes(key)) {
			return this.temporaryContext[key];
		} else {
			return super.findOther(key);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setOther(key: string, value: any) {
		if (this._temporaryKeys.includes(key)) {
			this.temporaryContext[key] = value;
		} else {
			super.setOther(key, value);
		}
	}
}
