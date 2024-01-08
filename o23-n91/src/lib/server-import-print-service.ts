import {BootstrapOptions} from '@rainbow-o23/n2';
import {StepBuilders} from '@rainbow-o23/n4';
import {PrintPdfPipelineStepBuilder} from '@rainbow-o23/n5';
import {PrintCsvPipelineStepBuilder, PrintExcelPipelineStepBuilder} from '@rainbow-o23/n6';
import {ServerPipelineStepRegistrar} from '@rainbow-o23/n90';

export const importPrintService = (options: BootstrapOptions) => {
	if (options.getEnvAsBoolean('app.plugins.print', false)) {
		StepBuilders.register('print-pdf', PrintPdfPipelineStepBuilder);
		StepBuilders.register('print-csv', PrintCsvPipelineStepBuilder);
		StepBuilders.register('print-excel', PrintExcelPipelineStepBuilder);
	}
};

ServerPipelineStepRegistrar.register(importPrintService);
