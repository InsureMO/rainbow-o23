export interface PackageJSON {
	name: string;
	description: string;
	dependencies: Record<string, string>;
}
