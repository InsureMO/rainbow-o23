export class ResponseHeadersGuardMetadata {
	public constructor(private readonly exposeHeaders?: Record<string, string>) {
	}

	public getExposedHeaders(): Record<string, string> {
		return this.exposeHeaders ?? {};
	}
}