import {Request} from '@nestjs/common';
import {Undefinable} from '@rainbow-o23/n1';
import {DynamicModuleParameter} from './parameter-decorator';
import {
	DynamicModuleAuthorization,
	DynamicModulePipeline,
	DynamicModuleVisitPermit,
	ParameterDecoratorDelegateDef,
	ParameterType
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Authentication = any;

export interface RoleBasedAuthentication<R = DynamicModuleVisitPermit | { code: DynamicModuleVisitPermit }> {
	readonly roles?: Array<R>;
}

export interface Authorization<R = { code: DynamicModuleVisitPermit }> {
	readonly authorized: boolean;
	/** empty array when authorized is false */
	readonly roles: Array<R>;
}

const uniqueAuthorizations = (authorizations?: DynamicModuleAuthorization | Array<DynamicModuleAuthorization>): Array<DynamicModuleAuthorization> => {
	if (authorizations == null) {
		return [];
	} else if (typeof authorizations === 'string') {
		return [...new Set(authorizations.split(',').map(auth => auth.trim()).filter(auth => auth.length !== 0))];
	} else {
		return [...new Set(authorizations.map(auth => auth.trim()).filter(auth => auth.length !== 0))];
	}
};

export class AuthGuardMetadata {
	private readonly _anonymous: boolean;
	private readonly _fullyAuthenticated: boolean;
	private readonly _roles: Undefinable<Array<DynamicModuleVisitPermit>>;

	public constructor(authorizations?: DynamicModuleAuthorization | Array<DynamicModuleAuthorization>) {
		const uniqueness = uniqueAuthorizations(authorizations);
		switch (true) {
			case (uniqueness.length === 0):
			case (uniqueness.includes('anonymous')): {
				this._anonymous = true;
				this._fullyAuthenticated = false;
				this._roles = (void 0);
				break;
			}
			case uniqueness.includes('authenticated'): {
				this._anonymous = false;
				this._fullyAuthenticated = true;
				if (uniqueness.length === 1) {
					this._roles = (void 0);
				} else {
					this._roles = uniqueness.filter(role => role !== 'authenticated');
				}
				break;
			}
			default: {
				this._anonymous = false;
				this._fullyAuthenticated = true;
				this._roles = uniqueness;
				break;
			}
		}
	}

	public isAnonymousAllowed(): boolean {
		return this._anonymous;
	}

	public needFullyAuthenticated(): boolean {
		return this._fullyAuthenticated;
	}

	public getRoles(): Array<DynamicModuleVisitPermit> {
		return this._roles ?? [];
	}

	public isFullyAuthenticated(authentication?: Authentication): boolean {
		return authentication != null;
	}

	public authorize(authentication: RoleBasedAuthentication): Authorization {
		if (authentication == null) {
			return {authorized: false, roles: []};
		}
		if (this.isAnonymousAllowed()) {
			// anonymous is allowed, ignore the roles
			return {authorized: true, roles: []};
		}
		const roles = this.getRoles();
		const given = (authentication.roles ?? []).map(role => {
			if (typeof role === 'string') {
				return {code: role};
			} else {
				return role;
			}
		});
		if (roles.length === 0) {
			// no specific role required, assign roles from authentication
			return {authorized: true, roles: given};
		}
		const matched = given.filter(role => roles.some(r => r === role.code));
		if (matched.length !== 0) {
			return {authorized: true, roles: matched};
		} else {
			return {authorized: false, roles: []};
		}
	}
}

export class DynamicModuleRequestAuthGuard {
	private constructor() {
		// avoid extend
	}

	public static create(def: DynamicModulePipeline, index: number): Undefinable<ParameterDecoratorDelegateDef> {
		const uniqueness = uniqueAuthorizations(def.authorizations);
		switch (true) {
			case (uniqueness.length === 0):
			case (uniqueness.includes('anonymous')): {
				return (void 0);
			}
			case uniqueness.includes('authenticated'):
			default: {
				return DynamicModuleParameter.createParameterDecoratorDelegateDef({
					decorator: Request(), index, type: ParameterType.REQUEST, name: '$request'
				});
			}
		}
	}
}
