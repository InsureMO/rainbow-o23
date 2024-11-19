import {RegisteredValueAction, RegisteredValueActionWithParams} from './action-types';
import {ceil, floor, roundBy, roundDown, roundUp, toDecimal, toFixed, toNumber} from './transform-decimal-actions';
import {pad, padEnd, padStart, trim} from './transform-string-actions';

const transformers = {
	// string
	trim: {type: 'func', func: trim} as RegisteredValueAction,
	pad: {type: 'param', func: pad} as RegisteredValueActionWithParams<typeof pad>,
	padStart: {type: 'param', func: padStart} as RegisteredValueActionWithParams<typeof padStart>,
	padLeft: {type: 'param', func: padStart} as RegisteredValueActionWithParams<typeof padStart>,
	lpad: {type: 'param', func: padStart} as RegisteredValueActionWithParams<typeof padStart>,
	padEnd: {type: 'param', func: padEnd} as RegisteredValueActionWithParams<typeof padEnd>,
	padRight: {type: 'param', func: padEnd} as RegisteredValueActionWithParams<typeof padEnd>,
	rpad: {type: 'param', func: padEnd} as RegisteredValueActionWithParams<typeof padEnd>,
	// decimal
	toDecimal: {type: 'func', func: toDecimal} as RegisteredValueAction,
	toNumber: {type: 'func', func: toNumber} as RegisteredValueAction,
	toFixed0: {type: 'func', func: toFixed(0)} as RegisteredValueAction,
	toFixed1: {type: 'func', func: toFixed(1)} as RegisteredValueAction,
	toFixed2: {type: 'func', func: toFixed(2)} as RegisteredValueAction,
	toFixed3: {type: 'func', func: toFixed(3)} as RegisteredValueAction,
	toFixed4: {type: 'func', func: toFixed(4)} as RegisteredValueAction,
	toFixed5: {type: 'func', func: toFixed(5)} as RegisteredValueAction,
	toFixed6: {type: 'func', func: toFixed(6)} as RegisteredValueAction,
	// decimal with params
	toFixed: {type: 'param', func: toFixed} as RegisteredValueActionWithParams<typeof toFixed>,
	round: {type: 'param', func: roundUp} as RegisteredValueActionWithParams<typeof roundUp>,
	roundUp: {type: 'param', func: roundUp} as RegisteredValueActionWithParams<typeof roundUp>,
	roundDown: {type: 'param', func: roundDown} as RegisteredValueActionWithParams<typeof roundDown>,
	floor: {type: 'param', func: floor} as RegisteredValueActionWithParams<typeof floor>,
	ceil: {type: 'param', func: ceil} as RegisteredValueActionWithParams<typeof ceil>,
	roundBy: {type: 'param', func: roundBy} as RegisteredValueActionWithParams<typeof roundBy>
};
export const AllTransformers: Readonly<typeof transformers> = transformers;