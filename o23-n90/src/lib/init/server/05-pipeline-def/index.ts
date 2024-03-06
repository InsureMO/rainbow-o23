// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pipelineDefSave from './001-pipeline-def-save.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pipelineDefFindById from './002-pipeline-def-find-by-id.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pipelineDefFindByCode from './003-pipeline-def-find-by-code.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pipelineDefSearch from './004-pipeline-def-search.yaml';

export default [
	{key: '001-pipeline-def-save.yaml', content: pipelineDefSave},
	{key: '002-pipeline-def-find-by-id.yaml', content: pipelineDefFindById},
	{key: '003-pipeline-def-find-by-code.yaml', content: pipelineDefFindByCode},
	{key: '004-pipeline-def-search.yaml', content: pipelineDefSearch}
];
