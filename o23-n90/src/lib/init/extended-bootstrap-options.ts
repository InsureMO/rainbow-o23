import {Config} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {Def} from '@rainbow-o23/n4';

export class ExtendedBootstrapOptions extends BootstrapOptions {
	private readonly _programmaticPipelineDefs: Record<string, Def> = {};

	public constructor(config: Config) {
		super(config);
	}

	public addProgrammaticPipelineDef(defs: Record<string, Def>): void {
		Object.keys(defs ?? {}).forEach(key => {
			const exists = this._programmaticPipelineDefs[key];
			if (exists != null) {
				this.getConfig().getLogger().warn(`Duplicated pipeline def key[${key}] found, ignored.`, ExtendedBootstrapOptions.name);
			}
			this._programmaticPipelineDefs[key] = defs[key];
		});
	}

	public getProgrammaticPipelineDefs(): Record<string, Def> {
		return this._programmaticPipelineDefs ?? {};
	}
}
