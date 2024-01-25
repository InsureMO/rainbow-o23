![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![Nest](https://img.shields.io/badge/nest-white.svg?logo=nestjs&logoColor=E0234E&style=social)
![Puppeteer](https://img.shields.io/badge/Puppeteer-white.svg?logo=puppeteer&logoColor=40B5A4&style=social)
![ExcelJS](https://img.shields.io/badge/ExcelJS-white.svg?logo=microsoftexcel&logoColor=217346&style=social)
![CSV for Node.js](https://img.shields.io/badge/CSV%20for%20Node.js-548694.svg)
![dotenv](https://img.shields.io/badge/dotenv-white.svg?logo=dotenv&logoColor=ECD53F&style=social)

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

# Pipeline Configuration

In general, pipelines are divided into two types:

- Providing a publicly accessible REST API,
- Providing internal processing logic.

Pipelines are stored in the following locations:

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
