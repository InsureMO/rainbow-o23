import {UncatchableError} from '@rainbow-o23/n1';
import {ERR_UNKNOWN_FUNCTION_PARSE_ERROR} from '../error-codes';
import {AbstractReader} from './abstract-reader';
import {Def} from './types';

export type DefCreate = () => Def;

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
