import {S3Client} from '@aws-sdk/client-s3';
import {Config, UncatchableError, Undefinable} from '@rainbow-o23/n1';
import {
	ERR_AWS_S3_ACCESS_KEY_NOT_DEFINED,
	ERR_AWS_S3_CREATOR_NOT_FOUND,
	ERR_AWS_S3_REGION_NOT_DEFINED,
	ERR_AWS_S3_SECRET_KEY_NOT_DEFINED
} from '../error-codes';

export type S3ClientType = string;

export type S3ClientCreate = (name: string, config: Config) => Promise<S3Client>;

/** key is type */
const S3_CLIENT_CREATORS: Record<S3ClientType, S3ClientCreate> = {
	default: async (name: string, config: Config) => {
		const region = config.getString(`aws.s3.${name}.region`);
		if (region == null || region.trim().length === 0) {
			throw new UncatchableError(ERR_AWS_S3_REGION_NOT_DEFINED, `AWS S3 region for client[${name}] not defined.`);
		}
		const accessKey = config.getString(`aws.s3.${name}.access.key`);
		if (accessKey == null || accessKey.trim().length === 0) {
			throw new UncatchableError(ERR_AWS_S3_ACCESS_KEY_NOT_DEFINED, `AWS S3 access key for client[${name}] not defined.`);
		}
		const secretKey = config.getString(`aws.s3.${name}.secret.key`);
		if (secretKey == null || secretKey.trim().length === 0) {
			throw new UncatchableError(ERR_AWS_S3_SECRET_KEY_NOT_DEFINED, `AWS S3 secret key for client[${name}] not defined.`);
		}
		return new S3Client({
			region: region.trim(),
			credentials: {
				accessKeyId: accessKey.trim(),
				secretAccessKey: secretKey.trim(),
				sessionToken: config.getString(`aws.s3.${name}.session.token`),
				credentialScope: config.getString(`aws.s3.${name}.credential.scope`)
			}
		});
	}
};

export class ClientManager {
	// noinspection JSUnusedLocalSymbols
	private constructor() {
		// avoid extend
	}

	protected static registerClientCreator(type: S3ClientType, create: S3ClientCreate): Undefinable<S3ClientCreate> {
		const existing = S3_CLIENT_CREATORS[type];
		S3_CLIENT_CREATORS[type] = create;
		return existing;
	}

	public static async createClient(name: string, config: Config): Promise<S3Client> {
		const type: S3ClientType = config.getString(`aws.s3.${name}.client.type`, 'default');
		const create = S3_CLIENT_CREATORS[type];
		if (create == null) {
			throw new UncatchableError(ERR_AWS_S3_CREATOR_NOT_FOUND,
				`Aws S3 client creator by given configuration[aws.s3.${name}.client.type=${type}] not found.`);
		}

		return await create(name, config);
	}
}

export class S3ClientHelper {
	public constructor(private readonly config: Config) {
	}

	public async create(name: string): Promise<S3Client> {
		return await ClientManager.createClient(name, this.config);
	}
}
