// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import createScriptsDefTables from './00001-create-scripts-def-tables.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import executeScriptsMySQL from './00002-execute-scripts-mysql.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import executeScriptsPgSQL from './00003-execute-scripts-pgsql.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import executeScriptsMsSQL from './00004-execute-scripts-mssql.yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import executeScriptsOracle from './00005-execute-scripts-oracle.yaml';

export default [
	{key: '00001-create-scripts-def-tables.yaml', content: createScriptsDefTables},
	{key: '00002-execute-scripts-mysql.yaml', content: executeScriptsMySQL},
	{key: '00003-execute-scripts-pgsql.yaml', content: executeScriptsPgSQL},
	{key: '00004-execute-scripts-mssql.yaml', content: executeScriptsMsSQL},
	{key: '00005-execute-scripts-oracle.yaml', content: executeScriptsOracle}
];
