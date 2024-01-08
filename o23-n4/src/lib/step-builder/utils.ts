import {Undefinable} from '@rainbow-o23/n1';
import {ScriptFuncOrBody} from '@rainbow-o23/n3';

export const redressString = (value?: string): Undefinable<string> => {
	if (value == null || value.trim().length === 0) {
		return (void 0);
	} else {
		return value.trim();
	}
};

export const redressSnippet = <F>(snippet?: ScriptFuncOrBody<F>): Undefinable<ScriptFuncOrBody<F>> => {
	if (snippet == null) {
		return (void 0);
	}
	switch (typeof snippet) {
		case 'function':
			return snippet;
		case 'string':
			// do nothing
			break;
		default:
			snippet = `${snippet}`;
			break;
	}
	const trimmed = (snippet as string).trim();
	if (trimmed.length === 0) {
		return (void 0);
	}
	if (snippet.endsWith('\n')) {
		return trimmed;
	}

	const body = trimmed;
	if (body.indexOf('\n') !== -1) {
		// multiple line, return itself
		return body;
	} else if (body.startsWith('return') || body.startsWith('throw')) {
		// return exists
		return body;
	}
	return `return ${body}`;
};
