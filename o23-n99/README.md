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

# Pipeline Step Configuration
