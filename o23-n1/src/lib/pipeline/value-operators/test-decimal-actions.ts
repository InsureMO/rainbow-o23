import Decimal from 'decimal.js';
import {ValueAction} from './action-types';
import {toDecimal} from './transform-decimal-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isDecimal: ValueAction<any, Decimal> = (value?: any) => {
	const {test, value: decimal} = toDecimal(value);
	return {test, value: test ? decimal : value};
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isInteger: ValueAction<any, Decimal> = (value?: any) => {
	const {test, value: decimal} = toDecimal(value);
	return (test && decimal.isInteger()) ? {test: true, value: decimal} : {test: false, value};
};
export type DecimalInterval = 'closed' | 'c' | 'open' | 'o' | 'left-open' | 'lo' | 'right-open' | 'ro';
export type DecimalInRangeOptions =
	& { interval?: DecimalInterval }
	& ({ min: Decimal.Value; max?: Decimal.Value; } | { min?: Decimal.Value; max: Decimal.Value; })
/**
 * @param options.min value of range, might be included or not
 * @param options.max max value of range, might be included or not
 * @param options.interval closed, c -> [min, max]; open, o -> (min, max); left-open, lo -> (min, max]; right-open, ro -> [min, max)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isInRange = (options: DecimalInRangeOptions): ValueAction<any, Decimal> => {
	const {min, max, interval = 'closed'} = options;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (value?: any) => {
		const {test, value: decimal} = toDecimal(value);
		if (!test) {
			return {test: false, value};
		}
		let pass = false;
		switch (interval) {
			case 'open':
			case 'o':
				pass = (min == null || decimal.gt(min)) && (max == null || decimal.lt(max));
				break;
			case 'left-open':
			case 'lo':
				pass = (min == null || decimal.gt(min)) && (max == null || decimal.lte(max));
				break;
			case 'right-open':
			case 'ro':
				pass = (min == null || decimal.gte(min)) && (max == null || decimal.lt(max));
				break;
			case 'closed':
			case 'c':
			default:
				pass = (min == null || decimal.gte(min)) && (max == null || decimal.lte(max));
				break;
		}
		return pass ? {test: true, value: decimal} : {test: false, value};
	};
};
export const isPositive = isInRange({min: 0, interval: 'left-open'});
export const isNotPositive = isInRange({max: 0});
export const isNegative = isInRange({max: 0, interval: 'right-open'});
export const isNotNegative = isInRange({min: 0});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isZero: ValueAction<any, Decimal> = (value?: any) => {
	const {test, value: decimal} = toDecimal(value);
	return (test && decimal.isZero()) ? {test: true, value: decimal} : {test: false, value};
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNotZero: ValueAction<any, Decimal> = (value?: any) => {
	const {test, value: decimal} = toDecimal(value);
	return (test && !decimal.isZero()) ? {test: true, value: decimal} : {test: false, value};
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isGreaterThan = (compare: Decimal.Value): ValueAction<any, Decimal> => {
	return isInRange({min: compare, interval: 'left-open'});
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isGreaterThanOrEqual = (compare: Decimal.Value): ValueAction<any, Decimal> => {
	return isInRange({min: compare});
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isLessThan = (compare: Decimal.Value): ValueAction<any, Decimal> => {
	return isInRange({max: compare, interval: 'right-open'});
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isLessThanOrEqual = (compare: Decimal.Value): ValueAction<any, Decimal> => {
	return isInRange({max: compare});
};
