import {ValueAction} from './action-types';

/**
 * always pass, and trim if given value is string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trim: ValueAction = (value?: any) => {
	if (value == null) {
		return {test: true, value};
	} else if (typeof value === 'string') {
		return {test: true, value: value.trim()};
	} else {
		return {test: true, value};
	}
};
export type PadOptions = {
	length: number;
	char?: string;
	direction?: 'left' | 'right';
}
/**
 * return value must be a string if padding could perform, otherwise return given value itself no matter what it is.
 * could perform means performed, or not performed when length of given value is greater than or equal to given length.
 */
export const pad = (options: PadOptions): ValueAction => {
	const {length, char = ' ', direction = 'right'} = options;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (value?: any) => {
		if (value == null) {
			return {test: false, value};
		}
		const type = typeof value;
		if (['string', 'number', 'bigint', 'boolean'].includes(type)) {
			const stringified = `${value}`;
			const len = stringified.length;
			if (len >= length) {
				return {test: true, value: stringified};
			}
			return {
				test: true,
				value: direction === 'left' ? stringified.padStart(length, char) : stringified.padEnd(length, char)
			};
		} else {
			return {test: false, value};
		}
	};
};
export const padStart = (options: Omit<PadOptions, 'direction'>): ValueAction => pad({...options, direction: 'left'});
export const padEnd = (options: Omit<PadOptions, 'direction'>): ValueAction => pad({...options, direction: 'right'});
