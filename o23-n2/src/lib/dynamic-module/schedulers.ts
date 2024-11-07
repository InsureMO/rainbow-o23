import {Injectable, LoggerService, Provider} from '@nestjs/common';
import {SchedulerRegistry} from '@nestjs/schedule';
import {Config, PipelineOptions} from '@rainbow-o23/n1';
import {CronJob} from 'cron';
import {BootstrapOptions, getBootstrapOptions} from '../bootstrap-options';
import {DynamicModulePipeline, ScheduledModulePipeline} from './types';

export abstract class ScheduleService {
	constructor(protected readonly schedulerRegistry: SchedulerRegistry,
	            protected readonly logger: LoggerService) {
		this.initialize();
	}

	protected abstract initialize(): void;

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

	public addJob(def: ScheduledModulePipeline) {
		this.logger.log(`Job ${def.code} added!`, 'ScheduleService');
	}

	public addCronJob(def: ScheduledModulePipeline) {
		const job = new CronJob(def.schedule, () => {
			this.logger.log(`Cron job ${def.code} ticked.`, 'ScheduleService');
		}, () => {
			this.logger.log(`Cron job ${def.code} completed.`, 'ScheduleService');
		});

		this.schedulerRegistry.addCronJob(def.code, job);
		job.start();
	}

	protected deleteCronJob(pipelineCode: string) {
		this.schedulerRegistry.deleteCronJob(pipelineCode);
		this.logger.warn(`Cron job ${pipelineCode} deleted!`);
	}
}

export class DynamicModuleScheduler {
	// noinspection JSUnusedLocalSymbols
	private constructor() {
		// avoid extend
	}

	static createSchedulerProvider(pipelines: Array<DynamicModulePipeline>): Provider {
		const scheduled = pipelines
			.map(p => p as unknown as ScheduledModulePipeline)
			.filter(p => p.schedule != null && p.schedule.trim().length > 0);
		const ScheduleServiceClass = class extends ScheduleService {
			protected initialize(): void {
				scheduled.forEach(def => this.addJob(def));
			}
		};
		Object.defineProperty(ScheduleServiceClass, 'name', {value: 'DynamicScheduleService'});
		Reflect.decorate([Injectable()], ScheduleServiceClass, void 0, void 0);
		return ScheduleServiceClass;
	}
}
