import {ErrorCodes, O23ReservedErrorCode} from '@rainbow-o23/n1';

export const ERR_UNKNOWN_YAML_PARSE_ERROR: O23ReservedErrorCode = 'O04-00001';
export const ERR_PIPELINE_STEP_BUILDER_NOT_FOUND: O23ReservedErrorCode = 'O04-00002';
export const ERR_PIPELINE_STEP_SNIPPET_NOT_DEFINED: O23ReservedErrorCode = 'O04-00003';
export const ERR_PIPELINE_STEP_PROPERTY_NAME_NOT_DEFINED: O23ReservedErrorCode = 'O04-00004';
export const ERR_PIPELINE_STEP_DATASOURCE_NOT_DEFINED: O23ReservedErrorCode = 'O04-00005';
export const ERR_PIPELINE_STEP_TRANSACTION_NOT_DEFINED: O23ReservedErrorCode = 'O04-00006';
/** @deprecated, typeorm entity related steps are removed from 1.0.42 */
export const ERR_PIPELINE_STEP_ENTITY_NOT_DEFINED: O23ReservedErrorCode = 'O04-00007';
export const ERR_PIPELINE_STEP_FETCH_ENDPOINT_SYSTEM_NOT_DEFINED: O23ReservedErrorCode = 'O04-00008';
export const ERR_PIPELINE_STEP_FETCH_ENDPOINT_NOT_DEFINED: O23ReservedErrorCode = 'O04-00009';
export const ERR_DEF_TYPE_NOT_SUPPORTED: O23ReservedErrorCode = 'O04-00010';
export const ERR_PIPELINE_STEP_SETS_STEP_NOT_DEFINED: O23ReservedErrorCode = 'O04-00011';
export const ERR_PIPELINE_STEP_REF_NOT_DEFINED: O23ReservedErrorCode = 'O04-00012';
export const ERR_PIPELINE_STEP_SQL_NOT_DEFINED: O23ReservedErrorCode = 'O04-00013';
export const ERR_PIPELINE_PIPELINE_REF_NOT_DEFINED: O23ReservedErrorCode = 'O04-00014';
export const ERR_UNKNOWN_FUNCTION_PARSE_ERROR: O23ReservedErrorCode = 'O04-00015';

ErrorCodes.ERR_UNKNOWN_YAML_PARSE_ERROR = ERR_UNKNOWN_YAML_PARSE_ERROR;
ErrorCodes.ERR_PIPELINE_STEP_BUILDER_NOT_FOUND = ERR_PIPELINE_STEP_BUILDER_NOT_FOUND;
ErrorCodes.ERR_PIPELINE_STEP_SNIPPET_NOT_DEFINED = ERR_PIPELINE_STEP_SNIPPET_NOT_DEFINED;
ErrorCodes.ERR_PIPELINE_STEP_PROPERTY_NAME_NOT_DEFINED = ERR_PIPELINE_STEP_PROPERTY_NAME_NOT_DEFINED;
ErrorCodes.ERR_PIPELINE_STEP_DATASOURCE_NOT_DEFINED = ERR_PIPELINE_STEP_DATASOURCE_NOT_DEFINED;
ErrorCodes.ERR_PIPELINE_STEP_TRANSACTION_NOT_DEFINED = ERR_PIPELINE_STEP_TRANSACTION_NOT_DEFINED;
/** @deprecated, typeorm entity related steps are removed from 1.0.42 */
ErrorCodes.ERR_PIPELINE_STEP_ENTITY_NOT_DEFINED = ERR_PIPELINE_STEP_ENTITY_NOT_DEFINED;
ErrorCodes.ERR_PIPELINE_STEP_FETCH_ENDPOINT_SYSTEM_NOT_DEFINED = ERR_PIPELINE_STEP_FETCH_ENDPOINT_SYSTEM_NOT_DEFINED;
ErrorCodes.ERR_PIPELINE_STEP_FETCH_ENDPOINT_NOT_DEFINED = ERR_PIPELINE_STEP_FETCH_ENDPOINT_NOT_DEFINED;
ErrorCodes.ERR_DEF_TYPE_NOT_SUPPORTED = ERR_DEF_TYPE_NOT_SUPPORTED;
ErrorCodes.ERR_PIPELINE_STEP_SETS_STEP_NOT_DEFINED = ERR_PIPELINE_STEP_SETS_STEP_NOT_DEFINED;
ErrorCodes.ERR_PIPELINE_STEP_REF_NOT_DEFINED = ERR_PIPELINE_STEP_REF_NOT_DEFINED;
ErrorCodes.ERR_PIPELINE_STEP_SQL_NOT_DEFINED = ERR_PIPELINE_STEP_SQL_NOT_DEFINED;
ErrorCodes.ERR_PIPELINE_PIPELINE_REF_NOT_DEFINED = ERR_PIPELINE_PIPELINE_REF_NOT_DEFINED;
ErrorCodes.ERR_UNKNOWN_FUNCTION_PARSE_ERROR = ERR_UNKNOWN_FUNCTION_PARSE_ERROR;
