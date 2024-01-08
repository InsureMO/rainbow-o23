export interface PackageJSON {
	name: string;
	version: string;
	description: string;
	scripts: Record<string, string>;
	dependencies: Record<string, string>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	jest: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	repository: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	license: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	bugs: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	author: any
}
