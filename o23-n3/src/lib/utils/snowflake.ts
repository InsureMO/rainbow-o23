export type SnowflakeId = string;
export type SnowflakeGenerateOptions = { timestamp?: Date | number, shardId?: number };

export class Snowflake {
	/** The generators epoch timestamp in milliseconds. Defaults to "1st of January 1970, 00:00". */
	private static EPOCH: number = Date.UTC(1970, 0, 1).valueOf();

	/** The id of the shard running this generator. Defaults to "1". */
	private static SHARD_ID = 1;

	/**
	 * Max sequence, 2^12 - 1
	 */
	private static readonly MAX_SEQUENCE = 4095;
	/** current sequence */
	private static sequence = 0;
	private static lastTimestamp = -1;

	/**
	 * Generates a single snowflake.
	 */
	static generate(options: SnowflakeGenerateOptions = {}): SnowflakeId {
		let {timestamp = Date.now(), shardId} = options;

		if (timestamp instanceof Date) {
			timestamp = timestamp.getTime();
		} else {
			timestamp = new Date(timestamp).getTime();
		}

		shardId = shardId || Snowflake.SHARD_ID;

		if (timestamp === Snowflake.lastTimestamp) {
			Snowflake.sequence = (Snowflake.sequence + 1) % Snowflake.MAX_SEQUENCE;
			if (Snowflake.sequence === 0) {
				timestamp = Snowflake.waitNextMillis(timestamp);
			}
		} else {
			Snowflake.sequence = 0;
		}

		Snowflake.lastTimestamp = timestamp;

		const result = (BigInt(timestamp - Snowflake.EPOCH) << BigInt(22)) |
			(BigInt(shardId % 1024) << BigInt(12)) |
			BigInt(Snowflake.sequence);

		return result.toString();
	}

	private static waitNextMillis(currentTimestamp: number) {
		let timestamp = Date.now();
		while (timestamp <= currentTimestamp) {
			timestamp = Date.now();
		}
		return timestamp;
	}
}