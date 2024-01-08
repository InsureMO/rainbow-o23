import {Config} from '@rainbow-o23/n1';
import {
	AzureActiveDirectoryAccessTokenAuthentication
} from 'typeorm/driver/sqlserver/authentication/AzureActiveDirectoryAccessTokenAuthentication.js';
import {
	AzureActiveDirectoryMsiAppServiceAuthentication
} from 'typeorm/driver/sqlserver/authentication/AzureActiveDirectoryMsiAppServiceAuthentication.js';
import {
	AzureActiveDirectoryMsiVmAuthentication
} from 'typeorm/driver/sqlserver/authentication/AzureActiveDirectoryMsiVmAuthentication.js';
import {
	AzureActiveDirectoryPasswordAuthentication
} from 'typeorm/driver/sqlserver/authentication/AzureActiveDirectoryPasswordAuthentication.js';
import {
	AzureActiveDirectoryServicePrincipalSecret
} from 'typeorm/driver/sqlserver/authentication/AzureActiveDirectoryServicePrincipalSecret.js';
import {DefaultAuthentication} from 'typeorm/driver/sqlserver/authentication/DefaultAuthentication.js';
import {NtlmAuthentication} from 'typeorm/driver/sqlserver/authentication/NtlmAuthentication.js';
import {
	SqlServerConnectionCredentialsAuthenticationOptions
} from 'typeorm/driver/sqlserver/SqlServerConnectionCredentialsOptions.js';
import {SqlServerConnectionOptions} from 'typeorm/driver/sqlserver/SqlServerConnectionOptions.js';
import {AbstractTypeOrmDataSource} from './abstract-datasource';

export class MssqlTypeOrmDatasource extends AbstractTypeOrmDataSource<SqlServerConnectionOptions> {
	/**
	 * override me if there are more options
	 */
	protected createOptions(config: Config): SqlServerConnectionOptions {
		const name = this.getName();
		const authType = config.getString(`typeorm.${name}.authentication.type`) as SqlServerConnectionCredentialsAuthenticationOptions['type'];
		const hasAuth = authType != null && authType.trim().length !== 0;

		return {
			type: 'mssql',
			host: config.getString(`typeorm.${name}.host`, 'localhost'),
			port: config.getNumber(`typeorm.${name}.port`, 1433),
			username: config.getString(`typeorm.${name}.username`),
			password: config.getString(`typeorm.${name}.password`),
			database: config.getString(`typeorm.${name}.database`),
			schema: config.getString(`typeorm.${name}.schema`),
			authentication: hasAuth ? (() => {
				switch (authType) {
					case 'ntlm':
						return {
							type: 'ntlm',
							options: {
								userName: config.getString(`typeorm.${name}.username`),
								password: config.getString(`typeorm.${name}.password`),
								domain: config.getString(`typeorm.${name}.domain`)
							}
						} as NtlmAuthentication;
					case 'azure-active-directory-access-token':
						return {
							type: 'azure-active-directory-access-token',
							options: {
								token: config.getString(`typeorm.${name}.azure.ad.access.token`)
							}
						} as AzureActiveDirectoryAccessTokenAuthentication;
					case 'azure-active-directory-msi-app-service':
						return {
							type: 'azure-active-directory-msi-app-service',
							options: {
								clientId: config.getString(`typeorm.${name}.azure.ad.msi.app.service.client.id`),
								msiEndpoint: config.getString(`typeorm.${name}.azure.ad.msi.app.service.endpoint`),
								msiSecret: config.getString(`typeorm.${name}.azure.ad.msi.app.service.secret`)
							}
						} as AzureActiveDirectoryMsiAppServiceAuthentication;
					case 'azure-active-directory-msi-vm':
						return {
							type: 'azure-active-directory-msi-vm',
							options: {
								clientId: config.getString(`typeorm.${name}.azure.ad.msi.vm.client.id`),
								msiEndpoint: config.getString(`typeorm.${name}.azure.ad.msi.vm.endpoint`)
							} as AzureActiveDirectoryMsiVmAuthentication['options']
						};
					case 'azure-active-directory-password':
						return {
							type: 'azure-active-directory-password',
							options: {
								userName: config.getString(`typeorm.${name}.username`),
								password: config.getString(`typeorm.${name}.password`),
								domain: config.getString(`typeorm.${name}.domain`)
							}
						} as AzureActiveDirectoryPasswordAuthentication;
					case 'azure-active-directory-service-principal-secret':
						return {
							type: 'azure-active-directory-service-principal-secret',
							options: {
								clientId: config.getString(`typeorm.${name}.azure.ad.msi.vm.client.id`),
								clientSecret: config.getString(`typeorm.${name}.azure.ad.msi.vm.client.secret`),
								tenantId: config.getString(`typeorm.${name}.azure.ad.msi.vm.tenant.id`)
							}
						} as AzureActiveDirectoryServicePrincipalSecret;
					case 'default':
					default:
						return {
							type: 'default',
							options: {
								userName: config.getString(`typeorm.${name}.username`),
								password: config.getString(`typeorm.${name}.password`)
							}
						} as DefaultAuthentication;
				}
			})() : (void 0),
			synchronize: config.getBoolean(`typeorm.${name}.synchronize`, false),
			logging: config.getBoolean(`typeorm.${name}.logging`, false),
			connectionTimeout: config.getNumber(`typeorm.${name}.connect.timeout`),
			requestTimeout: config.getNumber(`typeorm.${name}.request.timeout`),
			pool: {
				max: config.getNumber(`typeorm.${name}.pool.max`, 5),
				min: config.getNumber(`typeorm.${name}.pool.min`, 1),
				// maxWaitingClients: config.getNumber(`typeorm.${name}.pool.max.waiting.clients`),
				acquireTimeoutMillis: config.getNumber(`typeorm.${name}.pool.acquire.timeout`),
				idleTimeoutMillis: config.getNumber(`typeorm.${name}.pool.idle.timeout`)
			},
			options: {
				instanceName: config.getString(`typeorm.${name}.instance`),
				enableAnsiNullDefault: config.getBoolean(`typeorm.${name}.ansi.null.enabled`),
				connectTimeout: config.getNumber(`typeorm.${name}.connect.timeout`),
				cancelTimeout: config.getNumber(`typeorm.${name}.cancel.timeout`),
				useUTC: config.getBoolean(`typeorm.${name}.use.utc`),
				encrypt: config.getBoolean(`typeorm.${name}.encrypt`),
				cryptoCredentialsDetails: config.getJson(`typeorm.${name}.crypto.credentials`),
				tdsVersion: config.getJson(`typeorm.${name}.tds.version`),
				enableArithAbort: config.getJson(`typeorm.${name}.arithmetic.abort`),
				trustServerCertificate: config.getBoolean(`typeorm.${name}.trust.server.certificate`)
			}
		};
	}
}
