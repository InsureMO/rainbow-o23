import {ErrorCodes, O23ReservedErrorCode} from '@rainbow-o23/n1';

export const ERR_PIPELINE_STEP_SNIPPET_NOT_EMPTY: O23ReservedErrorCode = 'O03-00001';
export const ERR_PIPELINE_STEP_CONDITIONAL_SNIPPET_NOT_EMPTY: O23ReservedErrorCode = 'O03-00002';
export const ERR_TYPEORM_DATASOURCE_TYPE_NOT_FOUND: O23ReservedErrorCode = 'O03-00003';
export const ERR_TYPEORM_DATASOURCE_CREATOR_NOT_FOUND: O23ReservedErrorCode = 'O03-00004';
export const ERR_TYPEORM_DATASOURCE_NOT_FOUND: O23ReservedErrorCode = 'O03-00005';
/** @deprecated, typeorm entity related steps are removed from 1.0.42 */
export const ERR_TYPEORM_ENTITY_NOT_FOUND: O23ReservedErrorCode = 'O03-00006';
export const ERR_TYPEORM_SQL_NOT_EMPTY: O23ReservedErrorCode = 'O03-00007';
export const ERR_TYPEORM_TRANSACTION_NOT_FOUND: O23ReservedErrorCode = 'O03-00008';
export const ERR_TYPEORM_STEP_SNIPPET_NOT_EMPTY: O23ReservedErrorCode = 'O03-00009';
export const ERR_FETCH_ERROR: O23ReservedErrorCode = 'O03-00010';
export const ERR_PIPELINE_STEP_METHOD_NOT_SUPPORTED: O23ReservedErrorCode = 'O03-00011';
export const ERR_EACH_FRAGMENT_NOT_ANY_ARRAY: O23ReservedErrorCode = 'O03-00012';
export const ERR_PIPELINE_STEP_REF_NOT_EMPTY: O23ReservedErrorCode = 'O03-00013';
export const ERR_PIPELINE_STEP_REF_NOT_FOUND: O23ReservedErrorCode = 'O03-00014';
export const ERR_PIPELINE_REF_NOT_EMPTY: O23ReservedErrorCode = 'O03-00015';
export const ERR_PIPELINE_REF_NOT_FOUND: O23ReservedErrorCode = 'O03-00016';
export const ERR_PIPELINE_SNIPPET_CANNOT_USE_GLOBAL: O23ReservedErrorCode = 'O03-00017';
export const ERR_PIPELINE_SNIPPET_CANNOT_USE_PROCESS: O23ReservedErrorCode = 'O03-00018';
export const ERR_PIPELINE_SNIPPET_CANNOT_USE_EVAL: O23ReservedErrorCode = 'O03-00019';
export const ERR_PIPELINE_SNIPPET_CANNOT_USE_FUNCTION: O23ReservedErrorCode = 'O03-00020';
export const ERR_TYPEORM_STREAM: O23ReservedErrorCode = 'O03-00021';

ErrorCodes.ERR_PIPELINE_STEP_SNIPPET_NOT_EMPTY = ERR_PIPELINE_STEP_SNIPPET_NOT_EMPTY;
ErrorCodes.ERR_PIPELINE_STEP_CONDITIONAL_SNIPPET_NOT_EMPTY = ERR_PIPELINE_STEP_CONDITIONAL_SNIPPET_NOT_EMPTY;
ErrorCodes.ERR_TYPEORM_DATASOURCE_TYPE_NOT_FOUND = ERR_TYPEORM_DATASOURCE_TYPE_NOT_FOUND;
ErrorCodes.ERR_TYPEORM_DATASOURCE_CREATOR_NOT_FOUND = ERR_TYPEORM_DATASOURCE_CREATOR_NOT_FOUND;
ErrorCodes.ERR_TYPEORM_DATASOURCE_NOT_FOUND = ERR_TYPEORM_DATASOURCE_NOT_FOUND;
/** @deprecated, typeorm entity related steps are removed from 1.0.42 */
ErrorCodes.ERR_TYPEORM_ENTITY_NOT_FOUND = ERR_TYPEORM_ENTITY_NOT_FOUND;
ErrorCodes.ERR_TYPEORM_SQL_NOT_EMPTY = ERR_TYPEORM_SQL_NOT_EMPTY;
ErrorCodes.ERR_TYPEORM_TRANSACTION_NOT_FOUND = ERR_TYPEORM_TRANSACTION_NOT_FOUND;
ErrorCodes.ERR_TYPEORM_STEP_SNIPPET_NOT_EMPTY = ERR_TYPEORM_STEP_SNIPPET_NOT_EMPTY;
ErrorCodes.ERR_FETCH_ERROR = ERR_FETCH_ERROR;
ErrorCodes.ERR_PIPELINE_STEP_METHOD_NOT_SUPPORTED = ERR_PIPELINE_STEP_METHOD_NOT_SUPPORTED;
ErrorCodes.ERR_EACH_FRAGMENT_NOT_ANY_ARRAY = ERR_EACH_FRAGMENT_NOT_ANY_ARRAY;
ErrorCodes.ERR_PIPELINE_STEP_REF_NOT_EMPTY = ERR_PIPELINE_STEP_REF_NOT_EMPTY;
ErrorCodes.ERR_PIPELINE_STEP_REF_NOT_FOUND = ERR_PIPELINE_STEP_REF_NOT_FOUND;
ErrorCodes.ERR_PIPELINE_REF_NOT_EMPTY = ERR_PIPELINE_REF_NOT_EMPTY;
ErrorCodes.ERR_PIPELINE_REF_NOT_FOUND = ERR_PIPELINE_REF_NOT_FOUND;
ErrorCodes.ERR_PIPELINE_SNIPPET_CANNOT_USE_GLOBAL = ERR_PIPELINE_SNIPPET_CANNOT_USE_GLOBAL;
ErrorCodes.ERR_PIPELINE_SNIPPET_CANNOT_USE_PROCESS = ERR_PIPELINE_SNIPPET_CANNOT_USE_PROCESS;
ErrorCodes.ERR_PIPELINE_SNIPPET_CANNOT_USE_EVAL = ERR_PIPELINE_SNIPPET_CANNOT_USE_EVAL;
ErrorCodes.ERR_PIPELINE_SNIPPET_CANNOT_USE_FUNCTION = ERR_PIPELINE_SNIPPET_CANNOT_USE_FUNCTION;
ErrorCodes.ERR_TYPEORM_STREAM = ERR_TYPEORM_STREAM;
