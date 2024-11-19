import {RegisteredValueAction, RegisteredValueActionWithParams} from './action-types';
import {isBlank, isEmpty, isNotBlank, isNotEmpty, isNotNull, isNull} from './test-any-actions';
import {
	isDecimal,
	isGreaterThan,
	isGreaterThanOrEqual,
	isInRange,
	isInteger,
	isLessThan,
	isLessThanOrEqual,
	isNegative,
	isNotNegative,
	isNotPositive,
	isNotZero,
	isPositive,
	isZero
} from './test-decimal-actions';
import {regexp} from './test-string-actions';

const testers = {
	// any
	isNull: {type: 'func', func: isNull} as RegisteredValueAction,
	isNotNull: {type: 'func', func: isNotNull} as RegisteredValueAction,
	isEmpty: {type: 'func', func: isEmpty} as RegisteredValueAction,
	isNotEmpty: {type: 'func', func: isNotEmpty} as RegisteredValueAction,
	isBlank: {type: 'func', func: isBlank} as RegisteredValueAction,
	isNotBlank: {type: 'func', func: isNotBlank} as RegisteredValueAction,
	// string
	regexp: {type: 'param', func: regexp} as RegisteredValueActionWithParams<typeof regexp>,
	regex: {type: 'param', func: regexp} as RegisteredValueActionWithParams<typeof regexp>,
	matches: {type: 'param', func: regexp} as RegisteredValueActionWithParams<typeof regexp>,
	// decimal, return decimal if test pass
	isNumber: {type: 'func', func: isDecimal} as RegisteredValueAction,
	isDecimal: {type: 'func', func: isDecimal} as RegisteredValueAction,
	isInteger: {type: 'func', func: isInteger} as RegisteredValueAction,
	isInt: {type: 'func', func: isInteger} as RegisteredValueAction,
	isPositive: {type: 'func', func: isPositive} as RegisteredValueAction,
	isNotPositive: {type: 'func', func: isNotPositive} as RegisteredValueAction,
	isNegative: {type: 'func', func: isNegative} as RegisteredValueAction,
	isNotNegative: {type: 'func', func: isNotNegative} as RegisteredValueAction,
	isZero: {type: 'func', func: isZero} as RegisteredValueAction,
	isNotZero: {type: 'func', func: isNotZero} as RegisteredValueAction,
	// decimal with params, return decimal if test pass
	isGreaterThan: {type: 'param', func: isGreaterThan} as RegisteredValueActionWithParams<typeof isGreaterThan>,
	gt: {type: 'param', func: isGreaterThan} as RegisteredValueActionWithParams<typeof isGreaterThan>,
	isGreaterThanOrEqual: {
		type: 'param', func: isGreaterThanOrEqual
	} as RegisteredValueActionWithParams<typeof isGreaterThanOrEqual>,
	gte: {type: 'param', func: isGreaterThanOrEqual} as RegisteredValueActionWithParams<typeof isGreaterThanOrEqual>,
	isLessThan: {type: 'param', func: isLessThan} as RegisteredValueActionWithParams<typeof isLessThan>,
	lt: {type: 'param', func: isLessThan} as RegisteredValueActionWithParams<typeof isLessThan>,
	isLessThanOrEqual: {
		type: 'param', func: isLessThanOrEqual
	} as RegisteredValueActionWithParams<typeof isLessThanOrEqual>,
	lte: {type: 'param', func: isLessThanOrEqual} as RegisteredValueActionWithParams<typeof isLessThanOrEqual>,
	isInRange: {type: 'param', func: isInRange} as RegisteredValueActionWithParams<typeof isInRange>,
	within: {type: 'param', func: isInRange} as RegisteredValueActionWithParams<typeof isInRange>
};
export const AllTesters: Readonly<typeof testers> = testers;