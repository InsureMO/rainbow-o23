import {Config, UncatchableError, Undefinable} from '@rainbow-o23/n1';
import {ERR_DEF_TYPE_NOT_SUPPORTED} from '../error-codes';
import {PipelineReader} from './pipeline-reader';
import {PipelineStepReader} from './pipeline-step-reader';
import {PipelineStepSetsReader} from './pipeline-step-sets-reader';
import {Def, ParsedDef, PipelineDef, PipelineStepDef, PipelineStepSetsDef} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExternalRedress = (given: any) => any

export interface ReaderOptions {
	config: Config;
	redress?: ExternalRedress;
}

export interface Reader<C> {
	load(content: C): ParsedDef;
}

export abstract class AbstractReader<C> implements Reader <C> {
	private readonly _config: Config;
	private readonly _redress: Undefinable<ExternalRedress>;

	public constructor(options: ReaderOptions) {
		this._config = options.config;
		this._redress = options.redress;
	}

	protected getConfig(): Config {
		return this._config;
	}

	protected dashToCamel(key: string): string {
		return key.replace(/-(.)/g, function (match, group1) {
			return group1.toUpperCase();
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected redressKeyCase(given: any): any {
		if (given == null) {
			return given;
		} else if (Array.isArray(given)) {
			return given.map(item => this.redressKeyCase(item));
		} else if (typeof given === 'object') {
			return Object.keys(given).reduce((redressed, key) => {
				if (key.indexOf('-') !== -1) {
					redressed[this.dashToCamel(key)] = this.redressKeyCase(given[key]);
				} else {
					redressed[key] = this.redressKeyCase(given[key]);
				}
				return redressed;
			}, {});
		} else {
			return given;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected redressValue(given: any): any {
		if (given == null) {
			return given;
		} else if (Array.isArray(given)) {
			return given.map(item => this.redressValue(item));
		} else if (typeof given === 'object') {
			return Object.keys(given).reduce((redressed, key) => {
				redressed[key] = this.redressValue(given[key]);
				return redressed;
			}, {});
		} else if (typeof given === 'string' && given.trim().startsWith('env:')) {
			const value = given.trim().substring(4);
			return this.getConfig().getString(value);
		} else {
			return given;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected redressDef(given: any): any {
		if (this._redress) {
			given = this._redress(given);
		}
		given = this.redressKeyCase(given);
		return this.redressValue(given);
	}

	public abstract parse(content: C): Def;

	protected isPipeline(def: Def): def is PipelineDef {
		return def.type === 'pipeline';
	}

	protected isStep(def: Def): def is PipelineStepDef {
		return def.type === 'step';
	}

	protected isStepSets(def: Def): def is PipelineStepSetsDef {
		return def.type === 'step-sets';
	}

	public load(content: C): ParsedDef {
		const def = this.redressDef(this.parse(content));
		switch (true) {
			case this.isPipeline(def):
				return PipelineReader.read(def);
			case this.isStep(def):
				return PipelineStepReader.read(def);
			case this.isStepSets(def):
				return PipelineStepSetsReader.read(def);
			default:
				throw new UncatchableError(ERR_DEF_TYPE_NOT_SUPPORTED, `Definition type[${def.type}] is not supported.`);
		}
	}
}
