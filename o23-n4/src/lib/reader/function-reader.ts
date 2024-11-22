import {UncatchableError} from '@rainbow-o23/n1';
import {ERR_UNKNOWN_FUNCTION_PARSE_ERROR} from '../error-codes';
import {AbstractReader} from './abstract-reader';
import {Def} from './types';

/** enabled is for parsed, which not provided by def itself, but used later */
export type DefEnablement = Def & { enabled?: boolean }
export type DefCreate = () => DefEnablement;

export class FuncReader extends AbstractReader<DefCreate> {
	public parse(content: DefCreate): Def {
		try {
			return content();
		} catch (e) {
			console.error(e);
			throw new UncatchableError(ERR_UNKNOWN_FUNCTION_PARSE_ERROR, `Cannot execute function content[${content}].`);
		}
	}
}
