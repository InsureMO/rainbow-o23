import {PipelineStepReader} from './pipeline-step-reader';
import {PipelineStepSetsReader} from './pipeline-step-sets-reader';
import {Def, ParsedPipelineStepDef, PipelineStepDef, PipelineStepSetsDef} from './types';

export class SubStepsReader {
	private static isStepSets(def: Def): def is PipelineStepSetsDef {
		return def.type === 'step-sets';
	}

	public static readSubStep(def: PipelineStepDef | PipelineStepSetsDef): ParsedPipelineStepDef {
		if (SubStepsReader.isStepSets(def)) {
			return PipelineStepSetsReader.read(def);
		} else {
			return PipelineStepReader.read(def);
		}
	}
}