import {ZstdInit} from '@oneidentity/zstd-js';
import {ZSTDDecoder} from 'zstddec';

test('ZStandard compression test', async () => {
	const data = JSON.stringify({a: new Array(10).fill('1234567890').join('')});
	const inputArray = new Uint8Array(Buffer.from(data));

	const {ZstdSimple, ZstdStream} = await ZstdInit();
	// Create some sample data to compress
	/*
	 * The required parameter is the data
	 * It must be a Uint8Array
	 * */
	const compressedSimpleData: Uint8Array = ZstdSimple.compress(inputArray, 3);
	{
		// console.time('@oneidentity/zstd-js');
		// for (let i = 0; i < 10000; i++) {
		// 	const {ZstdSimple} = await ZstdInit();
		// 	const decompressedArray = ZstdSimple.decompress(compressedSimpleData);
		// 	new TextDecoder().decode(decompressedArray);
		// }
		// console.timeEnd('@oneidentity/zstd-js');

		const {ZstdSimple} = await ZstdInit();
		const decompressedArray = ZstdSimple.decompress(compressedSimpleData);
		const decompressedStr = new TextDecoder().decode(decompressedArray);
		console.log(decompressedStr);
		console.log(decompressedStr.length);
		console.log(JSON.parse(decompressedStr));
	}
	{
		console.time('zstddec');
		for (let i = 0; i < 10; i++) {
			const decoder = new ZSTDDecoder();
			await decoder.init();
			const decompressedArray = decoder.decode(compressedSimpleData);
			const removeTrailingZeros = (arr: Uint8Array): Uint8Array => {
				let i = arr.length;
				while (i > 0 && arr[i - 1] === 0) {
					i--;
				}
				return arr.slice(0, i);
			};
			new TextDecoder().decode(removeTrailingZeros(decompressedArray));
		}
		console.timeEnd('zstddec');

		const decoder = new ZSTDDecoder();
		await decoder.init();
		const decompressedArray = decoder.decode(compressedSimpleData);
		const removeTrailingZeros = (arr: Uint8Array): Uint8Array => {
			let i = arr.length;
			while (i > 0 && arr[i - 1] === 0) {
				i--;
			}
			return arr.slice(0, i);
		};
		const decompressedStr = new TextDecoder().decode(removeTrailingZeros(decompressedArray));
		console.log(decompressedStr);
		console.log(decompressedStr.length);
		console.log(JSON.parse(decompressedStr));
	}

	// const compressedStreamData: Uint8Array = ZstdStream.compress(inputArray);
}, 30000);