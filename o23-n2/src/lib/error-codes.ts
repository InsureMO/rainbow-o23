import {ErrorCodes, O23ReservedErrorCode} from '@rainbow-o23/n1';

export const ERR_PIPELINE_HTTP_METHOD_NOT_SUPPORTED: O23ReservedErrorCode = 'O02-00001';
export const ERR_RESPONSE_NOT_FOUND: O23ReservedErrorCode = 'O02-00002';
export const ERR_REQUEST_NOT_FOUND: O23ReservedErrorCode = 'O02-00003';

ErrorCodes.ERR_PIPELINE_HTTP_METHOD_NOT_SUPPORTED = ERR_PIPELINE_HTTP_METHOD_NOT_SUPPORTED;
ErrorCodes.ERR_RESPONSE_NOT_FOUND = ERR_RESPONSE_NOT_FOUND;
ErrorCodes.ERR_REQUEST_NOT_FOUND = ERR_REQUEST_NOT_FOUND;
