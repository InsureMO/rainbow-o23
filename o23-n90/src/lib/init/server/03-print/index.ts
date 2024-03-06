// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printTemplateSave from './001-print-template-save.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printTemplateFindById from './002-print-template-find-by-id.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printTemplateFindByCode from './003-print-template-find-by-code.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printTemplateSaveFile from './004-print-template-save-file.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printTemplateDownloadFile from './005-print-template-download-file.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printFindTemplate from './006-print-find-template.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printTaskCreate from './007-print-task-create.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printDataPrepare from './008-print-data-prepare.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printTaskExecute from './009-print-task-execute.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printAsync from './010-print-async.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printSync from './011-print-sync.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printTaskDownloadFile from './012-print-task-download-file.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printTaskStatus from './013-print-task-status.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printTemplateSearch from './014-print-template-search.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import printTemplateFindSubTemplate from './015-print-template-find-sub-template.yaml';

export default [
	{key: '001-print-template-save.yaml', content: printTemplateSave},
	{key: '002-print-template-find-by-id.yaml', content: printTemplateFindById},
	{key: '003-print-template-find-by-code.yaml', content: printTemplateFindByCode},
	{key: '004-print-template-save-file.yaml', content: printTemplateSaveFile},
	{key: '005-print-template-download-file.yaml', content: printTemplateDownloadFile},
	{key: '006-print-find-template.yaml', content: printFindTemplate},
	{key: '007-print-task-create.yaml', content: printTaskCreate},
	{key: '008-print-data-prepare.yaml', content: printDataPrepare},
	{key: '009-print-task-execute.yaml', content: printTaskExecute},
	{key: '010-print-async.yaml', content: printAsync},
	{key: '011-print-sync.yaml', content: printSync},
	{key: '012-print-task-download-file.yaml', content: printTaskDownloadFile},
	{key: '013-print-task-status.yaml', content: printTaskStatus},
	{key: '014-print-template-search.yaml', content: printTemplateSearch},
	{key: '015-print-template-find-sub-template.yaml', content: printTemplateFindSubTemplate}
];
