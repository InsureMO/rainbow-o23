import {Injectable, Provider} from '@nestjs/common';
import {ScheduleService} from '../abstract-scheduler';
import {DynamicModulePipeline, ScheduledModulePipeline} from './types';

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
