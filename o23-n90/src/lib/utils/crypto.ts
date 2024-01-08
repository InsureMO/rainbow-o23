import * as crypto from 'crypto';

export type MD5 = string;

export class CryptoUtils {
	public static md5(content: string): MD5 {
		const hash = crypto.createHash('md5');
		// change to 'binary' if you want a binary hash.
		hash.setEncoding('hex');
		// the text that you want to hash
		hash.write(content);
		// very important! You cannot read from the stream until you have called end()
		hash.end();
		// and now you get the resulting hash
		return hash.read();
	}
}
