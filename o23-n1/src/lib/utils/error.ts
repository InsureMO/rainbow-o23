/** should be O00-00000 - O99-99999 */
export type O23ReservedErrorCode = `O${number}-${number}`;
/** prefix should be any uppercase but O00 - O99, number should be 00000 - 99999 */
export type O23ExternalErrorCode = `O${Uppercase<string>}-${number}`;
export type O23ErrorCode = O23ReservedErrorCode | O23ExternalErrorCode;
export const ERR_PIPELINE_NOT_FOUND: O23ReservedErrorCode = 'O01-00001';
export const ERR_TRIM_NON_STRING: O23ReservedErrorCode = 'O01-00002';
export const ERR_UNKNOWN: O23ReservedErrorCode = 'O01-99999';

export class CatchableError extends Error {
	public constructor(private readonly _code: string, message: string) {
		super(message);
	}

	public getCode(): string {
		return this._code;
	}
}

export class UncatchableError extends Error {
	public constructor(private readonly _code: string, message: string) {
		super(message);
	}

	public getCode(): string {
		return this._code;
	}
}

export class ExposedUncatchableError extends UncatchableError {
	private readonly _status: number;

	public constructor(status: number, code: string, message: string) {
		super(code, message);
		this._status = status;
	}

	public getStatus(): number {
		return this._status;
	}
}
