# o23/n90

`o23/n90` is a web application which already includes the following contents:

- All pipeline steps provided by `o23/n3`,
- Pdf generate pipeline step provided by `o23/n5`,
- Excel and CSV generate pipeline step provided by `o23/n6`,
- Yaml configuration parser provided by `o23/n4`,
- Environment parser.

`o23/n90` provides two entry points,

- Web application,
- Database script deployment.

For these two entry points, the initial step is to prepare the environment variables and read the database configuration information.

## Environments

The environment files is defined in `CFG_ENV_FILE`, such as in `package.json`:

```json
{
	"scripts": {
		"start:mssql": "CFG_ENV_FILE=.env.common.basic,.env.dev.mssql.basic,.env.common.print,.env.dev.server nest start",
		"scripts:mssql": "CFG_ENV_FILE=.env.common.basic,.env.dev.mssql.basic,.env.dev.scripts node dist/scripts"
	}
}
```

> There can be multiple configuration files for environment variables, and the higher the position, the higher the priority.

> The default environments files is `.env.common.basic, .env.prod`.

### Environment Parameters

| Name                          | Type   | Default Value | Comments                                                                |
|-------------------------------|--------|---------------|-------------------------------------------------------------------------|
| `app.init.pipelines.dir`      | string |               | Entry point pipelines directory.                                        |
| `app.excluded.pipelines.dirs` | string |               | Exclude directories, connected by `,`, relative to pipelines directory. |

## Database Configuration

### Environment Parameters

| Name                     | Type    | Default Value | Comments                                                                                 |
|--------------------------|---------|---------------|------------------------------------------------------------------------------------------|
| `app.datasource.scan`    | boolean | true          | Auto scan configured datasource or not.                                                  |
| `app.datasource.config`  | string  |               | `o23` configuration datasource name, use `app.datasource.default` instead if not exists. |
| `app.datasource.default` | string  | o23           | `o23` default datasource name.                                                           |
| `typeorm.DB.manual.init` | boolean | false         | Manually initialize database or not. `DB` represents datasource name.                    |

#### TypeORM Entities

The main purpose of using manual initialization of the data source is to address the issue of automatic scanning not being able to add
entities to the data source. If you need to use the pipeline steps listed below, you must first add entities to the data source.

| Pipeline Step                     | Code                  | Description        |
|-----------------------------------|-----------------------|--------------------|
| TypeOrmLoadEntityByIdPipelineStep | `typeorm-load-entity` | Load entity by id. |
| TypeOrmSaveEntityPipelineStep     | `typeorm-save-entity` | Save entity.       |

> Refer to `TypeOrmDataSourceHelper#create` for more information on how to do so.

> We do not recommend using entities to manipulate the data source. Although TypeORM offers many great capabilities, it hides the definition
> of the entity itself within the code, which goes against our goal of putting all logic in the pipeline configuration. However, regardless,
> you can decide which approach to use based on your specific situation.

### Auto Scan

The process for automatically scanning data source configuration for `o23/n99` is as follows:

- Check auto scan flag, should be true (default),
- Check all environment parameter, which match pattern `CFG_TYPEORM_DB_TYPE`, `DB` is datasource name,
- Pick all datasource with `CFG_TYPEORM_DB_MANUAL_INIT` is not true,
- Initialize datasource.

In addition to the above process, there is a default required data source configuration for `o23` that will also be automatically scanned.
This data source must exist. The configuration data source name is determined by the environment values of `app.datasource.config`
or `app.datasource.default`. If neither of them is configured, the default value of `o23` will be used.

## Database Script Deployer

Typical web applications usually require one or more databases for support. Therefore, `o23/n99` provides a simple entry point for database
script deployment. Its functionality is similar to Liquibase, but currently it only supports SQL scripts and does not support other file
formats.

Use the following cli to deploy database scripts:

```bash
yarn scripts
```

### Environment Parameters

| Name                          | Type   | Default Value | Comments                                                                |
|-------------------------------|--------|---------------|-------------------------------------------------------------------------|
| `app.init.pipelines.dir`      | string | scripts       | Entry point pipelines directory.                                        |
| `app.excluded.pipelines.dirs` | string |               | Exclude directories, connected by `,`, relative to pipelines directory. |

> To scan the script directory, the script release entry registers a pipeline step called `scripts-load-files`. This step only takes effect
> when executing a script release and will not take effect when starting the web application.

The deployer first scans the required pipelines using the environment variable value of `app.init.pipelines.dir`. If this configuration is
not available, the default value of `scripts` will be used.

### Process

Currently, there are two steps to publish the database scripts:

- Detects whether the script log table exists. If not, create them,
- Scan the script files in the directory specified by the environment variable `app.db.scripts.dir` and execute them one by one.

Please note that before executing any script, a script publication log is used to compare the file MD5. If they do not match, the script
execution will be interrupted. If the script has already been executed, it will be skipped.

Script files must have a suffix of `.dml.sql` or `.ddl.sql` and are executed in alphabetical order based on the directory name and file
name.

> It should be noted that the Oracle Driver does not support executing multiple SQL statements in a single Statement. Thus, each SQL file
> can only contain one SQL statement.

## Web Application

Use the following cli to start web application:

```bash
yarn start
```

### Environment Parameters

| Name                          | Type    | Default Value | Comments                                                                |
|-------------------------------|---------|---------------|-------------------------------------------------------------------------|
| `app.init.pipelines.dir`      | string  | server        | Entry point pipelines directory.                                        |
| `app.excluded.pipelines.dirs` | string  |               | Exclude directories, connected by `,`, relative to pipelines directory. |
| `app.examples.enabled`        | boolean | false         | Enabled simple pipeline example.                                        |

### Pipeline Types

For a web application, there are several types of pipelines, including:

- Startup pipelines, typically used to load initial data, which are executed before starting the service,
- API pipelines, used to expose API services externally,
- Standard pipelines, generally invoked by other pipelines during the execution of the service.

To select the startup pipeline first, an additional `initOnly` or `init-only` property has been added to the YAML configuration. If this
property is set to true, the pipeline is considered to only serve the startup phase and will not exist in the application after startup is
complete.

> `o23/n99` additionally provides a startup pipeline for loading pipeline configurations stored in the database, which can be found
> in `server/01-init-server/001-load-all-pipelines.yaml`, base on database table `T_O23_PIPELINES`.

> To load pipelines from database, the server release entry registers a pipeline step called `server-init-snippet`. This step only takes
> effect
> when executing a server release and will not take effect when deploying database scripts.

### More Steps in Server

`o23/n99` offers some additional pipeline steps.

#### Pipeline Trigger

Different from `Trigger Pipeline` Step provided by `o23/n3`, the step here not only supports triggering with code, but also supports
triggering directly with pipeline or pipeline step definition. Therefore, there are two forms of data parameters here:

```typescript
// pass request data by data property
export interface PipelineTrigger {
	data?: any;
}

// trigger by pipeline definition, which is content.
// and since pipeline parse cost time, a cache key aslo can be defined to save parsing time in further runs.
export interface PipelineTriggerByContent extends PipelineTrigger {
	content?: string | ParsedDef;
	cacheKey?: string;
}

// trigger by pipeline code, will find pipeline from repository
export interface PipelineTriggerByCode extends PipelineTrigger {
	code?: PipelineCode;
}
```

### Plugins

Use `ServerPipelineStepRegistrar` to register pipeline steps with `o23/n90` in order to expand the capability of the service. Please note
that registering pipeline steps will not affect the script entry points.