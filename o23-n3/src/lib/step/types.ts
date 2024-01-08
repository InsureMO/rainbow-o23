import {
	CatchableError,
	ExposedUncatchableError,
	PipelineStepData,
	PipelineStepHelpers,
	UncatchableError
} from '@rainbow-o23/n1';

export type ScriptFunctionBody = string;
// eslint-disable-next-line @typescript-eslint/ban-types
export type ScriptFuncOrBody<F = Function> = F | ScriptFunctionBody;

export interface ErrorHandleOptions<In, InFragment, E extends Error = Error> {
	$code: string;
	$error: E;
	$factor: InFragment;
	$request: PipelineStepData<In>;
}

export type HandleCatchableError<In, InFragment, OutFragment> = ($options: ErrorHandleOptions<In, InFragment, CatchableError>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment> | never;
export type HandleUncatchableError<In, InFragment, OutFragment> = ($options: ErrorHandleOptions<In, InFragment, UncatchableError>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment> | never;
export type HandleExposedUncatchableError<In, InFragment, OutFragment> = ($options: ErrorHandleOptions<In, InFragment, ExposedUncatchableError>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment> | never;
export type HandleAnyError<In, InFragment, OutFragment> = ($options: ErrorHandleOptions<In, InFragment>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment> | never;
