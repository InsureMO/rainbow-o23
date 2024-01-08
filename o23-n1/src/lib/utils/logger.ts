export type LoggerLevel = 'debug' | 'verbose' | 'log' | 'warn' | 'error';
export type LoggerName = `${string}.${LoggerLevel}`;
export type LoggerEnablement = Record<LoggerName, boolean>;

export interface Logger {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	log(message: any, ...optionalParams: any[]): any;

	/**
	 * Write an 'error' level log.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	error(message: any, ...optionalParams: any[]): any;

	/**
	 * Write a 'warn' level log.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	warn(message: any, ...optionalParams: any[]): any;

	/**
	 * Write a 'debug' level log.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	debug?(message: any, ...optionalParams: any[]): any;

	/**
	 * Write a 'verbose' level log.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	verbose?(message: any, ...optionalParams: any[]): any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RedressedOutputParams = { key?: string, message: any, optionalParams: any[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildOutput = (message: any, ...optionalParams: any[]): RedressedOutputParams => {
	if (optionalParams == null || optionalParams.length === 0) {
		return {message, optionalParams};
	}
	const key = optionalParams.pop();
	if (typeof key === 'string') {
		return {key, message, optionalParams};
	} else {
		return {message, optionalParams: [...optionalParams, key]};
	}
};

export class EnhancedLogger implements Logger {
	private static ENABLED_LEVELS: Array<LoggerLevel> = ['warn', 'error'];
	// noinspection SpellCheckingInspection
	private static ENABLEMENTS: LoggerEnablement = {};
	private _logger: Logger;

	constructor(logger: Logger) {
		this._logger = logger;
	}

	// noinspection JSUnusedGlobalSymbols
	public getInternalLogger(): Logger {
		return this._logger;
	}

	public static enableLevel(level: LoggerLevel) {
		if (EnhancedLogger.ENABLED_LEVELS.includes(level)) {
			// already enabled, do nothing
		} else {
			const levels: Array<LoggerLevel> = ['debug', 'verbose', 'log', 'warn', 'error'];
			const foundIndex = levels.indexOf(level);
			EnhancedLogger.ENABLED_LEVELS = levels.filter((_level, index) => {
				return index >= foundIndex;
			});
		}
	}

	public static disableLevel(level: LoggerLevel) {
		if (!EnhancedLogger.ENABLED_LEVELS.includes(level)) {
			// already disabled, do nothing
		} else {
			const levels: Array<LoggerLevel> = ['debug', 'verbose', 'log', 'warn', 'error'];
			const foundIndex = levels.indexOf(level);
			EnhancedLogger.ENABLED_LEVELS = levels.filter((_level, index) => {
				return index > foundIndex;
			});
		}
	}

	public static isLevelEnabled(level: LoggerLevel): boolean {
		return EnhancedLogger.ENABLED_LEVELS.includes(level);
	}

	public static enable(name: LoggerName | string) {
		if (['debug', 'verbose', 'log', 'warn', 'error'].some(level => name.endsWith(`.${level}`))) {
			EnhancedLogger.ENABLEMENTS[name] = true;
		} else {
			['debug', 'verbose', 'log', 'warn', 'error'].forEach(level => {
				EnhancedLogger.ENABLEMENTS[`${name}.${level}`] = true;
			});
		}
	}

	public static disable(name: LoggerName | string) {
		if (['debug', 'verbose', 'log', 'warn', 'error'].some(level => name.endsWith(`.${level}`))) {
			EnhancedLogger.ENABLEMENTS[name] = false;
		} else {
			['debug', 'verbose', 'log', 'warn', 'error'].forEach(level => {
				EnhancedLogger.ENABLEMENTS[`${name}.${level}`] = false;
			});
		}
	}

	public static isEnabled(name: LoggerName): boolean {
		if (EnhancedLogger.ENABLEMENTS[name] === false) {
			// indicated as disabled
			return false;
		} else if (EnhancedLogger.ENABLEMENTS[name] === true) {
			// indicated as enabled
			return true;
		} else { // noinspection RedundantIfStatementJS
			if (this.ENABLED_LEVELS.some(level => name.endsWith(`.${level}`))) {
				// corresponded level is enabled
				return true;
			} else {
				return false;
			}
		}
	}

	// noinspection JSUnusedGlobalSymbols
	public takeover(to: Logger): void {
		this._logger = to ?? console;
	}

	public restore(): void {
		this._logger = console;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public debug(message: any, ...optionalParams: any[]): any {
		const {key} = buildOutput(message, ...optionalParams);
		if (key != null && EnhancedLogger.isEnabled(`${key}.debug`)) {
			return this._logger.debug(message, ...optionalParams);
		} else if (EnhancedLogger.isLevelEnabled('debug')) {
			return this._logger.debug(message, ...optionalParams);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public verbose(message: any, ...optionalParams: any[]): any {
		const {key} = buildOutput(message, ...optionalParams);
		if (key != null && EnhancedLogger.isEnabled(`${key}.verbose`)) {
			return this._logger.verbose(message, ...optionalParams);
		} else if (EnhancedLogger.isLevelEnabled('verbose')) {
			return this._logger.verbose(message, ...optionalParams);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public log(message: any, ...optionalParams: any[]): any {
		const {key} = buildOutput(message, ...optionalParams);
		if (key != null && EnhancedLogger.isEnabled(`${key}.log`)) {
			return this._logger.log(message, ...optionalParams);
		} else if (EnhancedLogger.isLevelEnabled('log')) {
			return this._logger.log(message, ...optionalParams);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public warn(message: any, ...optionalParams: any[]): any {
		const {key} = buildOutput(message, ...optionalParams);
		if (key != null && EnhancedLogger.isEnabled(`${key}.warn`)) {
			return this._logger.warn(message, ...optionalParams);
		} else if (EnhancedLogger.isLevelEnabled('warn')) {
			return this._logger.warn(message, ...optionalParams);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public error(message: any, ...optionalParams: any[]): any {
		const {key} = buildOutput(message, ...optionalParams);
		if (key != null && EnhancedLogger.isEnabled(`${key}.error`)) {
			return this._logger.error(message, ...optionalParams);
		} else if (EnhancedLogger.isLevelEnabled('error')) {
			return this._logger.error(message, ...optionalParams);
		}
	}
}

export class ConsoleLogger implements Logger {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private buildPrefix(level: LoggerLevel, message: any, ...optionalParams: any[]): Array<string> {
		const date = new Date();
		const {key, message: msg, optionalParams: params} = buildOutput(message, ...optionalParams);
		return [
			`%c[${date.toLocaleDateString()} ${date.toLocaleTimeString()}] %c[${key ?? 'UNKNOWN CATEGORY'}] %c[${level.toUpperCase()}]`,
			'color: #871094', 'color: #0033B3', 'color: #9E880D',
			msg, ...params
		];
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	debug(message: any, ...optionalParams: any[]): any {
		return console.debug(...this.buildPrefix('debug', message, ...optionalParams));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	verbose(message: any, ...optionalParams: any[]): any {
		return console.trace(...this.buildPrefix('verbose', message, ...optionalParams));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	log(message: any, ...optionalParams: any[]): any {
		return console.log(...this.buildPrefix('log', message, ...optionalParams));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	warn(message: any, ...optionalParams: any[]): any {
		return console.warn(...this.buildPrefix('warn', message, ...optionalParams));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	error(message: any, ...optionalParams: any[]): any {
		return console.error(...this.buildPrefix('error', message, ...optionalParams));
	}
}

export const createLogger = (logger?: Logger): EnhancedLogger => {
	return new EnhancedLogger(logger ?? new ConsoleLogger());
};

export class LoggerPerformanceSaver {
	public constructor(private readonly message: () => string) {
	}

	get [Symbol.toStringTag]() {
		return this.message();
	}
}

export const saveLoggerPerformance = (message: () => string) => {
	return new LoggerPerformanceSaver(message);
};

export class LoggerUtils {
	private constructor() {
		// avoid extend
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static stringifyObject(given: any): string {
		if (given instanceof Buffer) {
			return '...Buffer (content ignored)';
		} else if (typeof given === 'object' && given.type === 'Buffer' && given.data != null && Array.isArray(given.data)) {
			return '...Buffer (content ignored)';
		}
		return JSON.stringify(given, (_key, value) => {
			if (value == null) {
				return (void 0);
			} else if (value instanceof Buffer) {
				return '...Buffer (content ignored)';
			} else if (typeof value === 'object' && value.type === 'Buffer' && value.data != null && Array.isArray(value.data)) {
				return '...Buffer (content ignored)';
			} else {
				return value;
			}
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static normalizeObject(given: any): any {
		if (given instanceof Buffer) {
			return '...Buffer (content ignored)';
		} else if (typeof given === 'object' && given.type === 'Buffer' && given.data != null && Array.isArray(given.data)) {
			return '...Buffer (content ignored)';
		}
		return Object.keys(given).reduce((normalized, key) => {
			const value = given[key];
			if (value == null) {
				return (void 0);
			} else if (Array.isArray(value)) {
				return value.map(LoggerUtils.normalizeObject);
			} else if (value instanceof Buffer) {
				return '...Buffer (content ignored)';
			} else if (typeof value === 'object' && value.type === 'Buffer' && value.data != null && Array.isArray(value.data)) {
				return '...Buffer (content ignored)';
			} else {
				return value;
			}
		}, {});
	}
}