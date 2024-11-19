import {OBJECT_PROTOTYPE, ValueAction} from './action-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isLength = (value: any): boolean => {
	return typeof value === 'number' && value > -1 && value % 1 === 0 && value <= Number.MAX_SAFE_INTEGER;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isArrayLike = (value: any): boolean => {
	return value != null && typeof value !== 'function' && isLength(value.length);
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPrototype = (value: any): boolean => {
	const Ctor = value && value.constructor;
	const proto = (typeof Ctor === 'function' && Ctor.prototype) || OBJECT_PROTOTYPE;

	return value === proto;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNull: ValueAction<any, null | undefined> = (value?: any) => {
	return value == null
		? {test: true, value: value as null | undefined}
		: {test: false, value};
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNotNull: ValueAction<any, NonNullable<any>> = (value?: any) => ({test: !isNull(value).test, value});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEmpty: ValueAction = (value?: any) => {
	if (value == null) {
		return {test: true, value: value as null | undefined};
	}
	let length: number | null = null;
	if (isArrayLike(value) && (Array.isArray(value) || typeof value === 'string')) {
		length = value.length;
	} else if (value instanceof Map) {
		length = value.size;
	} else if (value instanceof Set) {
		length = value.size;
	} else if (isPrototype(value)) {
		length = Object.keys(value).length;
	}
	return {test: length === 0, value};
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNotEmpty: ValueAction = (value?: any) => ({test: !isEmpty(value).test, value});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isBlank: ValueAction<any, null | undefined | string> = (value?: any) => {
	switch (true) {
		case (value == null):
			return {test: true, value: value as null | undefined};
		case (typeof value === 'string' && value.trim().length === 0):
			return {test: true, value: value as string};
		default:
			return {test: false, value};
	}
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNotBlank: ValueAction = (value?: any) => ({test: !isBlank(value).test, value});
