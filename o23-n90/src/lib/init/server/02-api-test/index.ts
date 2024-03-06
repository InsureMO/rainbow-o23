// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTest from './001-api-test.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestSinglePathParam from './002-api-test-single-path-param.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestMultiPathParams from './003-api-test-multi-path-params.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestPathParams from './004-api-test-path-params.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestSingleQueryParam from './005-api-test-single-query-param.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestMultiQueryParams from './006-api-test-multi-query-params.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestQueryParams from './007-api-test-query-params.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestSingleNamedFile from './008-api-test-single-named-file.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestNamedFiles from './009-api-test-named-files.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestAnyFilesNoCheck from './010-api-test-any-files-no-check.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestAnyFilesCheck from './011-api-test-any-files-check.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestMultiNamedFilesNoCheck from './012-api-test-multi-named-files-no-check.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestMultiNamedFilesCheck from './013-api-test-multi-named-files-check.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestMixed from './014-api-test-mixed.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiTestDownload from './015-api-test-download.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiHomepageProxy from './016-api-homepage-proxy.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiErrorHandling from './017-api-error-handling.yaml';

export default [
	{key: '001-load-all-pipelines.yaml', content: apiTest},
	{key: '002-api-test-single-path-param.yaml', content: apiTestSinglePathParam},
	{key: '003-api-test-multi-path-params.yaml', content: apiTestMultiPathParams},
	{key: '004-api-test-path-params.yaml', content: apiTestPathParams},
	{key: '005-api-test-single-query-param.yaml', content: apiTestSingleQueryParam},
	{key: '006-api-test-multi-query-params.yaml', content: apiTestMultiQueryParams},
	{key: '007-api-test-query-params.yaml', content: apiTestQueryParams},
	{key: '008-api-test-single-named-file.yaml', content: apiTestSingleNamedFile},
	{key: '009-api-test-named-files.yaml', content: apiTestNamedFiles},
	{key: '010-api-test-any-files-no-check.yaml', content: apiTestAnyFilesNoCheck},
	{key: '011-api-test-any-files-check.yaml', content: apiTestAnyFilesCheck},
	{key: '012-api-test-multi-named-files-no-check.yaml', content: apiTestMultiNamedFilesNoCheck},
	{key: '013-api-test-multi-named-files-check.yaml', content: apiTestMultiNamedFilesCheck},
	{key: '014-api-test-mixed.yaml', content: apiTestMixed},
	{key: '015-api-test-download.yaml', content: apiTestDownload},
	{key: '016-api-homepage-proxy.yaml', content: apiHomepageProxy},
	{key: '017-api-error-handling.yaml', content: apiErrorHandling}
];
