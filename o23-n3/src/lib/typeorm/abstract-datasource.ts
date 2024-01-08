import {Config} from '@rainbow-o23/n1';
import {DataSource, DataSourceOptions} from 'typeorm';

export interface TypeOrmDataSource {
	getName(): string;

	shouldKeptOnGlobal(): boolean;

	getDataSource(): DataSource;

	initialize(config: Config, entities: DataSourceOptions['entities']): Promise<DataSource>;

	destroy(): Promise<void>;
}

export abstract class AbstractTypeOrmDataSource<O extends DataSourceOptions> implements TypeOrmDataSource {
	private _initialized = false;
	private _dataSource: DataSource;

	// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
	public constructor(private readonly _name: string) {
	}

	public getName(): string {
		return this._name;
	}

	public isInitialized(): boolean {
		return this._initialized;
	}

	public getDataSource(): DataSource {
		return this._dataSource;
	}

	/**
	 * default true
	 */
	public shouldKeptOnGlobal(): boolean {
		return true;
	}

	protected abstract createOptions(config: Config): O;

	public async initialize(config: Config, entities: DataSourceOptions['entities']): Promise<DataSource> {
		if (this.isInitialized()) {
			return this._dataSource;
		}

		this._dataSource = new DataSource({...this.createOptions(config), entities});
		this._dataSource = await this._dataSource.initialize();
		return this._dataSource;
	}

	public async destroy(): Promise<void> {
		return await this._dataSource.destroy();
	}
}
