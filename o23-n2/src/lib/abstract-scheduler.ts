import {Inject, LoggerService} from '@nestjs/common';
import {
	Config,
	ERR_PIPELINE_NOT_FOUND,
	Pipeline,
	PIPELINE_STEP_RETURN_NULL,
	PipelineOptions,
	PipelineRepository,
	UncatchableError
} from '@rainbow-o23/n1';
import {CronJob} from 'cron';
import dayjs, {Dayjs} from 'dayjs';
import {nanoid} from 'nanoid';
import {WINSTON_MODULE_NEST_PROVIDER} from 'nest-winston';
import {BootstrapOptions, getBootstrapOptions} from './bootstrap-options';
import {ScheduledModulePipeline} from './dynamic-module';
import {ERR_DUPLICATE_SCHEDULER, ERR_NO_SCHEDULER_FOUND} from './error-codes';

export const NO_SCHEDULER_FOUND = (schedulerName: string, name?: string) => {
	return `No ${schedulerName} was found with the given name (${name ?? ''}). Check your configuration.`;
};

export const DUPLICATE_SCHEDULER = (schedulerName: string, name: string) => {
	return `${schedulerName} with the given name (${name}) already exists. Ignored.`;
};

/**
 * copy from @nestjs/schedule, remove intervals and timeouts supporting
 */
export class SchedulerRegistry {
	private readonly cronJobs = new Map<string, CronJob>();

	constructor(private readonly logger: LoggerService) {
	}

	public exists(name: string) {
		return this.cronJobs.has(name);
	}

	public getCronJob(name: string) {
		const ref = this.cronJobs.get(name);
		if (!ref) {
			throw new UncatchableError(ERR_NO_SCHEDULER_FOUND, NO_SCHEDULER_FOUND('Cron Job', name));
		}
		return ref;
	}

	public addCronJob(name: string, job: CronJob) {
		const ref = this.cronJobs.get(name);
		if (ref) {
			throw new UncatchableError(ERR_DUPLICATE_SCHEDULER, DUPLICATE_SCHEDULER('Cron Job', name));
		}

		job.fireOnTick = this.wrapFunctionInTryCatchBlocks(job.fireOnTick, job);
		this.cronJobs.set(name, job);
	}

	public getCronJobs(): Map<string, CronJob> {
		return this.cronJobs;
	}

	public deleteCronJob(name: string) {
		const cronJob = this.getCronJob(name);
		cronJob.stop();
		this.cronJobs.delete(name);
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	private wrapFunctionInTryCatchBlocks(methodRef: Function, instance: object): (...args: unknown[]) => Promise<void> {
		return async (...args: unknown[]) => {
			try {
				await methodRef.call(instance, ...args);
			} catch (error) {
				this.logger.error(error);
			}
		};
	}
}

export interface JobResult {
	/** created when job log needs to be persisted. otherwise is undefined */
	id?: string;
	jobCode: string;
	/** success and failed are predefined, others are custom */
	code: 'success' | 'failed' | string;
	message?: string;
	errorStack?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload?: any;
	jobTraceId?: string;
	startedAt: Dayjs;
	fulfilledAt: Dayjs;
}

export abstract class ScheduleService {
	private readonly registry: SchedulerRegistry;
	protected readonly enabled: boolean;
	protected readonly onCluster: boolean;
	protected readonly maxIntervalNoClusterLock: number;
	protected readonly obtainClusterExecutionLockPipelineCode: string;
	protected readonly persistJobLog: boolean;
	protected readonly createJobPipelineCode: string;
	protected readonly writeJobResultPipelineCode: string;

	constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) protected readonly logger: LoggerService) {
		this.registry = new SchedulerRegistry(logger);
		this.enabled = this.getConfig().getBoolean('app.schedule.enabled', true);
		this.onCluster = this.getConfig().getBoolean('app.schedule.on.cluster', false);
		this.maxIntervalNoClusterLock = this.getConfig().getNumber('app.schedule.max.interval.no.cluster.lock', 3600);
		this.obtainClusterExecutionLockPipelineCode = this.getConfig().getString('app.schedule.obtain.cluster.execution.lock', 'ScheduleObtainClusterExecutionLock');
		this.persistJobLog = this.getConfig().getBoolean('app.schedule.job.log.persist', false);
		this.createJobPipelineCode = this.getConfig().getString('app.schedule.job.create', 'ScheduleCreateJob');
		this.writeJobResultPipelineCode = this.getConfig().getString('app.schedule.job.result.write.pipeline', 'ScheduleJobResultWrite');
		if (this.enabled) {
			this.initialize();
		}
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

	protected async acquirePipeline(code: string): Promise<Pipeline> {
		const pipeline = await PipelineRepository.findPipeline(code, this.buildPipelineOptions());
		if (pipeline == null) {
			throw new UncatchableError(ERR_PIPELINE_NOT_FOUND, `Pipeline[code=${code}] for cron job not found.`);
		}
		return pipeline;
	}

	protected async obtainClusterExecutionLock(code: string, executedAt: Dayjs, nextExecutionTime: Dayjs): Promise<boolean> {
		if (!this.onCluster) {
			// no cluster, no need to lock
			return true;
		}
		const interval = nextExecutionTime.diff(executedAt, 'second');
		if (interval <= this.maxIntervalNoClusterLock) {
			// no need to obtain cluster lock
			return true;
		}
		try {
			const pipeline = await this.acquirePipeline(this.obtainClusterExecutionLockPipelineCode);
			const result = await pipeline.perform({payload: {code, startedAt: executedAt}});
			const {payload = true} = result ?? {};
			// not false, treated as true
			return payload !== false;
		} catch (e) {
			this.logger.error(e);
			return false;
		}
	}

	protected async createJob(code: string, traceId: string, executedAt: Dayjs): Promise<string | undefined> {
		if (!this.persistJobLog) {
			return (void 0);
		}
		try {
			const pipeline = await this.acquirePipeline(this.createJobPipelineCode);
			const result = await pipeline.perform({payload: {code, executedAt}, traceId});
			const {payload} = result;
			return payload as string;
		} catch (e) {
			// ignore it.
			this.logger.error(`Failed to persist cron job[code=${code}, traceId=${traceId}].`, e);
			throw e;
		}
	}

	protected async writeJobResult(result: JobResult): Promise<void> {
		if (!this.persistJobLog) {
			return (void 0);
		}
		try {
			const pipeline = await this.acquirePipeline(this.writeJobResultPipelineCode);
			await pipeline.perform({payload: result});
		} catch (e) {
			// ignore it.
			this.logger.error(e);
		}
	}

	public addJob(def: ScheduledModulePipeline) {
		this.addCronJob(def);
		this.logger.log(`Job ${def.code} added!`, 'ScheduleService');
	}

	public addCronJob(def: ScheduledModulePipeline) {
		const context = {
			code: def.code
		};
		const job = CronJob.from({
			cronTime: def.schedule,
			onTick: async () => {
				const traceId = nanoid(16);
				const now = dayjs();
				const nextExecutionTime = dayjs(job.nextDate().toJSDate());
				this.logger.log(`Cron job[code=${context.code}, traceId=${traceId}] ticked.`);
				const lock = await this.obtainClusterExecutionLock(context.code, now, nextExecutionTime);
				if (!lock) {
					// lock not obtained
					this.logger.log(`Cron job[code=${context.code}, traceId=${traceId}] cluster execution lock not obtained, ignore this round.`);
					return;
				}
				// create job
				const id = await this.createJob(context.code, traceId, now);
				try {
					// execute job
					const pipeline = await this.acquirePipeline(context.code);
					const result = await pipeline.perform({payload: {startedAt: now}, traceId});
					const {payload} = result ?? {};
					// write result
					if (payload === PIPELINE_STEP_RETURN_NULL || payload == null) {
						// success
						await this.writeJobResult({
							id, jobCode: context.code, code: 'success',
							startedAt: now, fulfilledAt: dayjs(), jobTraceId: traceId
						});
					} else if (typeof payload === 'object') {
						// read from payload, and write to result
						const {code, message, errorStack, ...rest} = payload;
						await this.writeJobResult({
							id, code: code || 'success', message, errorStack,
							payload: rest,
							jobCode: context.code,
							startedAt: now, fulfilledAt: dayjs(), jobTraceId: traceId
						});
					} else if (typeof payload === 'string') {
						// treat payload as result code
						await this.writeJobResult({
							id, code: payload || 'success',
							jobCode: context.code,
							startedAt: now, fulfilledAt: dayjs(), jobTraceId: traceId
						});
					}
					this.logger.log(`Cron job[code=${context.code}, traceId=${traceId}] completed.`);
				} catch (e) {
					this.logger.error(e);
					this.logger.error(`Cron job[code=${context.code}, traceId=${traceId}] failed.`);
					await this.writeJobResult({
						id, jobCode: context.code,
						code: 'failed', message: e.message, errorStack: e.stack,
						startedAt: now, fulfilledAt: dayjs(), jobTraceId: traceId
					});
				}
			},
			start: true
		});

		this.registry.addCronJob(def.code, job);
	}

	public deleteCronJob(pipelineCode: string) {
		this.registry.deleteCronJob(pipelineCode);
		this.logger.warn(`Cron job ${pipelineCode} deleted!`);
	}

	public exists(pipelineCode: string): boolean {
		return this.registry.exists(pipelineCode);
	}

	public getCronJob(pipelineCode: string) {
		return this.registry.getCronJob(pipelineCode);
	}

	public getCronJobs(): Readonly<Map<string, CronJob>> {
		return new Map(this.registry.getCronJobs());
	}
}
