import {createConfig} from '@rainbow-o23/n1';
import {Bootstrap, BootstrapOptions} from '@rainbow-o23/n2';
import {registerExampleModules} from './examples';

// to enable the console log
// process.env.CFG_LOGGER_CONSOLE_ENABLED = 'true';
// process.env.CFG_PIPELINE_DEBUG_LOG_ENABLED = 'true';
// to enable examples
process.env.CFG_APP_EXAMPLES_ENABLED = 'true';

// create bootstrap options
const options = new BootstrapOptions(createConfig());
registerExampleModules(options);

// launch server
// noinspection JSIgnoredPromiseFromCall
Bootstrap.launch(options);
