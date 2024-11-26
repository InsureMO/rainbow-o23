![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![TypeORM](https://img.shields.io/badge/TypeORM-E83524.svg)
![MySQL](https://img.shields.io/badge/MySQL-white.svg?logo=mysql&logoColor=4479A1&style=social)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-white.svg?logo=postgresql&logoColor=4169E1&style=social)
![MSSQL](https://img.shields.io/badge/MSSQL-white.svg?logo=microsoftsqlserver&logoColor=CC2927&style=social)
![Oracle](https://img.shields.io/badge/Oracle-white.svg?logo=oracle&logoColor=F80000&style=social)

![Module Formats](https://img.shields.io/badge/module%20formats-cjs-green.svg)

# o23/n3

`o23/n3` provides the most basic pipeline steps.

## Snippet Supporting

Almost all pipeline steps use dynamic snippets to some extent. In order to facilitate various operations on objects in the snippet, `o23/n3`
injects rich function support in advance when executing these scripts. All the function support provided by the pipeline steps can be
directly obtained and used in scripts using the `$helpers` handle. For example:

```typescript
const currentTime = $helpers.$date.now();
```

When using scripts, pay attention to the usage of variables. Typically:

- `$factor` represents the incoming data and can be used in most snippet definitions,
- `$result` represents the processed data and only appears in the `toResponse` snippet of `Fragmentary`,
- `$request` represents the original request data and can be used in almost all snippets, but it is not recommended,
- `$helpers` represents function supporting and can be used in all snippets,
- `$options` represents a set of data, usually in error handles.

### Typescript support

In dynamic snippet, TypeScript syntax can also be used. Currently, `o23/n3` is compiled using ES2022 syntax. It is important to note that
dynamic script fragments are function bodies, so `import`/`export` syntax is not supported. Moreover, they are compiled in loose mode, and
the compilation process does not report any errors. Additionally, for script security reasons, the following keywords or classes are also
not supported.

- `process`
- `global`
- `eval`
- `Function`

## Basic Steps

### Fragmentary

Usually, when processing logic, we do not need all the memory contexts, but only need to extract certain fragments for processing and return
the processing results to the context for subsequent logic to continue processing. Therefore, `o23/n3` provides a relevant implementation,
allowing pipeline steps to flexibly access the relevant memory data and write back the processed result data to the context in the required
format. All pipeline steps should inherit from this implementation to obtain the same capabilities.

#### Constructor Parameters

| Name                     | Type                                                                                                           | Default Value | Comments                            |
|--------------------------|----------------------------------------------------------------------------------------------------------------|---------------|-------------------------------------|
| fromRequest              | ScriptFuncOrBody\<GetInFragmentFromRequestFunc>                                                                |               | Get data from request.              |
| toResponse               | ScriptFuncOrBody\<SetOutFragmentToResponseFunc>                                                                |               | Write data to response.             |
| mergeRequest             | boolean or string                                                                                              | false         | Shortcut to merge data to response. |
| errorHandles.catchable   | ScriptFuncOrBody<HandleCatchableError<In, InFragment, OutFragment>><br>or Array\<PipelineStepBuilder>          |               | Catchable error handler.            |
| errorHandles.uncatchable | ScriptFuncOrBody<HandleUncatchableError<In, InFragment, OutFragment>><br>or Array\<PipelineStepBuilder>        |               | Uncatchable error handler.          |
| errorHandles.exposed     | ScriptFuncOrBody<HandleExposedUncatchableError<In, InFragment, OutFragment>><br>or Array\<PipelineStepBuilder> |               | Exposed uncatchable error handler.  |
| errorHandles.any         | ScriptFuncOrBody<HandleAnyError<In, InFragment, OutFragment>><br>or Array\<PipelineStepBuilder>                |               | Any error handler.                  |

#### Merge Request

| Prerequisite                                         | Behavior                                                                                                                                                  | 
|------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| No `toResponse` defined, `mergeRequest` is true      | Unbox result and merge into original request content.<br> Make sure request content and result can be unboxed.                                            |
| No `toResponse` defined, `mergeRequest` is string    | Use value of `mergeRequest` as key, merge result into original request content.<br> Make sure request content can be unboxed.                             |
| No `toResponse` defined, no `mergeRequest` defined   | Return result directly.                                                                                                                                   |
| With `toResponse` defined, `mergeRequest` is true    | Execute `toResponse` first, unbox result and merge into original request content.<br> Make sure request content and result can be unboxed.                |
| With `toResponse` defined, `mergeRequest` is string  | Execute `toResponse` first, use value of `mergeRequest` as key, merge result into original request content.<br> Make sure request content can be unboxed. |
| With `toResponse` defined, no `mergeRequest` defined | Execute `toResponse` first, return result directly.                                                                                                       |

#### Error Handles

Each type of error handle can be either a snippet or a set of pipeline steps. If it is defined as pipeline steps, the first step will
receive the request data in the following format:

```typescript
const RequestContent = {$code: errorCode, $error: error, $factor: fragment, $request: request};
```

Except for the first step, each subsequent step will receive request data that depends on the processing result of the previous step.

### Get Property

#### Constructor Parameters

| Name         | Type   | Default Value | Comments                                               |
|--------------|--------|---------------|--------------------------------------------------------|
| propertyName | string |               | Supports multi-level property names, connected by `.`. |

> The data source of given property name is after `fromRequest` transformation.

### Delete Property

#### Constructor Parameters

| Name          | Type                     | Default Value | Comments |
|---------------|--------------------------|---------------|----------|
| propertyNames | string or Array\<string> |               |          |

> Multi-level property names is not supported, make sure the data source of given property name is after `fromRequest` transformation.

### Snippet

#### Constructor Parameters

| Name    | Type                           | Default Value | Comments |
|---------|--------------------------------|---------------|----------|
| snippet | ScriptFuncOrBody\<PerformFunc> |               |          |

### Step Sets

#### Constructor Parameters

| Name  | Type                        | Default Value | Comments |
|-------|-----------------------------|---------------|----------|
| steps | Array\<PipelineStepBuilder> |               |          |

Execute the given pipeline steps in order.

### Conditional

#### Constructor Parameters

| Name           | Type                                  | Default Value | Comments |
|----------------|---------------------------------------|---------------|----------|
| check          | ScriptFuncOrBody\<ConditionCheckFunc> |               |          |
| steps          | Array\<PipelineStepBuilder>           |               |          |
| otherwiseSteps | Array\<PipelineStepBuilder>           |               |          |

First, execute the `check` snippet and return true. Then execute the given pipeline steps in order. Otherwise, execute the given `otherwise`
pipeline steps in order.

### Routes (Switch)

#### Constructor Parameters

| Name             | Type                                 | Default Value | Comments |
|------------------|--------------------------------------|---------------|----------|
| conditionalSteps | Array\<RoutesConditionalStepOptions> |               |          |
| otherwiseSteps   | Array\<PipelineStepBuilder>          |               |          |

The conditional step is defined as follows:

```typescript   
export interface RoutesConditionalStepOptions {
	check: ScriptFuncOrBody<ConditionCheckFunc>,
	steps?: Array<PipelineStepBuilder>;
}
```

Execute each given condition `check` in order. If a condition is true, execute the corresponding pipeline steps in order. If none of the
conditions are true, execute the given `otherwise` pipeline steps in order.

### For Each

#### Constructor Parameters

| Name                | Type                        | Default Value | Comments |
|---------------------|-----------------------------|---------------|----------|
| originalContentName | string                      | $content      |          |
| itemName            | string                      | $item         |          |
| steps               | Array\<PipelineStepBuilder> |               |          |

```typescript
const RequestContent = {$code: errorCode, $error: error, $factor: fragment, $request: request};
```

The specified set of pipeline steps will be applied to each element of the array, and all the execution results will be gathered into an
array and returned. It is important to note that the error handles of the `For Each` pipeline steps will be used for each iteration of
executing individual elements, rather than being applied to the execution of the array as a whole. If the array is empty, the given pipeline
steps will not be executed. The request data obtained in the first step of each element's execution will appear in the following format:

```typescript
const RequestContent = {$content: content, $item: element, $semaphore};
```

If you need to terminate the loop prematurely, you just need to return the `$semaphore` signal from the request data. The loop will
automatically end, and the collected processing results will be gathered and returned as an array.

### Parallel

#### Constructor Parameters

| Name      | Type                                                              | Default Value | Comments                                      |
|-----------|-------------------------------------------------------------------|---------------|-----------------------------------------------|
| cloneData | ScriptFuncOrBody\<CloneDataFunc\<In, InFragment, EachInFragment>> |               | Clone request data for each step.             |
| race      | boolean                                                           | false         | Returns first settled result if race is true. |

The specified set of pipeline steps will be executed parallel, and

- All the execution results will be gathered into an array and returned when `race` is false,
- Returns the first settled result when `race` is true,

It is important to note that

- Each sub pipeline step will use the same request data, they share the same content memory address. So please be very
  careful <span style='color: red;'>**NOT**</span> to attempt to modify the request data in the sub pipeline steps. Alternatively, you can
  use `cloneData` to create a copy of the request data for each sub pipeline steps, so that request data operations can be modified in
  certain sub pipeline steps without affecting other sub pipeline steps.
- The error handles of the `For Each` pipeline step will be used for each iteration of executing individual elements, rather than being
  applied to the execution of the array as a whole.

### Trigger Pipeline

#### Constructor Parameters

| Name | Type   | Default Value | Comments       |
|------|--------|---------------|----------------|
| code | string |               | Pipeline code. |

Execute the specified pipeline.

### Trigger Pipeline Step

#### Constructor Parameters

| Name | Type   | Default Value | Comments            |
|------|--------|---------------|---------------------|
| code | string |               | Pipeline step code. |

Execute the specified pipeline step.

### Async

#### Constructor Parameters

| Name  | Type                        | Default Value | Comments |
|-------|-----------------------------|---------------|----------|
| steps | Array\<PipelineStepBuilder> |               |          |

Execute the given pipeline steps in order, but asynchronous. Therefore, no result returned.

## Database (TypeOrm) Steps

### Environment Parameters

| Name                        | Type    | Default Value | Comments                                  |
|-----------------------------|---------|---------------|-------------------------------------------|
| `typeorm.DB.type`           | string  |               | Database type, `mysql`, `better-sqlite3`. |
| `typeorm.DB.kept.on.global` | boolean |               | Keep database instance in memory or not.  |

`DB` represents database name.

- For mysql, default kept on global is true,
- For Better-SQLite3, default kept on global is false.

#### MySQL

When `typeorm.DB.type=mysql`:

| Name                                | Type    | Default Value       | Comments                                                                                                              |
|-------------------------------------|---------|---------------------|-----------------------------------------------------------------------------------------------------------------------|
| `typeorm.DB.host`                   | string  | localhost           | MySQL host.                                                                                                           |
| `typeorm.DB.port`                   | number  | 3306                | MySQL port.                                                                                                           |
| `typeorm.DB.username`               | string  |                     | MySQL username.                                                                                                       |
| `typeorm.DB.password`               | string  |                     | MySQL password.                                                                                                       |
| `typeorm.DB.database`               | string  |                     | MySQL database name.                                                                                                  |
| `typeorm.DB.charset`                | string  |                     | MySQL database charset.                                                                                               |
| `typeorm.DB.timezone`               | string  |                     | MySQL database timezone.                                                                                              |
| `typeorm.DB.pool.size`              | number  |                     | MySQL connection pool size.                                                                                           |
| `typeorm.DB.synchronize`            | boolean | false               |                                                                                                                       |
| `typeorm.DB.logging`                | boolean | false               |                                                                                                                       |
| `typeorm.DB.connect.timeout`        | number  |                     |                                                                                                                       |
| `typeorm.DB.acquire.timeout`        | number  |                     |                                                                                                                       |
| `typeorm.DB.insecure.auth`          | boolean |                     |
| `typeorm.DB.support.big.numbers`    | boolean | true                |                                                                                                                       |
| `typeorm.DB.big.number.strings`     | boolean | false               |                                                                                                                       |
| `typeorm.DB.date.strings`           | boolean |                     |                                                                                                                       |
| `typeorm.DB.debug`                  | boolean |                     |                                                                                                                       |
| `typeorm.DB.trace`                  | boolean |                     |                                                                                                                       |
| `typeorm.DB.multiple.statements`    | boolean | false               |                                                                                                                       |
| `typeorm.DB.legacy.spatial.support` | boolean |                     |                                                                                                                       |
| `typeorm.DB.timestamp.format.write` | string  | %Y-%m-%d %H:%k:%s   | MySQL timestamp write format, should compatible with `format.datetime`, which default value is `YYYY-MM-DD HH:mm:ss`. |
| `typeorm.DB.timestamp.format.read`  | string  | YYYY-MM-DD HH:mm:ss | MySQL timestamp read format.                                                                                          |

> Mysql driver read `DateTime` column to javascript `string`.

#### PostgreSQL

When `typeorm.DB.type=pgsql`:

| Name                                | Type    | Default Value            | Comments                                                                                                              |
|-------------------------------------|---------|--------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `typeorm.DB.host`                   | string  | localhost                | PgSQL host.                                                                                                           |
| `typeorm.DB.port`                   | number  | 5432                     | PgSQL port.                                                                                                           |
| `typeorm.DB.username`               | string  |                          | PgSQL username.                                                                                                       |
| `typeorm.DB.password`               | string  |                          | PgSQL password.                                                                                                       |
| `typeorm.DB.database`               | string  |                          | PgSQL database name.                                                                                                  |
| `typeorm.DB.schema`                 | string  |                          | PgSQL schema name.                                                                                                    |
| `typeorm.DB.pool.size`              | number  |                          | PgSQL connection pool size.                                                                                           |
| `typeorm.DB.synchronize`            | boolean | false                    |                                                                                                                       |
| `typeorm.DB.logging`                | boolean | false                    |                                                                                                                       |
| `typeorm.DB.connect.timeout`        | number  |                          |                                                                                                                       |
| `typeorm.DB.timestamp.format.write` | string  | YYYY-MM-DD HH24:MI:SS    | PgSQL timestamp write format, should compatible with `format.datetime`, which default value is `YYYY-MM-DD HH:mm:ss`. |
| `typeorm.DB.timestamp.format.read`  | string  | YYYY-MM-DDTHH:mm:ss.SSSZ | PgSQL timestamp read format.                                                                                          |

> PgSQL driver read `DateTime` column to javascript `Date`.

#### MSSQL

When `typeorm.DB.type=mssql`:

| Name                                            | Type    | Default Value       | Comments                                                                                                              |
|-------------------------------------------------|---------|---------------------|-----------------------------------------------------------------------------------------------------------------------|
| `typeorm.DB.host`                               | string  | localhost           | MSSQL host.                                                                                                           |
| `typeorm.DB.port`                               | number  | 5432                | MSSQL port.                                                                                                           |
| `typeorm.DB.username`                           | string  |                     | MSSQL username.                                                                                                       |
| `typeorm.DB.password`                           | string  |                     | MSSQL password.                                                                                                       |
| `typeorm.DB.database`                           | string  |                     | MSSQL database name.                                                                                                  |
| `typeorm.DB.schema`                             | string  |                     | MSSQL schema name.                                                                                                    |
| `typeorm.DB.pool.size`                          | number  |                     | MSSQL connection pool size.                                                                                           |
| `typeorm.DB.synchronize`                        | boolean | false               |                                                                                                                       |
| `typeorm.DB.logging`                            | boolean | false               |                                                                                                                       |
| `typeorm.DB.authentication.type`                | string  |                     | MSSQL authentication type.                                                                                            |
| `typeorm.DB.domain`                             | string  |                     | MSSQL domain.                                                                                                         |
| `typeorm.DB.azure.ad.access.token`              | string  |                     | MSSQL azure ad access token.                                                                                          |
| `typeorm.DB.azure.ad.msi.app.service.client.id` | string  |                     | MSSQL azure ad msi app service client id.                                                                             |
| `typeorm.DB.azure.ad.msi.app.service.endpoint`  | string  |                     | MSSQL azure ad msi app service endpoint.                                                                              |
| `typeorm.DB.azure.ad.msi.app.service.secret`    | string  |                     | MSSQL azure ad msi app service secret.                                                                                |
| `typeorm.DB.azure.ad.msi.vm.client.id`          | string  |                     | MSSQL azure ad msi vm client id.                                                                                      |
| `typeorm.DB.azure.ad.msi.vm.endpoint`           | string  |                     | MSSQL azure ad msi vm endpoint.                                                                                       |
| `typeorm.DB.azure.ad.msi.vm.client.secret`      | string  |                     | MSSQL azure ad msi vm client secret.                                                                                  |
| `typeorm.DB.azure.ad.msi.vm.tenant.id`          | string  |                     | MSSQL azure ad msi vm tenant id.                                                                                      |
| `typeorm.DB.connect.timeout`                    | number  |                     |                                                                                                                       |
| `typeorm.DB.request.timeout`                    | number  |                     |                                                                                                                       |
| `typeorm.DB.pool.max`                           | number  | 5                   |                                                                                                                       |
| `typeorm.DB.pool.min`                           | number  | 1                   |                                                                                                                       |
| `typeorm.DB.pool.acquire.timeout`               | number  |                     |                                                                                                                       |
| `typeorm.DB.pool.idle.timeout`                  | number  |                     |                                                                                                                       |
| `typeorm.DB.instance`                           | string  |                     |                                                                                                                       |
| `typeorm.DB.ansi.null.enabled`                  | boolean |                     |                                                                                                                       |
| `typeorm.DB.cancel.timeout`                     | number  |                     |                                                                                                                       |
| `typeorm.DB.use.utc`                            | boolean |                     |                                                                                                                       |
| `typeorm.DB.encrypt`                            | boolean |                     |                                                                                                                       |
| `typeorm.DB.crypto.credentials`                 | string  |                     |                                                                                                                       |
| `typeorm.DB.tds.version`                        | string  |                     |                                                                                                                       |
| `typeorm.DB.arithmetic.abort`                   | boolean |                     |                                                                                                                       |
| `typeorm.DB.trust.server.certificate`           | boolean |                     |                                                                                                                       |
| `typeorm.DB.timestamp.format.write`             | string  | yyyy-MM-dd hh:mm:ss | MSSQL timestamp write format, should compatible with `format.datetime`, which default value is `YYYY-MM-DD HH:mm:ss`. |
| `typeorm.DB.timestamp.format.read`              | string  | YYYY-MM-DD HH:mm:ss | MSSQL timestamp read format.                                                                                          |

> [MSSQL of TypeORM](https://typeorm.io/data-source-options#mssql-data-source-options) for more details.

> MSSQL driver read `DateTime` column to javascript `Date`.

#### Oracle

When `typeorm.DB.type=oracle`:

| Name                                | Type    | Default Value         | Comments                                                                                                               |
|-------------------------------------|---------|-----------------------|------------------------------------------------------------------------------------------------------------------------|
| `typeorm.DB.host`                   | string  | localhost             | Oracle host.                                                                                                           |
| `typeorm.DB.port`                   | number  | 5432                  | Oracle port.                                                                                                           |
| `typeorm.DB.username`               | string  |                       | Oracle username.                                                                                                       |
| `typeorm.DB.password`               | string  |                       | Oracle password.                                                                                                       |
| `typeorm.DB.database`               | string  |                       | Oracle database name.                                                                                                  |
| `typeorm.DB.sid`                    | string  |                       | Oracle database sid.                                                                                                   |
| `typeorm.DB.service.name`           | string  |                       | Oracle database service name.                                                                                          |
| `typeorm.DB.connect.string`         | string  |                       | Oracle connect string.                                                                                                 |
| `typeorm.DB.schema`                 | string  |                       | Oracle schema name.                                                                                                    |
| `typeorm.DB.pool.size`              | number  |                       | Oracle connection pool size.                                                                                           |
| `typeorm.DB.synchronize`            | boolean | false                 |                                                                                                                        |
| `typeorm.DB.logging`                | boolean | false                 |                                                                                                                        |
| `typeorm.DB.timestamp.format.write` | string  | YYYY-MM-DD HH24:MI:SS | Oracle timestamp write format, should compatible with `format.datetime`, which default value is `YYYY-MM-DD HH:mm:ss`. |
| `typeorm.DB.timestamp.format.read`  | string  | YYYY-MM-DD HH:mm:ss   | Oracle timestamp read format.                                                                                          |

> Oracle driver read `DateTime` column to javascript `Date`.

#### Better SQLite3

When `typeorm.DB.type=better-sqlite3`:

| Name                     | Type    | Default Value | Comments |
|--------------------------|---------|---------------|----------|
| `typeorm.DB.database`    | string  | :memory:      |          |
| `typeorm.DB.synchronize` | boolean | false         |          |
| `typeorm.DB.logging`     | boolean | false         |          |

> SQLite save `DateTime` column as javascript `string`.

> NEVER use it in production.

### Constructor Parameters

| Name            | Type    | Default Value | Comments                       |
|-----------------|---------|---------------|--------------------------------|
| dataSourceName  | string  |               | Database name, `DB`.           |
| transactionName | string  |               | Transaction name.              |
| autonomous      | boolean | false         | Autonomous transaction or not. |

Autonomous transactions take precedence over the transaction name, meaning that if an autonomous transaction is enabled, the transaction
specified by the transaction name will be ignored. If you need to use the transaction name, you must nest the pipeline steps within
transactional step sets, and ensure that the datasource name and transaction name remain the same.

### By SQL

#### Environment Parameters

| Name                        | Type    | Default Value | Comments                 |
|-----------------------------|---------|---------------|--------------------------|
| `typeorm.sql.cache.enabled` | boolean | true          | Cache parsed sql or not. |

> Parsed SQL will not be cached when there is one-of syntax.

#### Constructor Parameters

| Name | Type   | Default Value | Comments |
|------|--------|---------------|----------|
| sql  | string |               | SQL      |

#### Native SQL Support & Enhancement

SQL supports native database syntax. At the same time, `o23/n3` enhances SQL syntax, allowing the use of the `$property` syntax to retrieve
corresponding data from data objects, also supports multi-level property names, connected by `.`. For example, `$person.name` represents
that `person` is an object and `name` is a property under `person`. The following are the supported syntax features:

- `IN ($...names)`: `one-of`, `names` should be an array,
- `LIKE $name%`: `starts-with`,
- `LIKE $%name`: `ends-with`,
- `LIKE $%name%`: `contains`.

> Name mapping is case-sensitive.  
> `LIKE` is case-sensitive.

Since different databases have varying degrees of support for dialects, `o23/n3` also provides appropriate enhanced support for this:

- For pagination, `$.limit($offset, $limit)` will be translated and executed in the appropriate dialect. For example,
	- `MySQL` uses `LIMIT $offset, $limit`,
	- `PostgreSQL` uses `OFFSET $offset LIMIT $limit`.
	- `MSSQL` and `Oracle` use `OFFSET $offset ROWS FETCH NEXT $limit ROWS ONLY`,
	- `MSSQL` requires an `ORDER BY` clause for pagination SQL. If there is no `ORDER BY` clause, will
	  use `ORDER BY 1 OFFSET $offset ROWS FETCH NEXT $limit ROWS ONLY`.
- For JSON column, because some databases (such as MSSQL) do not have a JSON column type, they cannot automatically replace strings in the
  result set with JSON objects,
	- Use `config as "config.@json"` to explicitly indicate that the `config` column is of JSON data type.
	- Use `$config.@json` to explicitly indicate that the `config` property of given parameters is of JSON data type.
- For boolean column which use numeric(int/smallint/tinyint) as storage type, because some databases (such as PostgreSQL) cannot
  automatically convert boolean values in memory to numeric 0 or 1 in the database,
	- Use `enabled as "enabled.@bool"` to explicitly indicate that the `enabled` column is of boolean in-memory and numeric in database data
	  type.
	- Use `$enabled.@bool` to explicitly indicate that the `enabled` property of given parameters is of boolean in-memory and numeric in
	  database data type.
- For datetime (MySQL, MSSQL) / timestamp (Oracle, PostgreSQL) column,
	- Use `created_at as "createdAt.@ts"` to explicitly indicate that the `createdAt` column is of string in-memory and timestamp in
	  database data type.
	- Use `$createdAt.@ts` to explicitly indicate that the `createdAt` property of given parameters is of string in-memory and timestamp in
	  database data type.

> We recommend that if you need to consider support for multiple database dialects, using enhanced syntax will make it easier to write SQL.
> If you only need to support a specific database, then using its standard syntax is sufficient.

> It is important to note that some databases (such as `PostgreSQL`) do not differentiate column names by case. This can affect the property
> names of the returned objects in the result set (usually recommended in camel case). Therefore, even though it is not a syntax
> enhancement, it is strongly recommended to use aliases to standardize the column names in the returned result set, for
> example, `PERSON_NAME AS "personName"`, please pay attention to the use of quotation marks to correctly preserve the case.

#### Load One by SQL

##### Request and Response

```typescript
// request
export interface TypeOrmLoadBasis extends TypeOrmBasis {
	params?: Array<TypeOrmEntityValue> | TypeOrmEntityToSave;
}

// response
export type TypeOrmEntityToLoad = Undefinable<DeepPartial<ObjectLiteral>>;
```

#### Load Many by SQL

##### Request and Response

```typescript
// request
export interface TypeOrmLoadBasis extends TypeOrmBasis {
	params?: Array<TypeOrmEntityValue> | TypeOrmEntityToSave;
}

// response
Array<TypeOrmEntityToLoad>;
```

#### Load Many by SQL, Use Cursor

##### Environment Parameters

| Name                    | Type   | Default Value | Comments    |
|-------------------------|--------|---------------|-------------|
| `typeorm.DB.fetch.size` | number | 20            | Fetch size. |

##### Request and Response

```typescript
// request
export interface TypeOrmLoadBasis extends TypeOrmBasis {
	params?: Array<TypeOrmEntityValue> | TypeOrmEntityToSave;
}

// response
Array<any>;
```

By specifying `fetchSize`, each batch of data retrieved will execute sub-steps. Before executing the sub-steps, the data to be passed to it
will be calculated using the `streamTo` function. If `streamTo` is not specified, the batch of data retrieved itself will be passed to the
sub-steps. If the sub-steps is not specified, all retrieved data will be merged and returned.

Therefore, the number of times the sub-step is executed is related to the quantity of data and the `fetchSize`. Meanwhile, each time the
sub-step is invoked, the context will include a `$$typeOrmCursorRound` variable indicating the current batch (starting from 0), and a
`$typeOrmCursorEnd` variable indicating whether it is the last batch.

#### Save by SQL

##### Request and Response

```typescript
// request
export interface TypeOrmSaveBasis extends TypeOrmBasis {
	values?: Array<TypeOrmEntityValue> | TypeOrmEntityToSave;
}

// response
export type TypeOrmIdOfInserted = TypeOrmIdType;
export type TypeOrmCountOfAffected = number;
export type TypeOrmWrittenResult = TypeOrmIdOfInserted | TypeOrmCountOfAffected;
```

#### Bulk Save by SQL

##### Request and Response

```typescript
// request
export interface TypeOrmBulkSaveBasis extends TypeOrmBasis {
	items?: Array<Array<TypeOrmEntityValue> | TypeOrmEntityToSave>;
}

// response
export type TypeOrmIdsOfInserted = Array<TypeOrmIdOfInserted>;
export type TypeOrmCountsOfAffected = Array<TypeOrmCountOfAffected>;
export type TypeOrmBulkWrittenResult = TypeOrmIdsOfInserted | TypeOrmCountsOfAffected;
```

### By Snippet

#### Constructor Parameters

| Name    | Type                                  | Default Value | Comments |
|---------|---------------------------------------|---------------|----------|
| snippet | ScriptFuncOrBody\<TypeOrmPerformFunc> |               |          |

A TypeOrm Query Runner instance, `$runner`, will be passed to the snippet, and the snippet can use this instance to perform any operation on
the database.

> You do not need to manually start a transaction, whether you are using autonomous transaction or if it is nested within
> transaction step sets. The `$runner` instance passed to the snippet will automatically start a transaction.

### Transactional

Transactional step sets are a wrapper for a set of pipeline steps that require the same transaction. It means that all the
sub-steps inside a transactional step set can be executed within a single transaction. However, not all sub-steps within the set necessarily
have to be transactional. Only the ones that need to be executed within the same transaction need to define the same transaction name as the
step set. Additionally, nested transactions are also supported, which means Transactional Step Sets can be nested as well.

> Steps with same datasource name and transaction name should be within same transaction.

### Constructor Parameters

| Name            | Type                        | Default Value        | Comments               |
|-----------------|-----------------------------|----------------------|------------------------|
| dataSourceName  | string                      |                      | Datasource name, `DB`. |
| transactionName | string                      | $default-transaction | Transaction name.      |
| steps           | Array\<PipelineStepBuilder> |                      | Sub steps.             |

## Http Steps

### Fetch

#### Environment Parameters

| Name                                | Type   | Default Value | Comments                                                                                                                          |
|-------------------------------------|--------|---------------|-----------------------------------------------------------------------------------------------------------------------------------|
| `endpoints.SYSTEM.ENDPOINT.url`     | string |               | Endpoint URL.                                                                                                                     |
| `endpoints.SYSTEM.ENDPOINT.headers` | string |               | Endpoint request headers, use global headers if this parameter doesn't present.<br>Format follows `name=value[;name=value[...]]`. |
| `endpoints.SYSTEM.global.headers`   | string |               | Endpoint system global request headers.<br>Format follows `name=value[;name=value[...]]`.                                         |
| `endpoints.SYSTEM.ENDPOINT.timeout` | number |               | Endpoint request timeout, in seconds, use global timeout if this parameter doesn't present.                                       |
| `endpoints.SYSTEM.global.timeout`   | number | -1            | Endpoint system global timeout, in seconds, `-1` represents no timeout.                                                           |

`SYSTEM` represents endpoint system, `ENDPOINT` represents endpoint url. For example:

```properties
CFG_ENDPOINTS_ORDER_PURCHASE_URL=https://order.com/purchase
CFG_ENDPOINTS_ORDER_PAYMENT_URL=https://order.com/payment
```

>

#### Constructor Parameters

| Name                 | Type                                                                                                   | Default Value | Comments                                                                                                             |
|----------------------|--------------------------------------------------------------------------------------------------------|---------------|----------------------------------------------------------------------------------------------------------------------|
| endpointSystemCode   | string                                                                                                 |               | Endpoint system code.                                                                                                |
| endpointName         | string                                                                                                 |               | Endpoint name.                                                                                                       |
| urlGenerate          | ScriptFuncOrBody\<HttpGenerateUrl>                                                                     |               | Endpoint url generator, `$endpointUrl`.                                                                              |
| method               | string                                                                                                 |               | Http method, default `post`.                                                                                         |
| timeout              | number                                                                                                 |               | Endpoint timeout, in seconds.                                                                                        |
| headersGenerate      | ScriptFuncOrBody\<HttpGenerateHeaders>                                                                 |               | Endpoint request headers generator.                                                                                  |
| bodyUsed             | boolean                                                                                                |               | Send request with body or not, or automatically disregards the body when sending a `get` request when not specified. |
| bodyGenerate         | ScriptFuncOrBody\<HttpGenerateBody>                                                                    |               | Endpoint request body generator.                                                                                     |
| responseGenerate     | ScriptFuncOrBody\<HttpGenerateResponse>                                                                |               | Endpoint response body generator, `$response`.                                                                       |
| responseErrorHandles | ScriptFuncOrBody\<HttpHandleError><br>or<br>{[key: HttpErrorCode]: ScriptFuncOrBody\<HttpHandleError>} |               | Endpoint response error handlers.                                                                                    |

## Installation

Note since `nestjs` only support commonjs module, which means `node-fetch` 3 series cannot be imported since it is built on esm mode.