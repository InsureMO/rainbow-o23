export type Nullable<T> = T | null | undefined;
export type Undefinable<T> = T | undefined;
export type DateTime = string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
export interface Type<T = any> extends Function {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	new(...args: any[]): T;
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
