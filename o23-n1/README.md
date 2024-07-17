![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![Module Formats](https://img.shields.io/badge/module%20formats-cjs-green.svg)

# o23/n1

The `o23/n1` module provides two parts of implementation:

- The pipeline and pipeline steps, along with their unified registry.
- The basic building blocks, including environment variable retrieval, logging, and exception definitions.

## Pipeline and Pipeline Steps

An application may allow for multiple pipelines to exist, so each pipeline will have a globally unique code to identify it. The pipeline
interface also provides an execution API, which fundamentally does not care about the specific format of the incoming and outgoing data, nor
the internal execution logic. Therefore, the pipeline interface is a higher-order definition, and the interface itself may not even be
concerned with the internal execution mechanism.

> Make sure that all pipelines and pipeline steps are stateless, so that singletons can be used to save the time of creating instances.

```typescript
export interface PipelineRequest<C = PipelineRequestPayload> {
	payload: C;
	traceId?: string;
}

export interface PipelineResponse<C = PipelineResponsePayload> {
	payload: C;
}

export interface Pipeline<In = any, Out = any> {
	/**
	 * code should be unique globally
	 */
	getCode(): PipelineCode;

	/**
	 * perform pipeline
	 */
	perform(request: PipelineRequest<In>): Promise<PipelineResponse<Out>>;
}
```

To facilitate tracking of the execution logic, the pipeline provides a context object that includes one `traceId` for tracing the execution
logs of the entire pipeline.

In fact, the execution of a pipeline depends on its pipeline steps. A pipeline can contain one or more steps. Therefore, `o23/n1` also
provides an implementation of AbstractPipeline. By implementing this abstract class and providing constructors for pipeline steps, you can
obtain a fully executable pipeline class and use it for execution.

```typescript
export interface PipelineStepBuilder {
	create(options?: PipelineStepOptions): Promise<PipelineStep>;
}

export abstract class AbstractPipeline<In = any, Out = any> implements Pipeline<In, Out> {
	// ...
	protected abstract getStepBuilders(): Array<PipelineStepBuilder>;

	// ...
}
```

To conveniently implement a pipeline class, `o23/n1` provides a way to construct a pipeline based on static pipeline step classes, as
follows:

```typescript
export interface PipelineStepType<S = PipelineStep> extends Function {
	new(options?: PipelineStepOptions): S;
}

export class DefaultPipelineStepBuilder implements PipelineStepBuilder {
	public constructor(protected readonly step: PipelineStepType) {
	}

	public async create(options?: PipelineStepOptions): Promise<PipelineStep> {
		return new this.step(options);
	}
}

export abstract class AbstractStaticPipeline<In = any, Out = any> extends AbstractPipeline<In, Out> {
	protected abstract getStepTypes(): Array<PipelineStepType>;

	protected getStepBuilders(): Array<PipelineStepBuilder> {
		return this.getStepTypes().map(type => new DefaultPipelineStepBuilder(type));
	}
}
```

Here is a simple implementation of a pipeline. You can find the corresponding code in the `o23/scaffold` module.

```typescript
export class SimplePipelineStep1 extends AbstractPipelineStep<number, number> {
	public perform(request: PipelineStepData<number>): Promise<PipelineStepData<number>> {
		this.debug(() => `Perform (${request.content} + 100)`);
		return Promise.resolve({content: request.content + 100});
	}
}

export class SimplePipelineStep2 extends AbstractPipelineStep<number, number> {
	public perform(request: PipelineStepData<number>): Promise<PipelineStepData<number>> {
		this.debug(() => `Perform (${request.content} * 2)`);
		return Promise.resolve({content: request.content * 2});
	}
}

export class SimplePipeline extends AbstractStaticPipeline<number, number> {
	public getCode(): PipelineCode {
		return 'SimplePipeline';
	}

	protected getStepTypes(): Array<PipelineStepType> {
		return [SimplePipelineStep1, SimplePipelineStep2];
	}
}
```

### Function Support

Pipeline steps provide rich function support, and all the following functions or instances can be obtained from the `getHelpers` function.

| Syntax                                                                   | Comments                                                                                                                                                                                                             |
|--------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| $config                                                                  | Get config instance.                                                                                                                                                                                                 |
| $logger                                                                  | Get logger instance.                                                                                                                                                                                                 |
| $date.now()                                                              | Get current datetime, as string.                                                                                                                                                                                     |
| $date.dayjs                                                              | Get [Day.js](https://day.js.org/).                                                                                                                                                                                   |
| $nano(size?: number)                                                     | Create a nano string.                                                                                                                                                                                                |
| $ascii(size?: number)                                                    | Create a nano string, only contains ascii characters (0-9, a-z, A-Z, _).                                                                                                                                             |
| $error(options: PipelineStepErrorOptions)                                | Throw an exposed uncatchable error.                                                                                                                                                                                  |
| $errors.catchable(options: Omit<PipelineStepErrorOptions, 'status'>)     | Throw a catchable error.                                                                                                                                                                                             |
| $errors.isCatchable(e: any)                                              | Check if given is a catchable error.                                                                                                                                                                                 |
| $errors.exposed(options: PipelineStepErrorOptions)                       | Throw an exposed uncatchable error, same as `$helpers.error`.                                                                                                                                                        |
| $errors.isExposed(e: any)                                                | Check if given is an exposed uncatchable error.                                                                                                                                                                      |
| $errors.catchable(uncatchable: Omit<PipelineStepErrorOptions, 'status'>) | Throw an uncatchable error.                                                                                                                                                                                          |
| $errors.isUncatchable(e: any)                                            | Check if given is an uncatchable error.                                                                                                                                                                              |
| $file(options: PipelineStepFileOptions) => PipelineStepFile              | Create a file instance by given options.                                                                                                                                                                             |
| $clearContextData()                                                      | If the pipeline step does not return anything or returns null or undefined, the context will continue to be used without any modifications.<br>So returning this semaphore indicates clearing the step content data. |
| isEmpty: (value: any)                                                    | Check if given value is empty or not. Empty includes null value, empty string, array and array likes, map, set and object without keys.                                                                              |
| isNotEmpty: (value: any)                                                 | Check if given value is not empty or not.                                                                                                                                                                            |
| isBlank: (value: any)                                                    | Check if given value is blank or not. Blank means null value or a string has no length after trimming.                                                                                                               |
| isNotBlank: (value: any)                                                 | Check if given value is not blank or not.                                                                                                                                                                            |
| trim: (value: any)                                                       | Try to trim a string, it's null safe, returns empty string when given value is null. Make sure given value is null or a string, otherwise an exception raised.                                                       |

For example:

```typescript
const currentTime = this.getHelpers().$date.now();
```

> Use `registerToStepHelpers(helpers: Record<string, any>)` to register your own helpers. Note that if there is a conflict between the name
> and the preset, the preset will take priority.

## Logger

`o23/n1` provides a standard logging implementation, which by default outputs to the console. You can obtain a logging instance through the
following way:

```typescript
import {createLogger, Logger} from '@rainbow-o23/n1';

const logger = createLogger();

class CustomLogger implements Logger {
	// your implemenation
}

// or use your own logger implementation, your logger should be an implemenation of Logger interface.
const customLogger = createLogger(new CustomLogger());
```

The log level of `o23/n1` ranges from low to high: debug, verbose, log, warn, and error, while the concept of free log classification is
also provided. Let's take a look at the following example:

```typescript
import {createLogger, Logger} from '@rainbow-o23/n1';

const logger = createLogger();

logger.debug('some log.');
logger.verbose('some verbose info.', {hello: 'world'});
logger.info('some info.', {hello: 'world'}, 'SomeCategory');
logger.warn('some warning.', 'SomeCategory');
logger.error('some error', new Error(), 'SomeCategory');
```

When the number of arguments in the log output function is more than one, and the last argument is of type string, the last argument is
considered as the log category. There are no restrictions on the category name. The log level and categories of the logging can be globally
controlled, or controlled at a more granular level with specific categories and levels. Here are some examples:

```typescript
import {EnhancedLogger} from '@rainbow-o23/n1';

// Note that when a log level is enabled, all log levels higher than that level will also be enabled. Conversely, when a log level is
// disabled, all log levels lower than that level will also be disabled.
EnhancedLogger.enableLevel('debug');
EnhancedLogger.disableLevel('info');

// Or on some category.
// All levels for given category are enabled.
EnhancedLogger.enable('SomeCategory');
EnhancedLogger.disable('SomeCategory');
// Enable or disable given category on appointed level.
// Note enable or disable category + level, will not impact other levels.
EnhancedLogger.enable('SomeCategory.debug');
EnhancedLogger.disable('SomeCategory.info');
```

## Config

`o23/n1` provides a Config object for reading system environment variables, as shown below:

```typescript
import {createConfig, createLogger} from '@rainbow-o23/n1';

let config = createConfig();

// Or use given logger
config = createConfig(createLogger());

config.getBoolean('pipeline.debug.log.enabled', true);
config.getString('app.version', 'UNDOCUMENTED');
config.getNumber('app.port', 3100);
```

The given environment variable name will be transformed into the following format: underscore-separated and prefixed with `CFG_`. It reads
from `process.env` and if not defined, it uses the provided default value (or returns `undefined` if no default value is given). Following
this mapping rule, the environment variable names in the example above should be as follows:

- `CFG_PIPELINE_DEBUG_LOG_ENABLED`,
- `CFG_APP_VERSION`,
- `CFG_APP_PORT`.

## Error

`o23/n1` defines three basic types of errors, namely `CatchableError`, `UncatchableError`, and `ExposedUncatchableError`. All errors will
have a code, and `o23`'s error code follows the format of `Oxx-xxxxx`. Here, Oxx represents the module, and the last five digits should be
numeric codes. For example, if the exception is defined in the `o23/n1` module, the code would be `O01`, such as `O01-00001`, `O01-99999`.
`ExposedUncatchableError` is a type of error specifically designed for web applications. In addition to the code and message, it also
includes an additional field called `status`, which represents the HTTP response status.

## Environment Parameters

| Name                               | Type    | Default Value       | Comments                                                                                                                                                                      |
|------------------------------------|---------|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `format.datetime`                  | string  | YYYY-MM-DD HH:mm:ss | Default datetime format, follows [Day.js](https://day.js.org/)                                                                                                                |
| `pipeline.debug.log.enabled`       | boolean | false               | Enable the pipeline debug log.                                                                                                                                                |
| `pipeline.performance.log.enabled` | boolean | false               | Enable the pipeline performance log, spent time of pipeline and pipeline step.<br>Translation: If `pipeline.debug.log.enabled` is true, this log output will also be enabled. |
