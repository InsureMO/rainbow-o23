![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![Nest](https://img.shields.io/badge/nest-white.svg?logo=nestjs&logoColor=E0234E&style=social)
![dotenv](https://img.shields.io/badge/dotenv-white.svg?logo=dotenv&logoColor=ECD53F&style=social)

![Puppeteer](https://img.shields.io/badge/Puppeteer-white.svg?logo=puppeteer&logoColor=40B5A4&style=social)
![ExcelJS](https://img.shields.io/badge/ExcelJS-white.svg?logo=microsoftexcel&logoColor=217346&style=social)
![CSV for Node.js](https://img.shields.io/badge/CSV%20for%20Node.js-548694.svg)
![Docx-templates](https://img.shields.io/badge/Docx--templates-white.svg?logo=microsoftword&logoColor=2B579A&style=social)

![Amazon S3](https://img.shields.io/badge/Amazon%20S3-white.svg?logo=amazons3&logoColor=569A31&style=social)

![TypeORM](https://img.shields.io/badge/TypeORM-E83524.svg)
![MySQL](https://img.shields.io/badge/MySQL-white.svg?logo=mysql&logoColor=4479A1&style=social)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-white.svg?logo=postgresql&logoColor=4169E1&style=social)
![MSSQL](https://img.shields.io/badge/MSSQL-white.svg?logo=microsoftsqlserver&logoColor=CC2927&style=social)
![Oracle](https://img.shields.io/badge/Oracle-white.svg?logo=oracle&logoColor=F80000&style=social)

![Module Formats](https://img.shields.io/badge/module%20formats-cjs-green.svg)

# o23/n99

`o23/n99` is a web application which already includes the following contents:

- Server base on `o23/n90`,
- Print service base on `o23/n91`.

# Initialization

## Configurations

All necessary configurations have been created and can be found in the `/envs` directory. It is important to note that there are numerous
configuration options for starting the service, and their specific meanings can be found in the corresponding documentation of other
submodules under `o23`. For example, if there is a configuration item called `CFG_APP_VERSION`, you can look up the explanation
for `app.version` and find it under `o23/n2`.

### Basic Configurations

The basic configuration is located in the `/envs/common/.basic` file. We suggest that you make modifications based on the following
recommendations:

- Modify the following configuration items with your own context:
	- `CFG_APP_NAME`: Change to your application name,
	- `CFG_APP_PROVIDER`: Change to your team name,
	- `CFG_APP_PORT`: Change to your desired startup port,
	- `CFG_APP_CONTEXT`: Change to your service URL context,
- For local development, modify the following configuration items to enhance the experience:
	- `CFG_LOGGER_ERROR_JSON`: Change from `true` to `false`,
	- `CFG_LOGGER_COMBINED_JSON`: Change from `true` to `false`,
	- `CFG_LOGGER_COMBINED_LEVEL`: Change from `log` to `debug`,
- During each release, use your CI script to modify the following configuration items:
	- `CFG_APP_PORT`: Change to your desired startup port,
	- `CFG_APP_VERSION`: Change to the exact version number you are releasing,
	- `CFG_APP_BUILT_AT`: Change to the exact date of your release.

### Database Configurations

The server configuration is located in the `/envs/dev/.datasources` file. Please modify according to your database configuration. Please
note that the database name must remain unique, otherwise it may result in unexpected data errors.

### Scripts Configurations

The scripts configuration is located in the `/envs/dev/.scripts` file. For scripts execution before starting the application service, if you
haven't modified the directory structure, there is no specific
modification required.

### Server Configurations

The server configuration is located in the `/envs/dev/.server` file. Generally, local development should include examples. Therefore, when
you deploy to a real service environment, you can modify the following configuration items:

- `CFG_APP_EXCLUDED_PIPELINES_DIRS`: Remove the comment prefix for this configuration item and exclude the Pipelines under `02-api-test`
  from the startup scope,
- `CFG_APP_EXAMPLES_ENABLED`: Change it to `false` to exclude the tutorial examples from the startup scope.

## Upgrade Recommendations

Currently, `o23` does not provide a way to upgrade, so please do not change any existing directory structure, including the following
directories:

- `db-scripts`: it is recommended to start numbering the directory names from `100-` for better differentiation,
- `scripts`: the files in this directory theoretically do not need to be modified,
- `server`: it is recommended to start numbering the directory names from `100-` for better differentiation
- `src`: free to add new source files, but please restrict the references to the `scripts.ts` and `server.ts` files.

If you follow the above rules, upgrading only requires obtaining the relevant files from the latest Github repository and replacing them.

## YAML Reader

Property value of yaml could be use `env:` prefix to identify environment variable, for example:

```yaml
- name: Load Scripts
  use: scripts-load-files
  dir: "env:app.db.scripts.dir"
  from-input: $factor.db.type
```

# Pipeline Configuration

In general, pipelines are divided into two types:

- Providing a publicly accessible REST API,
- Providing internal processing logic.

Pipelines are stored in the following locations:

- `/scripts` directory,
- `/server` directory,
- `T_O23_PIPELINE_DEFS` table,
- Alternatively, relevant configuration tables such as the pre-printing Pipeline can be found in `T_O23_PRINT_TEMPLATES`.

Essentially, exposing a pipeline as a Rest API is simply adding Rest API-related definitions to the standard pipeline, while the execution
logic of the pipeline remains the same. However, due to the specific nature of Rest Requests and Responses, we still need to pay special
attention to some differences between them and the standard pipeline. We will provide detailed explanations for both in the following
sections.

> Please note that specific-purpose pipelines will not be exposed as Rest APIs, even if they hold the necessary configuration information
> for Rest APIs. For example, the pre-printing pipeline will only be executed before printing and cannot be directly called via Rest API.

Currently, all pipeline and step configurations supported by `o23` are based on the YAML format.

## Standard Pipeline Configuration

A standard pipeline usually has three attributes:

| Attribute | Type     | Description                                                                                                                                 |
|-----------|----------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `code`    | `string` | The unique code of the pipeline, which must be unique across the system. This code is used by the system for identification and invocation. |
| `type`    | `string` | Must be `pipeline`.                                                                                                                         |
| `steps`   | `array`  | An array used to describe the step definitions of the pipeline.                                                                             |

In reality, a pipeline is an organic combination of a group of steps, so the pipeline itself can be considered as a container, and its
actual execution logic is determined by the steps defined within it. Let's take a very simple example, where the purpose is to accept two
numbers and return their sum. We will use a script fragment step to implement this functionality, and for the sake of simplicity, we will
ignore the validation step for the input parameters in this example.

```yaml
code: Add2Numbers
type: pipeline
steps:
  - name: Add
    use: snippet
    snippet: $factor.one + $factor.another
```

In this example, the pipeline accepts a JSON formatted parameter, which contains two properties: `one` and `another`. The `Add`
step defines a snippet that adds the values of these two properties and returns the result.

## Rest API Pipeline Configuration

On top of the standard pipeline, there is a need to add a set of defined properties to determine how to receive data from an HTTP request
and how to return an HTTP response. This would include various components of the HTTP protocol.

| Attribute        | Type                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                |
|------------------|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `route`          | `string`                     | Similar to the general definition of a REST API, this route does not include the host, port, and context parts. Additionally, the query string part is not required to be included.                                                                                                                                                                                                                                        |
| `method`         | `string`                     | The HTTP method of the request, including `get`, `post`, `patch`, `delete`, `put`, please note that `options` is not included. Additionally, if it is a `get` request, the default behavior is not to include a request body. If it is necessary to parse the request body for `get` requests, `body: true` needs to be explicitly declared. For other methods, the parsing of the request body is automatically included. |
| `body`           | `boolean`                    | Whether to parse the request body part or not. Typically, the system determines this based on the `method`, but if the actual requirement is different from the default behavior, this property can be explicitly declared.                                                                                                                                                                                                |
| `headers`        | `boolean`, `string array`    | Whether to parse the request header part or not.                                                                                                                                                                                                                                                                                                                                                                           |
| `path-params`    | `boolean`, `string array`    | An array of path parameters, which are used to extract the parameters from the route url.                                                                                                                                                                                                                                                                                                                                  |
| `query-params`   | `boolean`, `string array`    | An array of query parameters, which are used to extract the parameters from the query string part of the route url.                                                                                                                                                                                                                                                                                                        |
| `files`          | `boolean`, `string`, `array` | An array of file parameters, which are used to extract the files from the request body.                                                                                                                                                                                                                                                                                                                                    |
| `expose-headers` | `map`                        | A map of headers to be exposed in the response. Key of map is header name, value of map is header value.                                                                                                                                                                                                                                                                                                                   |
| `expose-file`    | `boolean`                    | Whether to expose the file in the response, default is `false`.                                                                                                                                                                                                                                                                                                                                                            |

After parsing the HTTP request, the data will be passed to the Pipeline as a JSON object and the logic execution will begin. Before that, we
need to understand the format of this JSON object in different defining scenarios. The JSON object structure after parsing the HTTP request
entirely depends on how you define it. The parser will follow the following rules to assemble it:

- If there is only one attribute, the value of this attribute will be directly promoted to the JSON object itself.
- If there are more than one attribute, the JSON object will be organized according to the given attribute names.

We can observe the differences of JSON objects through the following examples:

- If we define a POST API without declaring any parameters, the request body will be parsed by default, and the JSON object will be the
  request body itself,
- If we define a POST API and declare `headers: true`, the JSON object will include both the `body` and `headers` properties,
- If we define a POST API and explicitly define `body: false` and `headers: true`, the JSON object will be an object containing all the
  request headers.

Here are the default attribute names for each property:

| Attribute Definition                | Property Name | 
|-------------------------------------|---------------|
| `body: true`, or default parse body | `body`        |
| `headers: true`                     | `headers`     |
| `path-params: true`                 | `pathParams`  |
| `query-params: true`                | `queryParams` |
| `files: true`                       | `files`       |

For `headers`, `path-params`, and `query-params`, you can obtain the parameter values by explicitly defining the parameter names you want to
receive. For example:

```yaml
route: /example/:id/:name
method: post
# to get connection and host headers
headers:
  - Connection
  - hoSt
# to get id and name path parameters
path-params:
  - id
  - name
# to get code query parameter
query-params:
  - code
```

In the above example, we will get the following object structure:

```typescript
// url should be like: http://localhost:3000/o23/example/10000/Joe?code=ABC

interface Request {
	body: any;  // depends on request body structure
	Connection: string | undefined;
	hoSt: string | undefined;
	id: string | undefined;
	name: string | undefined;
	code: string | undefined;
}
```

> Please note that request header name is case-insensitive, but the property name in the JSON object is case-sensitive.

For file upload, the definition is relatively more complex. There are multiple ways to define it to cater to different scenarios:

- To receive multiple files: `files: true`,
- To receive a single file with a given name: `files: someName`, which corresponds to the file with the name `someName`,
- To receive multiple files with a given name:
  ```yaml
  files:
    # name is mandatory
    - name: someName1
      # max-count is optional, and if not specified, it defaults to infinity
      max-count: 1
    - name: someName2
  ```
- To receive a single or multiple files and apply a common restriction on files:
  ```yaml
  files:
    # name is optional, and if not specified, it defaults to 'files', regardless of the actual number of files.
    name: someName
    # multiple is optional, and if not specified, it defaults to false. true only works when name is not specified.
    multiple: true
    # mime-type is optional, see https://docs.nestjs.com/techniques/file-upload#validators
    mime-type: image/jpeg
    # max-size is optional, in bytes
    max-size: 1024
  ```
- To receive single or multiple files and apply restriction separately:
  ```yaml
  files:
    names:
      # name is mandatory
      - name: someName1
        # max-count is optional, and if not specified, it defaults to infinity
        max-count: 1
      - name: someName2
    mime-type: image/jpeg
    max-size: 1024
  ```

The file object will also vary depending on the different definitions and can take the following forms (here, we will ignore the issue of
promotion due to the absence of other parameters):

- No name declared (using default name `files`): file object array,
- Name declared and only one file for this name: file object,
- Name declared and multiple files for this name: file object array.

The file object structure is [`Express.Multer.File`](https://www.npmjs.com/package/@types/multer?activeTab=code).

# Pipeline Step Configuration

A pipeline step is a unit of execution logic. It can be a script fragment, a function, or a pipeline. The following table lists the steps:

| Step Type                              | Extends From                       | Module    | Usage    | Description                                                                 |
|----------------------------------------|------------------------------------|-----------|----------|-----------------------------------------------------------------------------|
| `AbstractFragmentaryPipelineStep`      |                                    | `o23/n3`  | Abstract | Provide in, out, error handlers.                                            |
| `GetPropertyPipelineStep`              | `AbstractFragmentaryPipelineStep`  | `o23/n3`  | Standard | Get a property from the request payload.                                    |
| `DeletePropertyPipelineStep`           | `AbstractFragmentaryPipelineStep`  | `o23/n3`  | Standard | Delete a property from the request payload.                                 |
| `SnippetPipelineStep`                  | `AbstractFragmentaryPipelineStep`  | `o23/n3`  | Standard | Execute a script snippet.                                                   |
| `SnowflakePipelineStep`                | `AbstractFragmentaryPipelineStep`  | `o23/n3`  | Standard | Generate a snowflake number.                                                |
| `FetchPipelineStep`                    | `AbstractFragmentaryPipelineStep`  | `o23/n3`  | Standard | Fetch data from a remote server.                                            |
| `RefPipelinePipelineStep`              | `AbstractFragmentaryPipelineStep`  | `o23/n3`  | Standard | Execute a pipeline.                                                         |
| `RefStepPipelineStep`                  | `AbstractFragmentaryPipelineStep`  | `o23/n3`  | Standard | Execute a step.                                                             |
| `RoutesPipelineStepSets`               | `AbstractFragmentaryPipelineStep`  | `o23/n3`  | Standard | Execute a set of steps for each route, semantically equivalent to a switch. |
| `PipelineStepSets`                     | `AbstractFragmentaryPipelineStep`  | `o23/n3`  | Standard | Execute a set of steps.                                                     |
| `AsyncPipelineStepSets`                | `PipelineStepSets`                 | `o23/n3`  | Standard | Execute a set of steps asynchronously.                                      |
| `ConditionalPipelineStepSets`          | `PipelineStepSets`                 | `o23/n3`  | Standard | Execute a set of steps conditionally.                                       |
| `EachPipelineStepSets`                 | `PipelineStepSets`                 | `o23/n3`  | Standard | Execute a set of steps for each item in an array.                           |
| `ParallelPipelineStepSets`             | `PipelineStepSets`                 | `o23/n3`  | Standard | Execute a set of steps parallel.                                            |
| `AbstractTypeOrmPipelineStep`          | `AbstractFragmentaryPipelineStep`  | `o23/n3`  | Abstract | Provide TypeORM connection and transaction.                                 |
| `TypeOrmBySnippetPipelineStep`         | `AbstractTypeOrmPipelineStep`      | `o23/n3`  | Standard | Execute a snippet based on TypeORM connection.                              |
| `AbstractTypeOrmBySQLPipelineStep`     | `AbstractTypeOrmPipelineStep`      | `o23/n3`  | Abstract | Execute SQL statement.                                                      |
| `TypeOrmLoadOneBySQLPipelineStep`      | `AbstractTypeOrmBySQLPipelineStep` | `o23/n3`  | Standard | Execute SQL statement for loading one data, single record.                  |
| `TypeOrmLoadManyBySQLPipelineStep`     | `AbstractTypeOrmBySQLPipelineStep` | `o23/n3`  | Standard | Execute SQL statement for loading many data, multiple records.              |
| `TypeOrmSaveBySQLPipelineStep`         | `AbstractTypeOrmBySQLPipelineStep` | `o23/n3`  | Standard | Execute SQL statement for saving data.                                      |
| `TypeOrmBulkSaveBySQLPipelineStep`     | `AbstractTypeOrmBySQLPipelineStep` | `o23/n3`  | Standard | Execute SQL statement for bulk saving data.                                 |
| `TypeOrmTransactionalPipelineStepSets` | `PipelineStepSets`                 | `o23/n3`  | Standard | Execute a set of steps in a transaction.                                    |
| `PrintPdfPipelineStep`                 | `AbstractFragmentaryPipelineStep`  | `o23/n5`  | Print    | Print PDF file.                                                             |
| `PrintCsvPipelineStep`                 | `AbstractFragmentaryPipelineStep`  | `o23/n6`  | Print    | Print CSV file.                                                             |
| `PrintExcelPipelineStep`               | `AbstractFragmentaryPipelineStep`  | `o23/n6`  | Print    | Print Excel file.                                                           |
| `PrintWordPipelineStep`                | `AbstractFragmentaryPipelineStep`  | `o23/n7`  | Print    | Print Word file.                                                            |
| `AbstractRegionPipelineStep`           | `AbstractFragmentaryPipelineStep`  | `o23/n8`  | AWS      | Execute AWS command on region.                                              |
| `AbstractS3PipelineStep`               | `AbstractRegionPipelineStep`       | `o23/n8`  | AWS      | Execute AWS S3 command.                                                     |
| `S3GetObjectPipelineStep`              | `AbstractS3PipelineStep`           | `o23/n8`  | AWS      | Execute AWS S3 command for getting an object.                               |
| `S3PutObjectPipelineStep`              | `AbstractS3PipelineStep`           | `o23/n8`  | AWS      | Execute AWS S3 command for putting an object.                               |
| `S3DeleteObjectPipelineStep`           | `AbstractS3PipelineStep`           | `o23/n8`  | AWS      | Execute AWS S3 command for deleting an object.                              |
| `S3ListObjectsPipelineStep`            | `AbstractS3PipelineStep`           | `o23/n8`  | AWS      | Execute AWS S3 command for listing objects.                                 |
| `ScriptsLoadFilesPipelineStep`         | `AbstractFragmentaryPipelineStep`  | `o23/n90` | System   | Load database scripts files.                                                |
| `ParsePipelineDefPipelineStep`         | `AbstractFragmentaryPipelineStep`  | `o23/n90` | System   | Parse pipeline definition                                                   |
| `ServerInitSnippetPipelineStep`        | `SnippetPipelineStep`              | `o23/n90` | System   | Server initialization snippet                                               |
| `TriggerPipelinePipelineStep`          | `AbstractFragmentaryPipelineStep`  | `o23/n90` | Standard | Trigger a pipeline by code, a pipeline or step by given content.            |

Pipeline steps are divided into several categories:

- `Abstract`: provides basic definitions and logic, cannot be used directly,
- `System`: used to define system logic, not necessary for users to use,
- `Standard`: can be used to define user logic,
- `Print`: a printing plugin,
- `AWS`: aws plugin.

> All steps inherit the attribute definitions of their parent steps.

Pipeline steps are stored in the following locations:

- `/scripts` directory,
- `/server` directory,
- `T_O23_PIPELINE_DEFS` table,
- Or in pipeline definitions.

For example, when it is independently defined,

```yaml
code: Add2Numbers1
name: Add2Numbers
type: step
use: snippet
snippet: $factor.one + $factor.another
---
code: Add2Numbers2
name: Add2Numbers
type: step-sets
use: sets
steps:
  - name: Add
    use: snippet
    snippet: $factor.one + $factor.another
```

## Configuration in YAML

Typical step configuration requires at least two attributes, as follows:

```yaml
- name: Step Name
  use: Step Type
  # other properties
```

## Snippet Property

The type of attribute values with many steps is `snippet` or compatible with `snippet`. This type is essentially a function body, and the
function determined by the step itself. When configuring, it needs to conform to the requirements of the function, including
possibly being a synchronous or asynchronous function, having multiple parameters, and possibly having a fixed return type. When configuring
these attributes, you only need to write the function body. When interpreting and executing these function bodies, `o23` follows the
principles below:

- If it is a single line, it checks whether it starts with `return` or `throw`. If not, it automatically adds `return` and treats the
  execution result of that line as the returned data.
- If there are multiple lines, no processing will be done.
- During execution, the parameters are passed in according to the agreed parameter names, which can be used directly in the function body.
  For example, common ones are `$factor`, `$result`, `$helpers`, and `$`.

Due to the issue of single-line and multi-line function bodies, we have to take a closer look at the YAML configuration syntax. In YAML, a
single line can be directly after the attribute name, or it can be represented using preset commands. Let's practice with a few actual
examples:

```yaml
# no, it is incorrect. yaml reader reads it as a json object, 
# will be "[object Object]" after to string, which leads exception when cast to function.
snippet: { one: $factor.one, another: $factor.another }
---
# 5. no, it is incorrect, yaml reader reads it as a boolean value.
# 6. noinspection YAMLIncompatibleTypes
snippet: true
---
# single-line expressions, they will be interpreted as "return $factor.one + $factor.another;"
snippet: $factor.one + $factor.another
---
# 7. single-line expressions, they will be interpreted as "return {one: $factor.one, another: $factor.another};"
snippet: "{one: $factor.one, another: $factor.another}"
---
# single-line expressions, "|-" and ">-" will remove all tailing blank lines.
# the following 4 expressions are equivalent.
snippet: |-
  return $factor.one + $factor.another;
---
snippet: >-
  return $factor.one + $factor.another;
---
snippet: |-
  $factor.one + $factor.another;
---
snippet: >-
  $factor.one + $factor.another;
```

When there is indeed only one line of snippet, but you don't want to return any data, we recommend returning a `null`
value to indicate that no operation is performed on the input data. This means explicitly adding a line `return null;` at the end of the
script. Alternatively, you can use YAML syntax `|` or `>`, which adds a blank line at the end of the text. This will make the interpreter
recognize the function body as a multi-line code and prevent the automatic addition of `return `.

```yaml
# 8. no return, because they are multiple lines.
snippet: |
  $factor.one + $factor.another;
---
snippet: >
  $factor.one + $factor.another;
---
snippet: |+
  $factor.one + $factor.another;
---
snippet: >+
  $factor.one + $factor.another;
```

> `o23` use [js-yaml](https://github.com/nodeca/js-yaml) to read yaml files.

## AbstractFragmentaryPipelineStep

| Attribute                   | Type                     | Mandatory | Description                                                               |
|-----------------------------|--------------------------|-----------|---------------------------------------------------------------------------|
| `from-input`                | `snippet`                | No        | Convert the given input data into the format required for this step.      |
| `to-output`                 | `snippet`                | No        | Convert the output data of this step into the format required for output. |
| `merge`                     | `string`, `boolean`      | No        | Merge return data to output data.                                         |
| `errorHandles`              | `map`                    | No        | Error handlers.                                                           |
| `errorHandlers.catchable`   | `snippet`, `steps array` | No        | Catchable error handler.                                                  |
| `errorHandlers.exposed`     | `snippet`, `steps array` | No        | Exposed uncatchable error handler.                                        |
| `errorHandlers.uncatchable` | `snippet`, `steps array` | No        | Uncatchable error handler.                                                |
| `errorHandlers.any`         | `snippet`, `steps array` | No        | Any error handler.                                                        |

### `from-input`

`($factor: In, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => InFragment`:

- `$factor`: input data,
- `$request`: request data, including input data and context data. <span style='color: red;'>**DO NOT**</span> attempt to modify the context
  data under any circumstances,
- `$helpers`, `$`: helper functions.

The data returned by `from-input` will serve as the input of this step.

> If `from-input` is not defined, the pipeline will directly pass the input data to this step.

### `to-output`

`($result: OutFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Out`:

- `$result`: result data after step execution,
- `$request`: request data, including input data and context data. <span style='color: red;'>**DO NOT**</span> attempt to modify the context
  data under any circumstances,
- `$helpers`, `$`: helper functions.

The data returned by `to-output` will serve as the output of this step and be used as the input for the next step. However, in many
scenarios, the returned data from a step is just a fragment that will be added to the context data of the entire pipeline for later use. In
such scenarios, the `merge` attribute should be used in conjunction.

> If `to-output` is not defined, the pipeline will directly pass the result data to the next step.

### `merge`

`boolean | string`, after receiving the returned data from this step, it may have undergone processing through `to-output` and
will be merged into the input data according to the definition of `merge`. If `merge` is not defined, the returned data will be directly
used as the input data for the next step.

- `true`: merge the returned data into the input data, ensure that the returned data is an object. It will be automatically unboxed and
  merged with the input data.
- `false`: replace the input data with the returned data. It's default behavior, actually, there is no need to explicitly declare it
  as `false`.
- A name: merge the returned data as a property into the input data, using the specified string as the property name,

> We strongly recommend keeping the input and output data as JSON object whenever possible, as it helps avoid unnecessary complications,
> especially when using `merge` where both automatic unboxing and boxing require JSON object support.

### `error-handles`

`error-handles` can include handlers for the following four types of exceptions, each of which is optional. And they
will be matched based on the exception type. It is important to note that if `exposed` is not defined, `uncatchable` will also
catch `ExposedUncatchableError`. And `any` will catch all other exceptions that are not caught by other handlers. Each type of exception
handler can be defined as a `snippet` or a step set. Let's first take a look at the function signature for defining a handler as
a `snippet`.

| Error Handler               | Error Type                | Signature                                                                                                                                                         |
|-----------------------------|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `error-handles.catchable`   | `CatchableError`          | `($options: ErrorHandleOptions<In, InFragment, CatchableError>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment> \| never`          |
| `error-handles.exposed`     | `ExposedUncatchableError` | `($options: ErrorHandleOptions<In, InFragment, ExposedUncatchableError>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment> \| never` |
| `error-handles.uncatchable` | `UncatchableError`        | `($options: ErrorHandleOptions<In, InFragment, UncatchableError>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment> \| never`        |
| `error-handles.any`         | `Error`                   | `($options: ErrorHandleOptions<In, InFragment>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment> \| never`                          |

```typescript
// o23/n3
interface ErrorHandleOptions<In, InFragment, E extends Error = Error> {
	$code: string;
	$error: E;
	$factor: InFragment;
	$request: PipelineStepData<In>;
}
```

As you can see, the exception handling function can access four parameter data: the current error code `$code`, the
error object `$error`, the current step input data `$factor`, and the step context `$request`. Additionally, the handler can choose to
continue throwing the exception or perform logical and data repairs, that's why this handler function allows to return normally.

In addition to handling exceptions using a `snippet`, it is also possible to directly define a set of steps for exception handling. The
input data for the first step of this set is the `$options` object of the function. For example:

```yaml
error-handles:
  any:
    - name: Print Console Log
      use: snippet
      snippet: |-
        // "Example" is category of log
        $.$logger.error($options.$error, 'Example');
        return null;
    - name: Rethrow
      use: snippet
      snippet: |-
        throw $options.$error;
```

> <span style='color: red;'>**DO NOT**</span> attempt to modify the context data under any circumstances,

## GetPropertyPipelineStep, extends AbstractFragmentaryPipelineStep

Get the value of a specified property from the input data. Execute after `from-input`.

| Attribute  | Type     | Mandatory | Description                                                        |
|------------|----------|-----------|--------------------------------------------------------------------|
| `property` | `string` | Yes       | Property name, multiple-level property can be connected using `.`. |

For example,

```yaml
- name: Get Property
  use: get-property
  property: customer.name
  merge: customerName
```

## DeletePropertyPipelineStep, extends AbstractFragmentaryPipelineStep

Delete the given properties from the input data. Execute after `from-input`.

| Attribute  | Type                     | Mandatory | Description                                               |
|------------|--------------------------|-----------|-----------------------------------------------------------|
| `property` | `string`, `string array` | Yes       | Property names, multiple-level property is not supported. |

> Delete multiple properties at once by defining an array of property names or using `,` to connect multiple property names.

> Since deletion only supports deleting direct properties, if the property you want to delete is not directly owned by the input data,
> please use `from-input` first to obtain the object to which the property belongs.

For example,

```yaml
- name: Del Property
  use: del-property
  property: one, two
```

> `use: del-properties` also works.

## SnippetPipelineStep, extends AbstractFragmentaryPipelineStep

Execute given script snippet. Execute after `from-input`.

| Attribute | Type      | Mandatory | Description     |
|-----------|-----------|-----------|-----------------|
| `snippet` | `snippet` | Yes       | Script snippet. |

`($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment>`

- `$factor`: input data,
- `$request`: request data, including input data and context data. <span style='color: red;'>**DO NOT**</span> attempt to modify the context
  data under any circumstances,
- `$helpers`, `$`: helper functions.

> `$factor` is the return value of `from-input` when it is defined, otherwise it is the input data of this step.

For example,

```yaml
- name: Snippet
  use: snippet
  snippet: |-
    return $factor.one + $factor.another;
```

## SnowflakePipelineStep, extends AbstractFragmentaryPipelineStep

Generate a snowflake number and returns it. Execute after `from-input`.

| Attribute    | Type | Mandatory | Description |
|--------------|------|-----------|-------------|
| No attribute |      |           |             |

> Please note that if you do not want the input data to be overwritten, please use `to-output` or `merge` to merge it into the input data.

For example,

```yaml
- name: Generate Snowflake ID
  use: snowflake
  merge: id
```

## FetchPipelineStep, extends AbstractFragmentaryPipelineStep

Use `node-fetch` to call remote service APIs. Execute after `from-input`.

| Attribute                    | Type      | Mandatory | Description                                            |
|------------------------------|-----------|-----------|--------------------------------------------------------|
| `system`                     | `string`  | Yes       | Code of remote service.                                |
| `endpoint`                   | `string`  | Yes       | Name of remote service endpoint.                       |
| `decorate-url`               | `snippet` | No        | Decorate url, which loaded from environment variables. |
| `generate-headers`           | `snippet` | No        | Generate request headers, for remote service endpoint. |
| `generate-body`              | `snippet` | No        | Generate request body, for remote service endpoint.    |
| `read-response`              | `snippet` | No        | Generate response body, from remote service endpoint.  |
| `response-error-handles`     | `map`     | No        | Error handlers for response.                           |
| `response-error-handles.400` | `snippet` | No        | Error handler for 400.                                 |

For example,

```yaml
- name: Fetch Sth
  use: http-fetch
  system: example
  endpoint: user.find
  decorate-url: |-
    return $endpointUrl + '?userId=' + $factor.userId;
  merge: user
```

### `system`

`string`, system code is used to look up the corresponding configuration information when executing the fetch step, as follows:

- `endpoints.{system}.global.headers`: request headers for all endpoints of the system,
- `endpoints.{system}.global.timeout`: request timeout for all endpoints of the system.

### `endpoint`

`string`, endpoint name is used to look up the corresponding configuration information when executing the fetch step, as
follows:

- `endpoints.{system}.{endpoint}.url`: request url,
- `endpoints.{system}.{endpoint}.method`: request method, default is `post`,
- `endpoints.{system}.{endpoint}.headers`: request headers, for this endpoint only. Will overwrite global headers if with same name,
- `endpoints.{system}.{endpoint}.timeout`: request timeout, for this endpoint only. Will overwrite global timeout if defined,
- `endpoints.{system}.{endpoint}.body.used`: whether to use request body, default is `true`.

### `decorate-url`

`($endpointUrl: string, $factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => string`:

- `$endpointUrl`: request url,
- `$factor`: input data,
- `$request`: request data, including input data and context data. <span style='color: red;'>**DO NOT**</span> attempt to modify the context
  data under any circumstances,
- `$helpers`, `$`: helper functions.

### `generate-headers`

`($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Undefinable<Record<string, string>>`,

- `$factor`: input data,
- `$request`: request data, including input data and context data. <span style='color: red;'>**DO NOT**</span> attempt to modify the context
  data under any circumstances,
- `$helpers`, `$`: helper functions.

The returned request headers will be merged with the globally defined headers. If there are duplicate names, the values generated by this
function will take precedence.

### `generate-body`

`($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => any`,

- `$factor`: input data,
- `$request`: request data, including input data and context data. <span style='color: red;'>**DO NOT**</span> attempt to modify the context
  data under any circumstances,
- `$helpers`, `$`: helper functions.

The returned body will be stringified.

### `read-response`

`($response: Response, $factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<any>`

- `$response`: `Response` object, see [`node-fetch`](https://github.com/node-fetch/node-fetch),
- `$factor`: input data,
- `$request`: request data, including input data and context data. <span style='color: red;'>**DO NOT**</span> attempt to modify the context
  data under any circumstances,
- `$helpers`, `$`: helper functions.

By default, `json()` is used to retrieve a JSON object from the response body. However, if the data is not a JSON object, you can define
your own function to handle data retrieval.

### `response-error-handles`

`response-error-handles` can define exception handling for specific HTTP statuses. The exception handler will be called in the following
cases:

- Response HTTP status is greater than or equal to `400`,
- An error occurred due to a timeout, with a status code of `600`,
- Any exceptions that occur during the execution, not caused by a remote call. For example, errors that occur during the execution
  of `generate-body`, will have a status code of `000`,

However, it is important to note that if the exception is an `UncatchableError`, it will not be caught.

For each handler, signature
is `($options: HttpErrorHandleOptions<In, InFragment>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment> | never`:

- `$options`: request data, including input data and context data. <span style='color: red;'>**DO NOT**</span> attempt to modify the context
  data under any circumstances,
- `$helpers`, `$`: helper functions.

```typescript
// o23/n3
interface HttpErrorHandleOptions<In, InFragment> {
	$errorCode: HttpErrorCode;
	$url: string;
	$response?: Response;
	$factor: InFragment;
	$request: PipelineStepData<In>;
}
```

## RefPipelinePipelineStep, extends AbstractFragmentaryPipelineStep

Execute pipeline by given code, Use the input data of this step as the input data for the specified pipeline, and use the output data of the
specified pipeline as the output data for this step. Execute after `from-input`.

| Attribute | Type     | Mandatory | Description    |
|-----------|----------|-----------|----------------|
| `code`    | `string` | Yes       | Pipeline code. |

For example,

```yaml
- name: Execute Pipeline
  use: ref-pipeline
  code: AnotherPipelineCode
```

## RefStepPipelineStep, extends AbstractFragmentaryPipelineStep

Execute pipeline step by given code, Use the input data of this step as the input data for the specified pipeline step, and use the output
data of the specified pipeline step as the output data for this step. Execute after `from-input`.

| Attribute | Type     | Mandatory | Description         |
|-----------|----------|-----------|---------------------|
| `code`    | `string` | Yes       | Pipeline step code. |

For example,

```yaml
- name: Execute Pipeline Step
  use: ref-step
  code: AnotherPipelineStepCode
```

## RoutesPipelineStepSets, extends AbstractFragmentaryPipelineStep

According to the given conditions, if the condition is met, execute the corresponding subset of sub steps. If no condition is matched,
execute the subset of sub steps corresponding to `otherwise`. Execute after `from-input`.

| Attribute      | Type         | Mandatory | Description               |
|----------------|--------------|-----------|---------------------------|
| `routes`       | `array`      | Yes       | Conditions and sub steps. |
| `routes.check` | `snippet`    | Yes       | Condition of route.       |
| `routes.steps` | `step array` | Yes       | Sub steps of route.       |
| `otherwise`    | `step array` | No        | Sub steps of otherwise.   |

For example,

```yaml
- name: Routes
  use: routes
  routes:
    - check: $factor.code = 'A'
      steps:
        - name: Print A
          use: snippet
          snippet: $.$logger.log('Got code A, it is amazing.');
    - check: $factor.code = 'B'
      steps:
        - name: Print B
          use: snippet
          snippet: $.$logger.log('Got code B, it is great.');
  otherwise:
    - name: Print Otherwise
      use: snippet
      snippet: $.$logger.log(`Got code ${factor.code}.`);
```

### `routes.check`

`($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => boolean`:

- `$factor`: input data,
- `$request`: request data, including input data and context data. <span style='color: red;'>**DO NOT**</span> attempt to modify the context
  data under any circumstances,
- `$helpers`, `$`: helper functions.

### `routes.steps`

A steps set.

### `otherwise`

A steps set.

### Input Data for `routes.check`, `routes.steps` and `otherwise`

It is important to note that the input data of this step is only used by `routes.check`. When executing the subset of sub steps, whether
they are defined under a specific route or under `otherwise`, they directly use the input data in this step before `from-input`. Therefore,
the `from-input` function of this step only affects the `check` definition in each route.

## PipelineStepSets, extends AbstractFragmentaryPipelineStep

Execute the given subset of sub steps. Execute after `from-input`.

| Attribute | Type         | Mandatory | Description |
|-----------|--------------|-----------|-------------|
| `steps`   | `step array` | Yes       | Sub steps.  |

For example,

```yaml
- name: Sets
  use: sets
  steps:
    - name: Print A
      use: snippet
      snippet: $.$logger.log('Print code A, it is amazing.');
    - name: Print B
      use: snippet
      snippet: $.$logger.log('Print code B, it is great.');
    - name: Print Otherwise
      use: snippet
      snippet: $.$logger.log(`Print code ${factor.code}.`);
```

## AsyncPipelineStepSets, extends PipelineStepSets, AbstractFragmentaryPipelineStep

Async Step Sets and Pipeline Step Sets are exactly the same, except that async step sets are executed asynchronously and therefore do not
have a return value.

| Attribute | Type         | Mandatory | Description |
|-----------|--------------|-----------|-------------|
| `steps`   | `step array` | Yes       | Sub steps.  |

For example,

```yaml
- name: Sets
  use: async-sets
  steps:
    - name: Print A
      use: snippet
      snippet: $.$logger.log('Print code A, it is amazing.');
    - name: Print B
      use: snippet
      snippet: $.$logger.log('Print code B, it is great.');
    - name: Print Otherwise
      use: snippet
      snippet: $.$logger.log(`Print code ${factor.code}.`);
```

> <span style='color: red;'>**NEVER**</span> put an async step set into a database transaction.

## ConditionalPipelineStepSets, extends PipelineStepSets, AbstractFragmentaryPipelineStep

According to the given condition, if the condition is met, execute the corresponding subset of sub steps. If no condition is matched,
execute the subset of sub steps corresponding to `otherwise`. Execute after `from-input`.

| Attribute   | Type         | Mandatory | Description                       |
|-------------|--------------|-----------|-----------------------------------|
| `check`     | `snippet`    | Yes       | Condition.                        |
| `steps`     | `step array` | Yes       | Sub steps when condition matched. |
| `otherwise` | `step array` | No        | Sub steps of otherwise.           |

For example,

```yaml
- name: Conditional
  use: conditional
  check: $factor.code = 'A'
  steps:
    - name: Print A
      use: snippet
      snippet: $.$logger.log('Got code A, it is amazing.');
  otherwise:
    - name: Print Otherwise
      use: snippet
      snippet: $.$logger.log(`Got code ${factor.code}.`);
```

### `check`

`($factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => boolean`:

- `$factor`: input data,
- `$request`: request data, including input data and context data. <span style='color: red;'>**DO NOT**</span> attempt to modify the context
  data under any circumstances,
- `$helpers`, `$`: helper functions.

### `steps`

A steps set.

### `otherwise`

A steps set.

### Input Data for `routes.check`, `routes.steps` and `otherwise`

It is important to note that the input data of this step is only used by `check`. When executing the subset of sub steps, whether
they are defined under `steps` or under `otherwise`, they directly use the input data in this step before `from-input`. Therefore,
the `from-input` function of this step only affects the `check` definition.

## EachPipelineStepSets, extends PipelineStepSets, AbstractFragmentaryPipelineStep

For each item of the given array, execute the specified set of steps. Execute after `from-input`.

| Attribute               | Type     | Mandatory | Description                       |
|-------------------------|----------|-----------|-----------------------------------|
| `original-content-name` | `string` | No        | Condition.                        |
| `item-name`             | `string` | No        | Sub steps when condition matched. |

For example,

```yaml
- name: Each
  use: each
  from-input: $factor.locations
  steps:
    - name: Print Location
      use: snippet
      snippet: "$.$logger.log(`Location: ${$item.name}, ${$item.address}.`);"
```

> Given input data must be an array, otherwise use `from-input` to prepare.

The input data structure for the sub-step set is as follows:

```typescript
interface EachPipelineStepSetsInputData<In> {
	[Content]: any;     // original input data, before 'from-input'
	item: any;          // item of input data, this input data is after 'from-input'
	$semaphore: Symbol; // a symbol, when last step of step set returns this symbol, the pipeline will break the loop
}
```

The return data from each iteration will be collected into an array as the return data for this step.

## ParallelPipelineStepSets, extends PipelineStepSets, AbstractFragmentaryPipelineStep

Execute the specified set of steps parallel. Execute after `from-input`.

| Attribute    | Type      | Mandatory | Description                                           |
|--------------|-----------|-----------|-------------------------------------------------------|
| `clone-data` | `snippet` | No        | Clone request data for each step before executing it. |
| `race`       | `boolean` | No        | Returns first settled result or not.                  |

For example,

```yaml
- name: Parallel
  use: parallel
  from-input: $factor.salary
  steps:
    - name: Calculate Bonus
      use: snippet
      snippet: "$factor * 1.5"
    - name: Calculate Tax
      use: snippet
      snippet: "$factor * 1.5 * 0.05"

# assume fetch-from-s1, fetch-from-s2 are customized steps, retrieve result from service 1 and 2 by given data
- name: Choose the Best Service
  use: parallel
  from-input: $factor.data
  race: true
  steps:
    - name: Calculate Service 1
      use: fetch-from-s1
    - name: Calculate Service 2
      use: fetch-from-s2
```

## AbstractTypeOrmPipelineStep, extends AbstractFragmentaryPipelineStep

Provide an execution environment for TypeORM.

| Attribute     | Type      | Mandatory | Description                            |
|---------------|-----------|-----------|----------------------------------------|
| `datasource`  | `string`  | No        | Datasource name                        |
| `transaction` | `string`  | No        | Transaction name.                      |
| `autonomous`  | `boolean` | No        | Whether to use autonomous transaction. |

### `datasource`

`string`, datasource name is used to look up the corresponding configuration information when executing the TypeORM step, as follows:

- `typeorm.{datasource}.**`: datasource configurations.

### `transaction`

`string`, transaction name is used to look up the existing transaction when executing the TypeORM step. Default value is `$default`.

### `autonomous`

With autonomous transaction or not. Default value is `false`.

### Redress when read YAML

When the following environment variables are defined, YAML reader will do redressing for TypeORM steps:

- `CFG_APP_ENV_STRICT=false`: default `true`, but `false` is recommended,
- `CFG_APP_ENV_REDRESS_TYPEORM_DATASOURCE=true`: default `true`, will redress `datasource` attribute if it is not defined, using value
  of `CFG_APP_DATASOURCE_DEFAULT`.
- `CFG_APP_ENV_REDRESS_TYPEORM_TRANSACTION=true`: default `true`, will redress `transaction` and `autonomous` attributes,
	- TypeORM step must have `datasource` declared,
	- TypeORM step must not have `autonomous: true` declared,
	- TypeORM step must not have `transaction` declared,
	- TypeORM is not in a transaction,
	- Set `autonomous` to `true`.

### TypeOrmBySnippetPipelineStep, extends AbstractTypeOrmPipelineStep, AbstractFragmentaryPipelineStep

Execute given script snippet. Execute after `from-input`.

| Attribute | Type      | Mandatory | Description     |
|-----------|-----------|-----------|-----------------|
| `snippet` | `snippet` | Yes       | Script snippet. |

`($runner: QueryRunner, $factor: InFragment, $request: PipelineStepData<In>, $helpers: PipelineStepHelpers, $: PipelineStepHelpers) => Promise<OutFragment>`

- `$runner`: `QueryRunner` from [TypeORM](https://typeorm.io/),
- `$factor`: input data,
- `$request`: request data, including input data and context data. <span style='color: red;'>**DO NOT**</span> attempt to modify the context
  data under any circumstances,
- `$helpers`, `$`: helper functions.

> <span style='color: red;'>**DO NOT**</span> control transactions in the step snippet, transactions should be handled by transaction step
> declarations.

### AbstractTypeOrmBySQLPipelineStep, extends AbstractTypeOrmPipelineStep, AbstractFragmentaryPipelineStep

Execute given sql. Execute after `from-input`.

| Attribute | Type     | Mandatory | Description |
|-----------|----------|-----------|-------------|
| `sql`     | `string` | No        | SQL.        |

Use `sql: @ignore` to declare sql should be passed in by input data. When defining, do not declare the SQL, as it should be constructed
based on the actual data requirements in certain scenarios. In this case, this step will require the input data to meet the following
structure,

```typescript
interface TypeOrmBasis {
	sql?: TypeOrmSql;
}
```

Even if the `sql` attribute has been defined, if the `sql` is still passed in the input data, the `sql` in the input data will still take
precedence.

To learn more about the usage of SQL, please refer to the documentation for `o23/n3`. Simply put, `o23/n3` provides certain enhancements to
the native SQL syntax in order to use the same SQL syntax to accommodate different database dialects. Here is the current list of
enhancements in `o23/n3` syntax:

- `$name` represents get `name` from given parameter object,
- `IN ($...names)` represents `one-of`, `names` must be an array,
- `LIKE $name%` represents `starts-with`,
- `LIKE $%name` represents `ends-with`,
- `LIKE $%name%` represents `contains`,
- `$.limit($offset, $limit)` represents pagination,
- Explicit data type,
	- `$config.@json` explicitly indicate that the `config` column is of JSON data type,
	- `$enabled.@bool` explicitly indicate that the `enabled` column is of boolean in-memory and numeric in database data type,
	- `$createdAt.@ts` explicitly indicate that the `createAt` column is of string in-memory and timestamp in database data type,
	- All data type explicitly indicator can be used in alias, simply remove the `$` suffix, such as `CREATED_AT AS "createdAt.@ts"`.

> Find details on [`o23/n3`](https://github.com/InsureMO/rainbow-o23/tree/main/o23-n3).

### TypeOrmLoadOneBySQLPipelineStep, extends AbstractTypeOrmBySQLPipelineStep, AbstractTypeOrmPipelineStep, AbstractFragmentaryPipelineStep

Load a row of data. Execute after `from-input`.

| Attribute    | Type | Mandatory | Description |
|--------------|------|-----------|-------------|
| No attribute |      |           |             |

This step requires input data structure as follows:

```typescript
type TypeOrmEntityValue = string | number | bigint | boolean | Date | null | undefined;
type TypeOrmEntityToLoad = DeepPartial<ObjectLiteral>;

interface TypeOrmLoadBasis extends TypeOrmBasis {
	params?: Array<TypeOrmEntityValue> | TypeOrmEntityToSave;
}
```

- If SQL uses native dialect placeholders, the `params` parameter should be an array with the same length as the number of placeholders.
- If SQL uses `o23/n3` enhanced syntax placeholders, the `params` parameter should be an object with properties corresponding to the
  placeholders.

For example,

```yaml
- name: Load One
  use: typeorm-load-one
  sql: SELECT USER_ID AS "userId", USER_NAME AS "userName" FROM T_USER WHERE USER_ID = $userId
  merge: user
```

The above definition will use input data `{params: {userId: 1}}`, and return an object `{userId: 1, userName: 'Joe'}`. If the query does not
match any data, it will return `undefined`. And because returning `undefined` would cause the pipeline to interpret it as "use the input
data of this step as the input data for the next step," it is generally important to use `to-output` or `merge` to write the returned data
back into the input data when using this step.

> In SQL, the `AS "alias"` syntax is used because database fields commonly use underscore to connect words, while in-memory objects often
> use camel case for property names. Therefore, aliasing is used to transform them. Additionally, some database dialects will standardize
> the aliases to lowercase if double quotes are not used to enclose them. Hence, we strongly recommend using this approach when writing SQL
> statements for loading data. Similarly, `$userId` is a part of the enhanced SQL syntax provided by `o23/n3`. Due to the differences in
> placeholder syntax among various dialects, it is not possible to achieve consistent SQL execution across different databases. Moreover,
> placeholders typically use array positions for matching, which requires the parameters to be of array type, contradicting the typical
> practice of manipulating in-memory data. Therefore, we also highly recommend using the enhanced syntax of `o23/n3` to describe
> placeholders.

### TypeOrmLoadManyBySQLPipelineStep, extends AbstractTypeOrmBySQLPipelineStep, AbstractTypeOrmPipelineStep, AbstractFragmentaryPipelineStep

Load multiple rows of data, using the same method as `TypeOrmLoadOneBySQLPipelineStep`, but returns an array where each row of data is an
element of the array. Execute after `from-input`.

| Attribute    | Type | Mandatory | Description |
|--------------|------|-----------|-------------|
| No attribute |      |           |             |

For example,

```yaml
- name: Load Many
  use: typeorm-load-many
  sql: SELECT USER_ID AS "userId", USER_NAME AS "userName" FROM T_USER WHERE LOWER(USER_NAME) LIKE $name%
  merge: users
```

The above definition will use input data `{params: {userName: 'john'}}`, and return an
object `[{userId: 2, userName: 'Johnson'}, {userId: 3, userName: 'John'}]`. If the query does not match any data, it will return an empty
array.

### TypeOrmSaveBySQLPipelineStep, extends AbstractTypeOrmBySQLPipelineStep, AbstractTypeOrmPipelineStep, AbstractFragmentaryPipelineStep

Executing a single write SQL statement may affect more than one row of data, or it may not affect any data at all. Execute
after `from-input`.  
Even when executing write SQL statements, it is still possible to return data, such as the number of affected rows, newly created IDs, or
certain database dialects may allow specifying the content to be returned through SQL syntax. These returned data will be returned as the
output of this step.

| Attribute    | Type | Mandatory | Description |
|--------------|------|-----------|-------------|
| No attribute |      |           |             |

This step requires input data structure as follows:

```typescript
type TypeOrmEntityValue = string | number | bigint | boolean | Date | null | undefined;
type TypeOrmEntityToSave = DeepPartial<ObjectLiteral>;

interface TypeOrmSaveBasis extends TypeOrmBasis {
	values?: Array<TypeOrmEntityValue> | TypeOrmEntityToSave;
}
```

- If SQL uses native dialect placeholders, the `values` parameter should be an array with the same length as the number of placeholders.
- If SQL uses `o23/n3` enhanced syntax placeholders, the `values` parameter should be an object with properties corresponding to the
  placeholders.

For example,

```yaml
- name: Save
  use: typeorm-save
  sql: UPDATE T_USER SET USER_NAME = $userName WHERE USER_ID = $userId
  merge: results
```

The above definition will use input data `{values: {userId: 1, userName: 'Jane'}}`, and return data depends on the database
dialect. `o23/n3` attempts to format the returned data in a standardized manner, as follows:

- If the SQL execution returns a number, bigint, string, or boolean, it is returned as is.
- If the database is `MySQL`, the following detections are done in the specified order:
	- If there are changed rows count, returns it,
	- If there is an auto-incremented ID, returns it,
	- If there are affected rows count, returns it,
	- The execution result is returned directly.
- If the database is `PostgreSQL`:
	- If the executed query is an `UPDATE` or `DELETE`, the number of affected rows is returned.
	- If the returned data contains a result set, returns it.
	- An empty array is returned (usually for `INSERT` operations).
- If it is `MSSQL`, the returned result depends on the SQL syntax, as the dialect supports the `OUTPUT` grammar.
- If it is `Oracle`, no additional processing is done, and the data is returned directly.

### TypeOrmBulkSaveBySQLPipelineStep, extends AbstractTypeOrmBySQLPipelineStep, AbstractTypeOrmPipelineStep, AbstractFragmentaryPipelineStep

Batch write data by executing the same write SQL statement. Execute after `from-input`.

| Attribute    | Type | Mandatory | Description |
|--------------|------|-----------|-------------|
| No attribute |      |           |             |

This step requires input data structure as follows:

```typescript
type TypeOrmEntityValue = string | number | bigint | boolean | Date | null | undefined;
type TypeOrmEntityToSave = DeepPartial<ObjectLiteral>;

interface TypeOrmBulkSaveBasis extends TypeOrmBasis {
	items?: Array<Array<TypeOrmEntityValue> | TypeOrmEntityToSave>;
}
```

For example,

```yaml
- name: Save
  use: typeorm-bulk-save
  sql: UPDATE T_USER SET USER_NAME = $userName WHERE USER_ID = $userId
  merge: results
```

The above definition will use input data `{items: [{userId: 1, userName: 'Jane'}]}`, The execution results of each element will be collected
into an array and finally returned as the output data.

### TypeOrmTransactionalPipelineStepSets, extends PipelineStepSets, AbstractFragmentaryPipelineStep

Start a database transaction to be used by a set of sub steps. It is important to note that not every sub step requires executing a database
operation. Additionally, this transaction can be used across layers, not limited to direct sub steps only.

| Attribute     | Type         | Mandatory | Description       |
|---------------|--------------|-----------|-------------------|
| `datasource`  | `string`     | No        | Datasource name   |
| `transaction` | `string`     | No        | Transaction name. |
| `steps`       | `step array` | Yes       | Sub steps.        |

The transaction step itself does not perform any logic, it merely manages the transaction it initiated, ensuring that the transaction is
started here and committed or rolled back after executing all sub steps. It is important to note that `o23/n3` uses the data source name and
transaction name to locate the transaction. Therefore, when a database step needs to be managed by a transaction, you need to specify the
same data source name and transaction name, and ensure that the transaction has already been started.

For example,

```yaml
- name: Transaction
  use: typeorm-transactional
  datasource: example
  transaction: first
  steps:
    - name: Save
      use: typeorm-bulk-save
      datasource: example
      transaction: first
      sql: UPDATE T_USER SET USER_NAME = $userName WHERE USER_ID = $userId
      merge: results
```

The reason for explicitly specifying the data source and transaction name is that transactions can actually be nested. In scenarios with
nested transactions, it becomes particularly important to specify which data source and transaction a database step should use. In some
scenarios, there may be nested autonomous transactions within a transaction. In such cases, you can explicitly define `autonomous: true` to
control an individual autonomous transaction.

## PrintPdfPipelineStep, extends AbstractFragmentaryPipelineStep

Print the PDF file using a predefined template.

| Attribute      | Type                                                       | Mandatory | Description                 |
|----------------|------------------------------------------------------------|-----------|-----------------------------|
| `browser-args` | `string`, `string array`                                   | No        | Chromium browser arguments. |
| `viewport`     | [`Viewport`](https://pptr.dev/api/puppeteer.viewport/)     | No        | Chromium viewport settings. |
| `pdf-options`  | [`PDFOptions`](https://pptr.dev/api/puppeteer.pdfoptions/) | No        | Chromium PDF print options. |

> All PDF printing related configurations can be found in `/envs/common/.print`.

> Normally, there is no need to set the `viewport`, and the `pdf-options` can be individually controlled in the template, so there is no
> need to set them in the step definition either.

This step requires the input data structure as follows:

```typescript
interface PrintCsvPipelineStepInFragment {
	template: Buffer | string;
	data: any;
}
```

> The data format of `data` depends on the template definition.

For example,

```yaml
- name: Print Pdf
  use: print-pdf
  from-input: "{template: $factor.template.templateFile, data: $factor.preparedData}"
  merge: printed
```

## PrintCsvPipelineStep, extends AbstractFragmentaryPipelineStep

Print the CSV file using a predefined template.

| Attribute   | Type     | Mandatory | Description                                   |
|-------------|----------|-----------|-----------------------------------------------|
| `delimiter` | `string` | No        | Column delimiter, default `,`.                |
| `escape`    | `string` | No        | Column content escape character, default `"`. |

This step requires the input data structure as follows:

```typescript
interface PrintCsvPipelineStepInFragment {
	template: Buffer | string;
	data: any;
}
```

> The data format of `data` depends on the template definition.

For example,

```yaml
- name: Print Csv
  use: print-csv
  from-input: "{template: $factor.template.templateFile, data: $factor.preparedData}"
  merge: printed
```

## PrintExcelPipelineStep, extends AbstractFragmentaryPipelineStep

Print the Excel file using a predefined template.

| Attribute    | Type | Mandatory | Description |
|--------------|------|-----------|-------------|
| No attribute |      |           |             |

This step requires the input data structure as follows:

```typescript
interface PrintExcelPipelineStepInFragment {
	/** it is an Excel file, after 2007 */
	template: Buffer;
	data: any;
}
```

> The data format of `data` depends on the template definition.

For example,

```yaml
- name: Print Excel
  use: print-excel
  from-input: "{template: $factor.template.templateFile, data: $factor.preparedData}"
  merge: printed
```

## PrintWordPipelineStep, extends AbstractFragmentaryPipelineStep

Print the Word file using a predefined template.

| Attribute                         | Type                         | Mandatory | Description                                                                                                                                                                                                                                                                                                                                                                                                      |
|-----------------------------------|------------------------------|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `cmd`                             | `string`, `[string, string]` | No        | Defines a custom command delimiter, default `+++`. This can be a String e.g. '+++' or an Array of Strings with length 2: ['{', '}'] in which the first element serves as the start delimiter and the second as the end delimiter.                                                                                                                                                                                |
| `literal-xml-delimiter`           | `string`                     | No        | The delimiter that's used to indicate literal XML that should be inserted into the docx XML tree as-is, default `\|\|`.                                                                                                                                                                                                                                                                                          |
| `process-line-breaks`             | `boolean`                    | No        | Handle linebreaks in result of commands as actual linebreaks, default `true`.                                                                                                                                                                                                                                                                                                                                    |
| `fail-fast`                       | `boolean`                    | No        | Whether to fail on the first error encountered in the template, default `true`.                                                                                                                                                                                                                                                                                                                                  |
| `reject-nullish`                  | `boolean`                    | No        | When set to true, this setting ensures createReport throws a NullishCommandResultError when the result of an INS, HTML, IMAGE, or LINK command is null or undefined. This is useful as nullish return values usually indicate a mistake in the template or the invoking code, default `false`.                                                                                                                   |
| `fix-smart-quotes`                | `boolean`                    | No        | MS Word usually autocorrects JS string literal quotes with unicode 'smart' quotes ('curly' quotes). E.g. 'aubergine' -> ‘aubergine’. This causes an error when evaluating commands containing these smart quotes, as they are not valid JavaScript. If you set fixSmartQuotes to 'true', these smart quotes will automatically get replaced with straight quotes (') before command evaluation, default `false`. |
| `process-line-breaks-as-new-text` | `boolean`                    | No        | Use the new way of injecting line breaks from command results (only applies when processLineBreaks is true) which has better results in LibreOffice and Google Drive, default `false`.                                                                                                                                                                                                                           |

This step requires the input data structure as follows:

```typescript
interface PrintExcelPipelineStepInFragment {
	template: Buffer;
	data: any;
	jsContext?: Object;
}
```

> The data format of `data` depends on the template definition.  
> The context format of `jsContext` depends on the template definition.

For example,

```yaml
- name: Print Word
  use: print-word
  from-input: "{template: $factor.template.templateFile, data: $factor.preparedData, jsContext: $factor.preparedData?.$jsContext}"
  merge: printed
```

> Note that in `o23/n99`, if the `jsContext` object is needed, it will be automatically retrieved from `prepareData`. In other words, the
> data generated by the pre-printing pipeline of the print task should include an object with a fixed property name of `$jsContext`, which
> will be used for the `jsContext` of word printing.

## AbstractRegionPipelineStep, extends AbstractFragmentaryPipelineStep

Some of AWS services are available in specified region. `AbstractRegionPipelineStep` provides an API to read the region based on the client
for all region-based AWS pipeline steps to use.

| Attribute | Type     | Mandatory | Description    |
|-----------|----------|-----------|----------------|
| `client`  | `string` | Yes       | S3 client name |

### `client`

`string`, client name is used to look up the corresponding configuration information when executing the AWS region step, as follows:

- `aws.client.{client}.**`: client configurations.

### AbstractS3PipelineStep, extends AbstractRegionPipelineStep

Execute AWS S3 command.

| Attribute | Type     | Mandatory | Description  |
|-----------|----------|-----------|--------------|
| `bucket`  | `string` | No        | Bucket name. |

#### `client`

`string`, client name is used to look up the corresponding configuration information when executing the AWS S3 step, as follows:

- `aws.s3.{client}.client.type`: to identify how to read client configurations.

#### `bucket`

`string`, bucket name is used to look up the existing bucket when executing the AWS S3 step.

#### S3GetObjectPipelineStep, extends AbstractS3PipelineStep

Get an object from AWS S3 bucket.

| Attribute          | Type      | Mandatory | Description                                          |
|--------------------|-----------|-----------|------------------------------------------------------|
| `content-as`       | `string`  | No        | Read object content as `string` or `buffer`.         |
| `ignore-not-found` | `boolean` | No        | Ignore error when object not found, default `false`. |

For example,

```yaml
- name: Get Object from S3
  use: aws-s3-get
  client: myClient
  from-input: "{Key: $factor.objectKey}"
  to-output: "$result.Body"
```

#### S3PutObjectPipelineStep, extends AbstractS3PipelineStep

Put an object into AWS S3 bucket.

For example,

```yaml
- name: Put Object to S3
  use: aws-s3-put
  client: myClient
  from-input: "{Key: $factor.objectKey, Body: $factor.fileBuffer}"
```

#### S3DeleteObjectPipelineStep, extends AbstractS3PipelineStep

Delete an object from AWS S3 bucket.

For example,

```yaml
- name: Delete S3 Object
  use: aws-s3-delete
  client: myClient
  from-input: "{Key: $factor.objectKey}"
```

#### S3ListObjectsPipelineStep, extends AbstractS3PipelineStep

List objects from AWS S3 bucket.

For example,

```yaml
- name: List S3 Objects
  use: aws-s3-list
  client: myClient
  bucket: myBucket
  from-input: "{Prefix: $factor.prefix}"
  to-output: "($result.Contents ?? []).map(content => content.Key)"
```

## TriggerPipelinePipelineStep, extends AbstractFragmentaryPipelineStep

Trigger the specified pipeline or pipeline step based on the given input data.

| Attribute    | Type | Mandatory | Description |
|--------------|------|-----------|-------------|
| No attribute |      |           |             |

This step requires the input data structure as follows:

```typescript
interface PipelineTrigger {
	data?: any;
}

interface PipelineTriggerByContent extends PipelineTrigger {
	content?: string | ParsedDef;   // ParsedDef is not supported in YAML, only supported programmatically.
	cacheKey?: string;
}

interface PipelineTriggerByCode extends PipelineTrigger {
	code?: PipelineCode;
}
```

The given input data can be either:

- `PipelineTriggerByContent`: Parse the given `content` and execute it. The content can be a pipeline or a pipeline step. If a `cacheKey` is
  specified, it will be used to cache parsed definition and the content's MD5 hash.
- or `PipelineTriggerByCode`: Execute the pipeline with the given code.

> Use the given data as input data.

For example,

```yaml
- name: Prepare Trigger Data
  use: snippet
  snippet: |-
    return {...$factor.trigger, data: $factor.data, cacheKey: `d9-config-${$factor.configuration.configId}`};
  merge: trigger
- name: Call Prepare Data Pipeline
  use: trigger-pipeline
  from-input: $factor.trigger
  merge: preparedData
```

## Helper Functions

```typescript
// o23/n1
interface PipelineStepHelpers {
	$config?: Config;
	$logger?: Logger;
	$date: PipelineStepDateHelper;
	$nano: (size?: number) => string;
	$ascii: (size?: number) => string;
	/** create an exposed uncatchable error*/
	$error: (options: PipelineStepErrorOptions) => never;
	$errors: {
		catchable: (options: Omit<PipelineStepErrorOptions, 'status'>) => never;
		exposed: (options: PipelineStepErrorOptions) => never;
		uncatchable: (options: Omit<PipelineStepErrorOptions, 'status'>) => never;
	};
	/** create a file */
	$file: (options: PipelineStepFileOptions) => PipelineStepFile;
	$clearContextData: () => typeof PIPELINE_STEP_RETURN_NULL;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isEmpty: (value: any) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isNotEmpty: (value: any) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isBlank: (value: any) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isNotBlank: (value: any) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	trim: (value: any) => string;
}
```

`$clearContextData` should be particularly noted. Usually, when a step does not return anything or returns null or undefined, it means the
pipeline will continue to execute the next step using the request data received by the current step. This implies that regardless of
whether the input data has been modified in this step, the number and names of the attributes of the input data for the next step will not
change. If `$.$clearContextData()` is returned, it means that the input data is cleared, and the data returned by `$.$clearContextData()` is
used as the input data for the next Step. This data is a Symbol and does not have any meaningful value. When this return serves as the exit
of the entire pipeline, and the pipeline itself is exposed as a Rest API, the response body given to the caller is empty.

> Helper functions may vary depending on customization, and an existing example can be found in the implementation
> of `ServerInitSnippetPipelineStep` in `o23/n90`.