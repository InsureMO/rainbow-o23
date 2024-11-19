import {ValueAction} from './action-types';

export const regexp = (regexp: RegExp): ValueAction => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (value?: any) => {
		if (value == null) {
			return {test: false, value};
		}
		const type = typeof value;
		if (['string', 'number', 'bigint'].includes(type)) {
			return {test: regexp.test(value), value};
		}
		return {test: false, value};
	};
};
