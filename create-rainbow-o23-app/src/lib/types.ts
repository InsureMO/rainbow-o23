export enum Plugins {
	PRINT = 'print', AWS_S3 = 'aws-s3'
}

export enum DatasourceTypes {
	MySQL = 'mysql', MSSQL = 'mssql', PgSQL = 'pgsql', Oracle = 'oracle'
}

export enum PackageManager {
	NPM = 'npm', PNPM = 'pnpm', YARN = 'yarn'
}

export interface PackageJson {
	dependencies: {
		'@rainbow-o23/n91'?: string;
		'@rainbow-o23/n92'?: string;
		[key: string]: string
	};
	scripts: Record<string, string>;
}
