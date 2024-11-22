import {UncatchableError} from '@rainbow-o23/n1';
import {ERR_MATCHABLE_PARSER_NOT_FOUND} from '../error-codes';
import {AbstractReader, ReaderOptions} from './abstract-reader';
import {Def} from './types';

export interface MatchableReader {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	accept: (content: any) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	reader: AbstractReader<any>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class DiversifiedReader extends AbstractReader<any> {
	private readonly _matchableReaders: Array<MatchableReader>;

	public constructor(options: ReaderOptions, ...readers: Array<MatchableReader>) {
		super(options);
		this._matchableReaders = readers;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public parse(content: any): Def {
		for (const matchable of this._matchableReaders) {
			if (matchable.accept(content)) {
				return matchable.reader.parse(content);
			}
		}
		throw new UncatchableError(ERR_MATCHABLE_PARSER_NOT_FOUND, `Cannot read content[${content}].`);
	}
}
