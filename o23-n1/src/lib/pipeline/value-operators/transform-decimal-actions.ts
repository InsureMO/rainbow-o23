import Decimal from 'decimal.js';
import {ValueAction} from './action-types';

export enum Rounding {
	ROUND_UP = 'up',
	ROUND_DOWN = 'down',
	ROUND_CEIL = 'ceil',
	ROUND_FLOOR = 'floor',
	ROUND_HALF_UP = 'half-up',
	ROUND_HALF_DOWN = 'half-down',
	ROUND_HALF_EVEN = 'half-even',
	ROUND_HALF_CEIL = 'half-ceil',
	ROUND_HALF_FLOOR = 'half-floor'
}

const ToDecimalJsRounding = {
	[Rounding.ROUND_UP]: Decimal.ROUND_UP,
	[Rounding.ROUND_DOWN]: Decimal.ROUND_DOWN,
	[Rounding.ROUND_CEIL]: Decimal.ROUND_CEIL,
	[Rounding.ROUND_FLOOR]: Decimal.ROUND_FLOOR,
	[Rounding.ROUND_HALF_UP]: Decimal.ROUND_HALF_UP,
	[Rounding.ROUND_HALF_DOWN]: Decimal.ROUND_HALF_DOWN,
	[Rounding.ROUND_HALF_EVEN]: Decimal.ROUND_HALF_EVEN,
	[Rounding.ROUND_HALF_CEIL]: Decimal.ROUND_HALF_CEIL,
	[Rounding.ROUND_HALF_FLOOR]: Decimal.ROUND_HALF_FLOOR
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toDecimal: ValueAction<any, Decimal> = (value?: any) => {
	if (value == null) {
		return {test: false, value};
	} else if (value instanceof Decimal) {
		return {test: true, value};
	} else if (['string', 'number'].includes(typeof value)) {
		try {
			return {test: true, value: new Decimal(value)};
		} catch {
			return {test: false, value};
		}
	} else {
		return {test: false, value};
	}
};
/**
 * May cause precision loss or value truncation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toNumber: ValueAction<any, number> = (value?: any) => {
	const {test, value: parsed} = toDecimal(value);
	if (!test) {
		return {test: false, value};
	}
	return {test: true, value: parsed.toNumber()};
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toFixed = (fractionDigits: number, rounding: Rounding = Rounding.ROUND_HALF_UP): ValueAction<any, string> => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (value?: any) => {
		const {test, value: parsed} = toDecimal(value);
		if (!test) {
			return {test: false, value};
		}
		return {test: true, value: parsed.toFixed(fractionDigits, ToDecimalJsRounding[rounding])};
	};
};
const baseRound = (rounding: Rounding = Rounding.ROUND_HALF_UP) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (fractionDigits: number): ValueAction<any, Decimal> => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (value?: any) => {
			const {test, value: parsed} = toDecimal(value);
			if (!test) {
				return {test: false, value};
			}
			return {test: true, value: parsed.toDecimalPlaces(fractionDigits, ToDecimalJsRounding[rounding])};
		};
	};
};
/** half up */
export const roundUp = baseRound(Rounding.ROUND_HALF_UP);
/** half down */
export const roundDown = baseRound(Rounding.ROUND_HALF_DOWN);
export const floor = baseRound(Rounding.ROUND_FLOOR);
export const ceil = baseRound(Rounding.ROUND_CEIL);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const roundBy = (fractionDigits: number, rounding: Rounding = Rounding.ROUND_HALF_UP): ValueAction<any, Decimal> => {
	return baseRound(rounding)(fractionDigits);
};
