import {createLogger, Logger} from './logger';
import {Undefinable} from './types';

const MISSED = Symbol();

export class Config {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private valueCache: Record<string, any> = {};

	public constructor(private _logger: Logger) {
	}

	public getLogger(): Logger {
		return this._logger;
	}

	public setLogger(value: Logger) {
		this._logger = value;
	}

	protected generateKey(name: string) {
		const key = name
			.split('.')
			.filter(s => s.trim().length !== 0)
			.map(s => s.toUpperCase())
			.join('_');
		return key.startsWith('CFG_') ? key : `CFG_${key}`;
	}

	protected getFromCache<T>(name: string, read: () => Undefinable<T>, defaultValue?: T): Undefinable<T> {
		const cached = this.valueCache[name];
		if (cached === MISSED) {
			return defaultValue ?? (void 0);
		} else if (cached != null) {
			return cached;
		} else {
			const value = read();
			this.valueCache[name] = value ?? MISSED;
			return value ?? defaultValue ?? (void 0);
		}
	}

	public getString(name: string, defaultValue?: string): Undefinable<string> {
		return this.getFromCache(name, () => {
			// noinspection JSUnresolvedReference
			const value = process.env[this.generateKey(name)];
			if (value == null || value.trim().length === 0) {
				return (void 0);
			} else {
				return value.trim();
			}
		}, defaultValue);
	}

	public getBoolean(name: string, defaultValue?: boolean): Undefinable<boolean> {
		return this.getFromCache(name, () => {
			// noinspection JSUnresolvedReference
			const value = process.env[this.generateKey(name)];
			if (value == null || value.trim().length === 0) {
				return (void 0);
			} else if (['TRUE', 'YES', 'ON', '1'].includes(value.trim().toUpperCase())) {
				return true;
			} else if (['FALSE', 'NO', 'OFF', '0'].includes(value.trim().toUpperCase())) {
				return false;
			} else {
				this._logger.warn(`Cannot parse given configuration item value[${value}] to boolean, ignored.`, Config.name);
				return (void 0);
			}
		}, defaultValue);
	}

	public getNumber(name: string, defaultValue?: number): Undefinable<number> {
		return this.getFromCache(name, () => {
			// noinspection JSUnresolvedReference
			const value = process.env[this.generateKey(name)];
			if (value == null || value.trim().length === 0) {
				return (void 0);
			}
			const v = Number(value);
			if (isNaN(v)) {
				this._logger.error(`Cannot parse given configuration item value[${value}] to number, ignored.`, Config.name);
				return (void 0);
			} else {
				return v;
			}
		}, defaultValue);
	}

	public getJson<R>(name: string, defaultValue?: R): Undefinable<R> {
		return this.getFromCache(name, () => {
			// noinspection JSUnresolvedReference
			const value = process.env[this.generateKey(name)];
			if (value == null || value.trim().length === 0) {
				return (void 0);
			} else {
				try {
					return JSON.parse(value);
				} catch {
					this._logger.warn(`Cannot parse given configuration item value[${value}] to boolean, ignored.`, Config.name);
					return (void 0);
				}
			}
		}, defaultValue);
	}
}

export const createConfig = (logger?: Logger) => {
	return new Config(logger ?? createLogger());
};
