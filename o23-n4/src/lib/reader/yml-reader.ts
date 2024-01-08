import {UncatchableError} from '@rainbow-o23/n1';
import * as yaml from 'js-yaml';
import {ERR_UNKNOWN_YAML_PARSE_ERROR} from '../error-codes';
import {AbstractReader} from './abstract-reader';
import {Def} from './types';

export class YmlReader extends AbstractReader<string> {
	public parse(content: string): Def {
		try {
			return yaml.load(content) as Def;
		} catch (e) {
			console.error(e);
			throw new UncatchableError(ERR_UNKNOWN_YAML_PARSE_ERROR, `Cannot read yaml content[${content}].`);
		}
	}
}
