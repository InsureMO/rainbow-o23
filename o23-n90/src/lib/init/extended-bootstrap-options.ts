import {Config} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {Def} from '@rainbow-o23/n4';

export type ProgrammaticPipelineDef = Def | (() => Def);

export class ExtendedBootstrapOptions extends BootstrapOptions {
	private readonly _programmaticPipelineDefs: Record<string, Exclude<ProgrammaticPipelineDef, Def>> = {};

	public constructor(config: Config) {
		super(config);
	}

	public addProgrammaticPipelineDef(defs: Record<string, ProgrammaticPipelineDef>): void {
		Object.keys(defs ?? {}).forEach(key => {
			const exists = this._programmaticPipelineDefs[key];
			if (exists != null) {
				this.getConfig().getLogger().warn(`Duplicated pipeline def key[${key}] found, ignored.`, ExtendedBootstrapOptions.name);
			}
			const def = defs[key];
			if (typeof def === 'function') {
				this._programmaticPipelineDefs[key] = def;
			} else {
				this._programmaticPipelineDefs[key] = () => def;
			}
		});
	}

	public getProgrammaticPipelineDefs(): Record<string, Exclude<ProgrammaticPipelineDef, Def>> {
		return this._programmaticPipelineDefs ?? {};
	}
}
