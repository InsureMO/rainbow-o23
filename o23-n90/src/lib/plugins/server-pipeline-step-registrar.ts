import {BootstrapOptions} from '@rainbow-o23/n2';

export type ServerPipelineStepRegisterFunc = (options: BootstrapOptions) => void;

export class ServerPipelineStepRegistrar {
	private static readonly REGISTERS: Array<ServerPipelineStepRegisterFunc> = [];

	private constructor() {
		// avoid extend
	}

	public static register(register: ServerPipelineStepRegisterFunc): void {
		ServerPipelineStepRegistrar.REGISTERS.push(register);
	}

	public static registerAll(options: BootstrapOptions): void {
		for (const register of ServerPipelineStepRegistrar.REGISTERS) {
			register(options);
		}
	}
}
