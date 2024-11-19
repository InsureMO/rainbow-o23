export const StaticImplements = <T>() => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	return <U extends T>(_constructor: U) => {
		// since only one static method, no need to execute constructor anymore
		// constructor;
	};
};
