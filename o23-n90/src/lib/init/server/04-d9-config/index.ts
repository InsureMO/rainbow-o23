// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import d9ConfigSave from './001-d9-config-save.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import d9ConfigFindById from './002-d9-config-find-by-id.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import d9ConfigFindByCode from './003-d9-config-find-by-code.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import d9FindConfig from './004-d9-find-config.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import d9DataPrepare from './005-d9-data-prepare.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import d9ConfigPrepare from './006-d9-config-prepare.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import d9LoadConfig from './007-d9-load-config.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import d9LoadDataById from './008-d9-load-data-by-id.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import d9ConfigSearch from './009-d9-config-search.yaml';

export default [
	{key: '001-d9-config-save.yaml', content: d9ConfigSave},
	{key: '002-d9-config-find-by-id.yaml', content: d9ConfigFindById},
	{key: '003-d9-config-find-by-code.yaml', content: d9ConfigFindByCode},
	{key: '004-d9-find-config.yaml', content: d9FindConfig},
	{key: '005-d9-data-prepare.yaml', content: d9DataPrepare},
	{key: '006-d9-config-prepare.yaml', content: d9ConfigPrepare},
	{key: '007-d9-load-config.yaml', content: d9LoadConfig},
	{key: '008-d9-load-data-by-id.yaml', content: d9LoadDataById},
	{key: '009-d9-config-search.yaml', content: d9ConfigSearch}
];
