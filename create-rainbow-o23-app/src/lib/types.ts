export interface PackageJSON {
	name: string;
	description: string;
	scripts: Record<string, string>;
	dependencies: Record<string, string>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	jest: Record<string, any>;
}
