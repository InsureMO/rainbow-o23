import {Inject, LoggerService} from '@nestjs/common';
import {Config, PipelineOptions} from '@rainbow-o23/n1';
import {WINSTON_MODULE_NEST_PROVIDER} from 'nest-winston';
import {BootstrapOptions, getBootstrapOptions} from './bootstrap-options';

export abstract class AbstractController {
	public constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {
	}

	protected getLogger(): LoggerService {
		return this.logger;
	}

	protected getConfig(): Config {
		return this.getBootstrapOptions().getConfig();
	}

	protected getBootstrapOptions(): BootstrapOptions {
		return getBootstrapOptions();
	}

	protected buildPipelineOptions(): Pick<PipelineOptions, 'config' | 'logger'> {
		return {config: this.getConfig(), logger: this.getLogger()};
	}
}