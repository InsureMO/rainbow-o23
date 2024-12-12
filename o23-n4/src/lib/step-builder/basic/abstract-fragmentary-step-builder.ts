import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions} from '@rainbow-o23/n3';
import {
	Def,
	ParsedPipelineStepDef,
	PipelineStepDef,
	PipelineStepReader,
	PipelineStepSetsDef,
	PipelineStepSetsReader
} from '../../reader';
import {redressSnippet, redressString} from '../utils';
import {AbstractPipelineStepBuilder, PipelineStepBuilderOptions} from './abstract-step-builder';

export type FragmentaryPipelineStepBuilderOptions = PipelineStepBuilderOptions & {
	fromInput?: FragmentaryPipelineStepOptions['fromRequest'];
	toOutput?: FragmentaryPipelineStepOptions['toResponse'];
	merge?: FragmentaryPipelineStepOptions['mergeRequest'];
	errorHandles?: {
		[K in keyof FragmentaryPipelineStepOptions['errorHandles']]: string | Array<PipelineStepDef | PipelineStepSetsDef>;
	};
};

export abstract class AbstractFragmentaryPipelineStepBuilder<G extends FragmentaryPipelineStepBuilderOptions, O extends FragmentaryPipelineStepOptions, S extends AbstractFragmentaryPipelineStep>
	extends AbstractPipelineStepBuilder<G, O, S> {
	protected isStepSets(def: Def): def is PipelineStepSetsDef {
		return def.type === 'step-sets';
	}

	protected readSubStep(def: PipelineStepDef | PipelineStepSetsDef): ParsedPipelineStepDef {
		if (this.isStepSets(def)) {
			return PipelineStepSetsReader.read(def);
		} else {
			return PipelineStepReader.read(def);
		}
	}

	protected readMoreOptions(given: G, transformed: O): O {
		transformed.fromRequest = redressSnippet(given.fromInput);
		transformed.toResponse = redressSnippet(given.toOutput);
		transformed.mergeRequest = typeof given.merge === 'string' ? redressString(given.merge) : given.merge;
		if (given.errorHandles != null) {
			transformed.errorHandles = Object.keys(given.errorHandles).reduce((handlers, key: keyof FragmentaryPipelineStepOptions['errorHandles']) => {
				const handle = given.errorHandles[key];
				if (handle == null) {
					// do nothing
				} else if (typeof handle === 'string') {
					handlers[key] = redressSnippet(handle);
				} else if (Array.isArray(handle)) {
					// steps
					// handlers[key] = handle;
					handlers[key] = handle.map(step => {
						const def = this.readSubStep(step);
						return def.def;
					});
				}
				return handlers;
			}, {});
		}
		return transformed;
	}
}
