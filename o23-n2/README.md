![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![Nest](https://img.shields.io/badge/nest-white.svg?logo=nestjs&logoColor=E0234E&style=social)

![Module Formats](https://img.shields.io/badge/module%20formats-cjs-green.svg)

# o23/n2

In simple terms, `o23/n2` is a tool that publishes a given pipeline as a web application using [NestJS](https://nestjs.com/). In this
module, we handle the following tasks:

- Registering all pipelines and exposing the specified ones as REST APIs,
- Redirecting logs to standard web log output,
- Providing standard error handling, where all errors will be caught and processed uniformly,
- Providing a health check API and a version API,
- Providing a standard pipeline invocation API. Please note that this API is fully compatible with all data processing pipelines but not
  with file processing pipelines.

## Request

Support request parsing as following:

- API path,
- Method,
- Request headers,
- Path parameters,
- Query string parameters,
- Files,
- Json body.

The thing to note is that when multiple types of request data are enabled, `o23/n2` will degrade and merge them into a single JSON object,
and each part has its own naming conventions as follows:

- Request headers: `headers`, or given names,
- Path parameters: `pathParams`, or given names,
- Query string parameters: `queryParams`, or given names,
- Files: `file` for single file, `files` for multiple files, or given names,
- Json body: `body`.

## Response

Support response outputs as following:

- Response headers,
- File download,
- Json body.

## APIs

### Health Check

```yaml
- URL: /
- Method: Get
- Response: { up: true, message: 'Hello there, I am OK now.' }
```

### App Version

```yaml
- URL: /version
- Method: Get
- Response: { version: 'UNDOCUMENTED', builtAt: 'UNDOCUMENTED' }
```

### Pipeline Trigger

```yaml
- URL: /pipeline
- Method: Post
- Request: { code: 'string'; payload: 'any' }
- Response: 'any'
```

> The specific data format for the request payload and response depends on the pipeline that needs to be executed.

> Referring to the example in `o23/scaffold` on how to build an application based on `o23/n2`, won't go into detail here.

## Environment Parameters

| Name                                                  | Type    | Default Value                      | Comments                                            |
|-------------------------------------------------------|---------|------------------------------------|-----------------------------------------------------|
| `app.port`                                            | number  | 3100                               | Application server port.                            |
| `app.context`                                         | string  | /o23                               | Application api context.                            |
| `app.name`                                            | string  | O23-N99                            | Application name.                                   |
| `app.provider`                                        | string  | Rainbow Team                       | Application provider.                               |
| `app.version`                                         | string  | UNDOCUMENTED                       | Application build version.                          |
| `app.built.at`                                        | string  | UNDOCUMENTED                       | Application build time.                             |
| `app.auth.enabled`                                    | boolean | false                              | Enable authentication.                              |
| `app.auth.pipeline`                                   | string  | Authenticate                       | Pipeline code for authentication and authorization. |
| `app.body.json.max.size`                              | string  | 50mb                               | Request maximum body size, for json body.           |
| `app.body.urlencoded.max.size`                        | string  | 50mb                               | Request maximum body size, for urlencoded body.     |
| `app.cors.enabled`                                    | boolean | false                              | Enable cors.                                        |
| `app.cors.options`                                    | json    |                                    | `CorsOptions` of `@nestjs/common`.                  |
| `logger.file.enabled`                                 | boolean | false                              | Enable file log.                                    |
| `logger.file.rotate.enabled`                          | boolean | true                               | Enable rotate file log.                             |
| `logger.error.file`                                   | string  | logs/error-%DATE%.log              | Error log file.                                     |
| `logger.error.level`                                  | string  | error                              | Logger level for error log file.                    |
| `logger.error.json`                                   | boolean | true                               | Use json format.                                    |
| `logger.error.date.pattern`                           | string  | YYYY-MM-DD                         | Error log file date pattern.                        |
| `logger.error.zipped.archive`                         | boolean | false                              | Enabled zip for error log file.                     |
| `logger.error.max.files`                              | string  | 30d                                | Error log file keeping time.                        |
| `logger.error.max.size`                               | string  | 10m                                | Error log file maximum size.                        |
| `logger.combined.file`                                | string  | logs/combined-%DATE%.log           | Standard log file.                                  |
| `logger.combined.level`                               | string  | log                                | Logger level for standard log file.                 |
| `logger.combined.json`                                | boolean | true                               | Use json format.                                    |
| `logger.combined.date.pattern`                        | string  | YYYY-MM-DD                         | Standard log file date pattern.                     |
| `logger.combined.zipped.archive`                      | boolean | false                              | Enabled zip for standard log file.                  |
| `logger.combined.max.files`                           | string  | 7d                                 | Standard log file keeping time.                     |
| `logger.combined.max.size`                            | string  | 10m                                | Standard log file maximum size.                     |
| `logger.console.enabled`                              | boolean | false                              | Enable console log.                                 |
| `logger.console.level`                                | string  | debug                              | Logger level for console log.                       |
| `app.schedule.enabled`                                | boolean | false                              | Enable schedule.                                    |
| `app.schedule.on.cluster`                             | boolean | false                              | Enable schedule on cluster, usually on production.  |
| `app.schedule.max.interval.no.cluster.lock`           | number  | 3600                               | Maximum interval for schedule without cluster lock. |
| `app.schedule.obtain.cluster.execution.lock.pipeline` | string  | ScheduleObtainClusterExecutionLock | Pipeline code for obtaining cluster execution lock. |
| `app.schedule.job.log.persist`                        | boolean | false                              | Enable scheduled job log persist.                   |
| `app.schedule.job.create.pipeline`                    | string  | ScheduleCreateJob                  | Pipeline code for creating scheduled job log.       |
| `app.schedule.job.result.write.pipeline`              | string  | ScheduleWriteJobResult             | Pipeline code for writing scheduled job result.     |
