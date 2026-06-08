import {launchScripts} from '@rainbow-o23/n90';

// noinspection JSIgnoredPromiseFromCall
launchScripts();

// To capture and report errors during scripts deployment,
// use the manual initialization flow below instead of `launchScripts()`:

// import {EnvironmentInitializer, ScriptsPipelineInitializer, TypeOrmInitializer} from '@rainbow-o23/n90';
//
// const console = global.console;
// const errors: Array<any> = [];
// const CustomConsole = new Proxy(console, {
// 	get: (target, property, receiver) => {
// 		if (property === 'error') {
// 			const error = Reflect.get(target, property, receiver);
// 			// @ts-ignore
// 			if (target.$$console == null) {
// 				// @ts-ignore
// 				target.$$console = function (...args: Array<any>) {
// 					const messageOrError: string | Error = args[args.length - 1];
// 					if (messageOrError != null) {
// 						errors.push(messageOrError);
// 					}
// 					error.apply(this, args);
// 				};
// 			}
// 			// @ts-ignore
// 			return target.$$console;
// 		} else {
// 			return Reflect.get(target, property, receiver);
// 		}
// 	}
// });
//
// // noinspection JSIgnoredPromiseFromCall
// (async () => {
// 	global.console = CustomConsole;
// 	// await launchScripts();
// 	const bootstrapOptions = await new EnvironmentInitializer().load();
// 	await new TypeOrmInitializer().load(bootstrapOptions);
// 	await new ScriptsPipelineInitializer().load(bootstrapOptions);
//
// 	global.console = console;
// 	if (errors.length > 0) {
// 		for (const error of errors) {
// 			if (typeof error === 'string') {
// 				console.error(JSON.stringify({message: error}));
// 			} else if (error instanceof Error) {
// 				console.error(JSON.stringify({message: error.message, stack: error.stack}));
// 			} else {
// 				console.error(error);
// 			}
// 		}
// 		process.exit(1);
// 	} else {
// 		process.exit(0);
// 	}
// })();
