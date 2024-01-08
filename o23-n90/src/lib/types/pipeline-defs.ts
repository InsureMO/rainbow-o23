import {DateTime} from '@rainbow-o23/n1';
import {AccountName} from './common';

export type O23PipelineConfig = string;

export interface O23PipelineDefs {
	defId: bigint | string;
	defCode: string;
	enabled: boolean;
	exposeApi?: boolean;
	exposeRoute?: string;
	config: O23PipelineConfig;
	tenantCode?: string;
	version: number;
	createdAt: DateTime;
	createdBy: AccountName;
	lastModifiedAt: DateTime;
	lastModifiedBy: AccountName;
}