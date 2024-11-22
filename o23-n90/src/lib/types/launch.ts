import {ExtendedBootstrapOptions} from '../init';

export type BeforeDoPipelineInitialization = (options: ExtendedBootstrapOptions) => Promise<void>;
export type BeforeDoServerLaunch = (options: ExtendedBootstrapOptions) => Promise<void>;
