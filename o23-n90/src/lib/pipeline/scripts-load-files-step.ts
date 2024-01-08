import {PipelineStepData, PipelineStepType} from '@rainbow-o23/n1';
import {BootstrapOptions} from '@rainbow-o23/n2';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from '@rainbow-o23/n3';
import {
	AbstractFragmentaryPipelineStepBuilder,
	FragmentaryPipelineStepBuilderOptions,
	PipelineStepBuilderType
} from '@rainbow-o23/n4';
import * as fs from 'fs';
import {glob} from 'glob';
import * as path from 'path';
import {ConfigConstants} from '../config';
import {CryptoUtils, MD5} from '../utils';

export interface Script {
	filename: string;
	content: string;
	author?: string;
	md5: MD5;
	deploymentTag: string;
	ddl: boolean;
}

export interface ScriptsLoadFilesPipelineStepOptions extends FragmentaryPipelineStepOptions {
	dir?: string;
}

export class ScriptsLoadFilesPipelineStep
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	extends AbstractFragmentaryPipelineStep<any, Array<Script>, any, Array<Script>> {
	private readonly _directory?: string;

	public constructor(options: ScriptsLoadFilesPipelineStepOptions) {
		super(options);
		this._directory = options.dir;
	}

	protected getDirectory(): string {
		if (this._directory == null || this._directory.trim().length == 0) {
			return ConfigConstants.APP_SCRIPTS_DEFAULT_DIR;
		} else {
			return this._directory;
		}
	}

	protected readFile(file: string): Script {
		const content = fs.readFileSync(file).toString();
		const lines = content.split('\n');
		let good = 0;
		let author = 'Anonymous';
		let tags = (void 0);
		for (let line of lines) {
			if (line.trim().startsWith('--')) {
				line = line.substring(2).trim();
				if (line.startsWith('author:')) {
					author = line.substring(7).trim();
					good = good + 1;
				} else if (line.startsWith('tags:')) {
					tags = line.substring(5).trim();
					good = good + 1;
				}
			}
			if (good === 2) {
				break;
			}
		}
		return {
			filename: file,
			content,
			md5: CryptoUtils.md5(content),
			author,
			deploymentTag: tags,
			ddl: file.endsWith('.ddl.sql')
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
	protected async doPerform(dataSourceType: string, _request: PipelineStepData<any>): Promise<Array<Script>> {
		let dir = this.getDirectory();
		const cwd = process.cwd();
		const cwdLength = cwd.length;
		dir = dir.startsWith('/') ? dir : path.resolve(cwd, dir, dataSourceType);
		const files = await glob(`${dir}/**/*.{ddl,dml}.sql`);
		return files.sort().map(file => {
			const script = this.readFile(file);
			script.filename = file.substring(cwdLength);
			return script;
		});
	}
}

export type ScriptsLoadFilesPipelineStepBuilderOptions = FragmentaryPipelineStepBuilderOptions & {
	dir: ScriptsLoadFilesPipelineStepOptions['dir']
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createScriptsLoadFilesStepBuilder = (_options: BootstrapOptions): PipelineStepBuilderType => {
	return class ScriptsLoadFilesPipelineStepBuilder
		extends AbstractFragmentaryPipelineStepBuilder<ScriptsLoadFilesPipelineStepBuilderOptions, ScriptsLoadFilesPipelineStepOptions, ScriptsLoadFilesPipelineStep> {
		protected getStepType(): PipelineStepType<ScriptsLoadFilesPipelineStep> {
			return ScriptsLoadFilesPipelineStep;
		}

		protected readMoreOptions(given: ScriptsLoadFilesPipelineStepBuilderOptions, transformed: ScriptsLoadFilesPipelineStepOptions): ScriptsLoadFilesPipelineStepOptions {
			transformed = super.readMoreOptions(given, transformed);
			transformed.dir = given.dir;
			return transformed;
		}
	};
};
