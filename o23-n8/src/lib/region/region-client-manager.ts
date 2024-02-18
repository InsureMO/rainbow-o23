import {S3Client} from '@aws-sdk/client-s3';
import {Config, UncatchableError, Undefinable} from '@rainbow-o23/n1';
import {AwsCredentialIdentity} from '@smithy/types/dist-types/identity/awsCredentialIdentity';
import {
	ERR_AWS_CREDENTIAL_ACCESS_KEY_NOT_DEFINED,
	ERR_AWS_CREDENTIAL_SECRET_KEY_NOT_DEFINED,
	ERR_AWS_REGION_NOT_DEFINED,
	ERR_AWS_S3_CREATOR_NOT_FOUND
} from '../error-codes';

export type RegionClientType = string;

export type RegionClientCreate = (name: string, config: Config) => Promise<S3Client>;

/** key is type */
const S3_CLIENT_CREATORS: Record<RegionClientType, RegionClientCreate> = {};

export class RegionClientManager {
	// noinspection JSUnusedLocalSymbols
	private constructor() {
		// avoid extend
	}

	public static getRegion(name: string, config: Config): string {
		const region = config.getString(`aws.client.${name}.region`);
		if (region == null || region.trim().length === 0) {
			throw new UncatchableError(ERR_AWS_REGION_NOT_DEFINED, `AWS region for client[${name}] not defined.`);
		}
		return region.trim();
	}

	public static getCredentialIdentity(name: string, config: Config): AwsCredentialIdentity {
		const accessKey = config.getString(`aws.client.${name}.access.key`);
		if (accessKey == null || accessKey.trim().length === 0) {
			throw new UncatchableError(ERR_AWS_CREDENTIAL_ACCESS_KEY_NOT_DEFINED, `AWS credential access key for client[${name}] not defined.`);
		}
		const secretKey = config.getString(`aws.client.${name}.secret.key`);
		if (secretKey == null || secretKey.trim().length === 0) {
			throw new UncatchableError(ERR_AWS_CREDENTIAL_SECRET_KEY_NOT_DEFINED, `AWS credential secret key for client[${name}] not defined.`);
		}
		return {
			accessKeyId: accessKey.trim(),
			secretAccessKey: secretKey.trim(),
			sessionToken: config.getString(`aws.client.${name}.session.token`),
			credentialScope: config.getString(`aws.client.${name}.credential.scope`)
		};
	}

	protected static registerS3ClientCreator(type: RegionClientType, create: RegionClientCreate): Undefinable<RegionClientCreate> {
		const existing = S3_CLIENT_CREATORS[type];
		S3_CLIENT_CREATORS[type] = create;
		return existing;
	}

	public static async createS3Client(name: string, config: Config): Promise<S3Client> {
		const type: RegionClientType = config.getString(`aws.s3.${name}.client.type`, 'default');
		const create = S3_CLIENT_CREATORS[type];
		if (create == null) {
			throw new UncatchableError(ERR_AWS_S3_CREATOR_NOT_FOUND,
				`Aws S3 client creator by given configuration[aws.s3.${name}.client.type=${type}] not found.`);
		}

		return await create(name, config);
	}
}

// initialize default
S3_CLIENT_CREATORS.default = async (name: string, config: Config) => {
	return new S3Client({
		region: RegionClientManager.getRegion(name, config),
		credentials: RegionClientManager.getCredentialIdentity(name, config)
	});
};

export class RegionClientHelper {
	public constructor(private readonly config: Config) {
	}

	public async createS3Client(name: string): Promise<S3Client> {
		return await RegionClientManager.createS3Client(name, this.config);
	}
}
