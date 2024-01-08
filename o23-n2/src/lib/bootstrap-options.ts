import {DynamicModule, ForwardReference, Type} from '@nestjs/common';
import {Config, createConfig} from '@rainbow-o23/n1';
import {WinstonModule} from 'nest-winston';
import {format, Logform, transports} from 'winston';
import 'winston-daily-rotate-file';

export type PlugInModule = Type | DynamicModule | Promise<DynamicModule> | ForwardReference;

export class BootstrapOptions {
	private readonly _port: number;
	private readonly _context: string;
	private readonly modules: Array<PlugInModule> = [];

	public constructor(private readonly _config: Config) {
		this._port = this._config.getNumber('app.port', 3100);
		this._context = this._config.getString('app.context', '/o23');
		if (!this._context.startsWith('/')) {
			this._context = `/${this._context}`;
		}
	}

	public getConfig(): Config {
		return this._config;
	}

	public getPort(): number {
		return this._port;
	}

	public getContext(): string {
		return this._context;
	}

	// noinspection JSUnusedGlobalSymbols
	public asRoute(relative: string): string {
		if (relative.startsWith('/')) {
			return `${this._context}${relative}`;
		} else {
			return `${this._context}/${relative}`;
		}
	}

	public getEnvAsString(name: string, defaultValue?: string): string {
		return this._config.getString(name, defaultValue);
	}

	// noinspection JSUnusedGlobalSymbols
	public getEnvAsNumber(name: string, defaultValue?: number): number {
		return this._config.getNumber(name, defaultValue);
	}

	public getEnvAsBoolean(name: string, defaultValue?: boolean): boolean {
		return this._config.getBoolean(name, defaultValue);
	}

	/**
	 * override this method to provide your own logging format, following nest.js + winston standard
	 */
	public getLoggerFormat() {
		return format.printf((info) => {
			const {level, message, timestamp, context, stack} = info;
			return `${timestamp} [${context || 'O23'}] [${level.toUpperCase()}] ${stack == null ? message : `${message} ${stack}`}`;
		});
	}

	public getVersion(): string {
		return this._config.getString('app.version', 'UNDOCUMENTED');
	}

	public getBuiltAt(): string {
		return this._config.getString('app.built.at', 'UNDOCUMENTED');
	}

	/**
	 * winston is for logging
	 * override this method to provide your logging patterns, following nest.js + winston standard
	 */
	public createWinstonModule(): DynamicModule {
		return WinstonModule.forRootAsync({
			useFactory: () => {
				const appName = this._config.getString('app.name', 'O23-N99');
				const provider = this._config.getString('app.provider', 'Rainbow Team');
				const customized: Logform.Format = format((info) => {
					if (info['@timestamp'] == null) {
						info['@timestamp'] = new Date().toISOString();
					}
					if (info.level != null) {
						info.level = `${info.level}`.toUpperCase();
					}
					info.level = info.level === 'VERBOSE' ? 'TRACE' : (info.level === 'LOG' ? 'INFO' : info.level);
					provider && (info.provider = provider);
					appName && (info.current_app_name = appName);
					return info;
				})();
				return {
					transports: [
						// let's log errors into its own file
						new transports.DailyRotateFile({
							filename: this.getEnvAsString('logger.error.file', 'logs/error-%DATE%.log'),
							level: this.getEnvAsString('logger.error.level', 'error'),
							format: format.combine(customized, format.json()),
							datePattern: this.getEnvAsString('logger.error.date.pattern', 'YYYY-MM-DD'),
							zippedArchive: this.getEnvAsBoolean('logger.error.zipped.archive', false),
							maxFiles: this.getEnvAsString('logger.error.max.files', '30d'),
							maxSize: this.getEnvAsString('logger.error.max.size', '10m')
						}),
						// logging all level
						new transports.DailyRotateFile({
							filename: this.getEnvAsString('logger.combined.file', 'logs/combined-%DATE%.log'),
							level: this.getEnvAsString('logger.combined.level', 'log'),
							format: format.combine(customized, format.json()),
							datePattern: this.getEnvAsString('logger.combined.date.pattern', 'YYYY-MM-DD'),
							zippedArchive: this.getEnvAsBoolean('logger.combined.zipped.archive', false),
							maxFiles: this.getEnvAsString('logger.combined.max.files', '7d'),
							maxSize: this.getEnvAsString('logger.combined.max.size', '10m')
						}),
						// also want to see logs in our console
						this._config.getBoolean('logger.console.enabled', false)
							? new transports.Console({
								format: format.combine(
									format.cli(),
									format.splat(),
									customized,
									format.printf((info) => {
										return `${info['@timestamp']} [${info.context || 'O23'}] ${info.level}: ${info.message}`;
									})
								),
								level: this.getEnvAsString('logger.console.level', 'debug')
							})
							: null
					].filter(x => x != null)
				};
			}
		});
	}

	public getModules(): Array<PlugInModule> {
		return this.modules ?? [];
	}

	public addModule(...modules: Array<PlugInModule>): void {
		this.modules.push(...modules);
	}
}

const SINGLETON = {options: new BootstrapOptions(createConfig())};

/**
 * internal usage.
 */
export const createBoostrapOptions = (options?: BootstrapOptions): BootstrapOptions => {
	if (options != null) {
		SINGLETON.options = options;
	}
	return SINGLETON.options;
};

/**
 * get the standalone bootstrap options
 */
export const getBootstrapOptions = (): BootstrapOptions => {
	return SINGLETON.options;
};