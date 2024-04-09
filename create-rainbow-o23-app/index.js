'use strict';

var chalk = require('chalk');
var fs = require('fs-extra');
var path = require('path');
var prompts = require('prompts');
var child_process = require('child_process');
var validate = require('validate-npm-package-name');

var Plugins;
(function (Plugins) {
    Plugins["PRINT"] = "print";
    Plugins["AWS_S3"] = "aws-s3";
})(Plugins || (Plugins = {}));
var DatasourceTypes;
(function (DatasourceTypes) {
    DatasourceTypes["MySQL"] = "mysql";
    DatasourceTypes["MSSQL"] = "mssql";
    DatasourceTypes["PgSQL"] = "pgsql";
    DatasourceTypes["Oracle"] = "oracle";
})(DatasourceTypes || (DatasourceTypes = {}));
var PackageManager;
(function (PackageManager) {
    PackageManager["NPM"] = "npm";
    PackageManager["PNPM"] = "pnpm";
    PackageManager["YARN"] = "yarn";
})(PackageManager || (PackageManager = {}));

const findDataSources = () => {
    const options = {};
    process.argv.slice(3)
        .map(arg => arg.split('='))
        .forEach(([key, value]) => {
        switch (key) {
            case '--config-ds-name':
                options.configDataSourceName = value;
                break;
            case '--config-ds-type':
                if (Object.values(DatasourceTypes).includes(value)) {
                    options.configDataSourceType = value;
                }
                break;
            case '--mysql-ds-names':
                options.mysqlDataSourceNames = value.split(',');
                break;
            case '--pgsql-ds-names':
                options.pgsqlDataSourceNames = value.split(',');
                break;
            case '--oracle-ds-names':
                options.oracleDataSourceNames = value.split(',');
                break;
            case '--mssql-ds-names':
                options.mssqlDataSourceNames = value.split(',');
                break;
            case '--use-ds-defaults':
                options.configDataSourceName = options.configDataSourceName ?? 'o23';
                options.configDataSourceType = options.configDataSourceType ?? DatasourceTypes.MySQL;
                options.mysqlDataSourceNames = options.mysqlDataSourceNames ?? [];
                options.pgsqlDataSourceNames = options.pgsqlDataSourceNames ?? [];
                options.oracleDataSourceNames = options.oracleDataSourceNames ?? [];
                options.mssqlDataSourceNames = options.mssqlDataSourceNames ?? [];
                break;
        }
    });
    return options;
};
const getDatasourceOptions = async () => {
    const options = findDataSources();
    const result = await prompts([
        (options.configDataSourceName ?? '').trim().length !== 0 ? null : {
            name: 'configDataSourceName',
            type: 'text',
            message: 'Configuration datasource name:',
            initial: 'o23'
        },
        options.configDataSourceType != null ? null : {
            name: 'configDataSourceType',
            type: 'select',
            message: 'Configuration datasource type:',
            choices: [
                DatasourceTypes.MySQL, DatasourceTypes.PgSQL, DatasourceTypes.MSSQL, DatasourceTypes.Oracle
            ].map((i) => ({ title: i, value: i }))
        },
        options.mysqlDataSourceNames != null ? null : {
            name: 'mysqlDataSourceNames',
            type: 'list',
            message: 'More MySQL datasource names, separated by ",":'
        },
        options.pgsqlDataSourceNames != null ? null : {
            name: 'pgsqlDataSourceNames',
            type: 'list',
            message: 'More PostgreSQL datasource names, separated by ",":'
        },
        options.oracleDataSourceNames != null ? null : {
            name: 'oracleDataSourceNames',
            type: 'list',
            message: 'More Oracle datasource names, separated by ",":'
        },
        options.mssqlDataSourceNames != null ? null : {
            name: 'mssqlDataSourceNames',
            type: 'list',
            message: 'More SQL Server datasource names, separated by ",":'
        }
    ].filter(x => x != null));
    return { ...options, ...result };
};
const computeDatasourceTypes = (options) => {
    const { configDataSourceType, mysqlDataSourceNames, pgsqlDataSourceNames, oracleDataSourceNames, mssqlDataSourceNames } = options;
    const dataSourceTypes = [configDataSourceType];
    [
        [mysqlDataSourceNames, DatasourceTypes.MySQL],
        [pgsqlDataSourceNames, DatasourceTypes.PgSQL],
        [oracleDataSourceNames, DatasourceTypes.Oracle],
        [mssqlDataSourceNames, DatasourceTypes.MSSQL]
    ]
        .map(([names, type]) => {
        return [(names ?? []).filter(name => name != null && name.trim().length !== 0), type];
    }).filter(([names]) => {
        return names.length !== 0;
    }).forEach(([names, type]) => {
        if (names != null && names.length !== 0) {
            dataSourceTypes.push(type);
        }
    });
    return [...new Set(dataSourceTypes)];
};
const writeDatasourceOptions = (json, options) => {
    const dataSourceTypes = computeDatasourceTypes(options);
    [
        [DatasourceTypes.Oracle, ['oracledb']],
        [DatasourceTypes.PgSQL, ['pg', 'pg-query-stream']],
        [DatasourceTypes.MSSQL, ['mssql']],
        [DatasourceTypes.MySQL, ['mysql2']]
    ]
        .forEach(([type, dependencies]) => {
        if (!dataSourceTypes.includes(type)) {
            dependencies.forEach(dependency => {
                delete json.dependencies[dependency];
            });
        }
    });
    [
        'start:mssql', 'start:pgsql', 'start:oracle',
        'dev:standalone:start:mssql', 'dev:standalone:start:pgsql', 'dev:standalone:start:oracle',
        'scripts:mssql', 'scripts:pgsql', 'scripts:oracle'
    ].forEach(key => delete json.scripts[key]);
    Object.keys(json.scripts).forEach(key => {
        if (key.endsWith(':mysql')) {
            const newKey = key.replace(/:mysql$/, '');
            json.scripts[newKey] = json.scripts[key]
                .replace(':mysql', '')
                .replace('envs/dev/.mysql.basic', 'envs/dev/.datasources');
            delete json.scripts[key];
        }
    });
};
const datasourceNameToConfigKey = (name) => {
    return name
        .split('.')
        .filter(s => s.trim().length !== 0)
        .map(s => s.toUpperCase())
        .join('_');
};
const createDatasourceProperties = (baseProperties, datasourceName) => {
    return baseProperties.map(line => {
        if (typeof line === 'string') {
            return line.replace('_O23_', `_${datasourceNameToConfigKey(datasourceName)}_`);
        }
        else {
            const [key, value] = line;
            return `${key.replace('_O23_', `_${datasourceNameToConfigKey(datasourceName)}_`)}=${value}`;
        }
    }).join('\n');
};
const readDatasourceEnvs = (directory, configDataSourceType) => {
    const envs = {};
    Object.values(DatasourceTypes).forEach(type => {
        const content = fs.readFileSync(path.resolve(directory, 'envs', 'dev', `.${type}.basic`)).toString();
        envs[type] = content.split('\n')
            .map(line => {
            if (line === '# configuration database'
                || line === 'CFG_APP_DATASOURCE_DEFAULT=o23'
                || line === 'CFG_APP_DATASOURCE_CONFIG=o23') {
                return null;
            }
            if (line.startsWith('#') || line.trim().length === 0) {
                return line;
            }
            else {
                const [key, value] = line.split('=');
                return [key, value];
            }
        }).filter(line => line != null);
        fs.rmSync(path.resolve(directory, 'envs', 'dev', `.${type}.basic`));
        if (configDataSourceType !== type) {
            fs.rmSync(path.resolve(directory, 'db-scripts', type), { recursive: true, force: true });
        }
    });
    return envs;
};
const buildDatasourceEnvFile = (options, directory) => {
    const { configDataSourceName, configDataSourceType, mysqlDataSourceNames, pgsqlDataSourceNames, oracleDataSourceNames, mssqlDataSourceNames } = options;
    const envs = readDatasourceEnvs(directory, configDataSourceType);
    let content = `# configuration data source, always same as default
CFG_APP_DATASOURCE_DEFAULT=${configDataSourceName}
CFG_APP_DATASOURCE_CONFIG=${configDataSourceName}

`;
    const properties = [
        [configDataSourceType, [configDataSourceName]],
        [DatasourceTypes.MySQL, Array.isArray(mysqlDataSourceNames) ? mysqlDataSourceNames : [mysqlDataSourceNames]],
        [DatasourceTypes.PgSQL, Array.isArray(pgsqlDataSourceNames) ? pgsqlDataSourceNames : [pgsqlDataSourceNames]],
        [DatasourceTypes.Oracle, Array.isArray(oracleDataSourceNames) ? oracleDataSourceNames : [oracleDataSourceNames]],
        [DatasourceTypes.MSSQL, Array.isArray(mssqlDataSourceNames) ? mssqlDataSourceNames : [mssqlDataSourceNames]]
    ]
        .map(([type, names]) => {
        return [type, (names ?? []).filter(name => name != null && name.trim().length !== 0)];
    }).filter(([, names]) => {
        return names.length !== 0;
    }).map(([type, names]) => {
        return (names)
            .filter(name => name != null && name.trim().length !== 0)
            .map(name => {
            return `# Datasource ${name}
${createDatasourceProperties(envs[type], name)}`;
        }).join('\n');
    }).join('\n');
    content = content + properties;
    fs.writeFileSync(path.resolve(directory, 'envs', 'dev', '.datasources'), content);
};
const writeDatasourceFiles = (options, pluginOptions, directory) => {
    const { configDataSourceType } = options;
    const { plugins } = pluginOptions;
    buildDatasourceEnvFile(options, directory);
    if (!plugins.includes(Plugins.PRINT)) {
        fs.rmSync(path.resolve(directory, 'db-scripts', configDataSourceType, '0.1.0', '03-print'), {
            recursive: true, force: true
        });
    }
};

const help = () => {
    console.log(`${chalk.green('Usage: ')} npx create-rainbow-o23-app my-app [options]`);
    console.log(`${chalk.green('       ')} yarn create rainbow-o23-app my-app [options]`);
    console.log();
    console.log(`${chalk.green('Options:')}`);
    console.log(`  --help                                                      Show help`);
    console.log(`  --fix-name                                                  Use the given package name without asking for confirmation`);
    console.log(`  --default-desc                                              Use the default description without asking for confirmation`);
    console.log(`  --package-manager=<${chalk.yellow('yarn')}/${chalk.yellow('npm')}/${chalk.yellow('pnpm')}>                           Use the specified package manager`);
    console.log(`  --plugin-print                                              Include the print plugin`);
    console.log(`  --plugin-aws-s3                                             Include the AWS S3 plugin`);
    console.log(`  --use-ds-defaults                                           Use the default datasource values, if not provided. Which are: config datasource name: o23, config datasource type: MySQL`);
    console.log(`  --config-ds-name=<name>                                     Configuration datasource name`);
    console.log(`  --config-ds-type=<${chalk.yellow('mysql')}/${chalk.yellow('pgsql')}/${chalk.yellow('oracle')}/${chalk.yellow('mssql')}>                 Configuration datasource type`);
    console.log(`  --mysql-ds-names=<names>                                    More MySQL datasource names, separated by ","`);
    console.log(`  --pgsql-ds-names=<names>                                    More PgSQL datasource names, separated by ","`);
    console.log(`  --oracle-ds-names=<names>                                   More Oracle datasource names, separated by ","`);
    console.log(`  --mssql-ds-names=<names>                                    More MSSQL datasource names, separated by ","`);
    console.log(`  --install                                                   Install dependencies after creating the application`);
    console.log(`  --ignore-install                                            Do not install dependencies after creating the application`);
    console.log();
};

const checkNodeVersion = () => {
    const version = process.versions.node;
    const [major, minor] = version.split('.').map(Number);
    if (major < 18 || (major === 18 && minor < 19)) {
        console.error(chalk.red(`✖ Node version must >= 18.19.0, current is ${version}, please upgrade your Node.js.`));
        process.exit(1);
    }
};
const checkNpmVersion = () => {
    const version = child_process.execSync('npm -v').toString().trim();
    const [major, minor] = version.split('.').map(Number);
    if (major < 10 || (major === 10 && minor < 2)) {
        console.error(chalk.red(`✖ Npm version must >= 10.2.0, current is ${version} please upgrade your npm.`));
        process.exit(1);
    }
};
const checkVersions = () => {
    checkNodeVersion();
    checkNpmVersion();
};
const findPackageManger = () => {
    const [, packageManager] = process.argv.slice(3)
        .find(arg => arg.startsWith('--package-manager='))?.split('=') ?? ['--package-manager', ''];
    if (Object.values(PackageManager).includes(packageManager)) {
        return packageManager;
    }
    else {
        return (void 0);
    }
};
const getPackageManagerOption = async () => {
    const packageManager = findPackageManger();
    if (packageManager != null) {
        return { packageManager };
    }
    return prompts([
        {
            name: 'packageManager',
            type: 'select',
            choices: [PackageManager.YARN, PackageManager.NPM, PackageManager.PNPM].map((i) => ({ title: i, value: i })),
            message: 'Please choose a package manager:'
        }
    ]);
};
const checkYarnVersion = () => {
    const version = child_process.execSync('yarn -v').toString().trim();
    const [major, minor, patch] = version.split('.').map(Number);
    if (major < 1 || (major === 1 && minor < 22) || (major === 1 && minor === 22 && patch < 10)) {
        console.error(chalk.red(`✖ Yarn version must >= 1.22.10, current is ${version} please upgrade your yarn.`));
        process.exit(1);
    }
};
const shouldInstall = () => {
    if (process.argv.slice(3).includes('--install')) {
        return true;
    }
    else if (process.argv.slice(3).includes('--ignore-install')) {
        return false;
    }
    else {
        return (void 0);
    }
};
const install = async (manager, directory) => {
    let should = shouldInstall();
    if (should == null) {
        const answer = await prompts([
            {
                name: 'should',
                type: 'toggle',
                message: 'Do you want to install all the dependencies directly?',
                initial: false,
                active: 'yes',
                inactive: 'no'
            }
        ]);
        should = answer.should;
    }
    if (should) {
        const cmd = manager === 'yarn' ? 'yarn' : (manager + ' i');
        child_process.execSync(cmd, { stdio: 'inherit', cwd: directory });
    }
};

const findPlugins = () => {
    const plugins = [];
    process.argv.slice(3)
        .forEach(arg => {
        switch (arg) {
            case '--plugin-print':
                plugins.push(Plugins.PRINT);
                break;
            case '--plugin-aws-s3':
                plugins.push(Plugins.AWS_S3);
                break;
        }
    });
    return plugins.length === 0 ? (void 0) : plugins;
};
const getPluginOptions = async () => {
    const plugins = findPlugins();
    if (plugins != null) {
        return { plugins };
    }
    else {
        return prompts([
            {
                name: 'plugins',
                type: 'multiselect',
                message: 'Plugins:',
                choices: [
                    Plugins.PRINT,
                    Plugins.AWS_S3
                ].map((i) => ({ title: i, value: i }))
            }
        ]);
    }
};
const writePluginOptions = (json, options) => {
    const { plugins } = options;
    if (!plugins.includes(Plugins.PRINT)) {
        delete json.dependencies['@rainbow-o23/n91'];
        Object.keys(json.scripts).forEach((key) => {
            json.scripts[key] = json.scripts[key].replace(',envs/common/.print', '');
        });
    }
    if (!plugins.includes(Plugins.AWS_S3)) {
        delete json.dependencies['@rainbow-o23/n92'];
    }
};
const writePluginFiles = (options, directory) => {
    const { plugins } = options;
    const pluginIndexTsFile = path.resolve(directory, 'src', 'plugins', 'index.ts');
    let content = fs.readFileSync(pluginIndexTsFile).toString();
    if (!plugins.includes(Plugins.PRINT)) {
        fs.rmSync(path.resolve(directory, 'envs', 'common', '.print'));
        fs.rmSync(path.resolve(directory, 'server', '03-print'), { recursive: true, force: true });
        fs.rmSync(path.resolve(directory, 'src', 'plugins', 'print.ts'));
        fs.rmSync(path.resolve(directory, '.puppeteerrc'));
        content = content.replace('import {usePdfSubTemplates} from \'./print\';\n', '')
            .replace('\tusePdfSubTemplates(options);\n', '');
    }
    if (!plugins.includes(Plugins.AWS_S3)) {
        fs.rmSync(path.resolve(directory, 'src', 'plugins', 'aws.ts'));
        content = content.replace('import \'./aws\';\n', '');
    }
    fs.writeFileSync(pluginIndexTsFile, content);
};

const printValidationResults = (results) => {
    if (typeof results !== 'undefined') {
        results.forEach((error) => console.error(chalk.red(`  - ${error}`)));
    }
};
const validateName = (name) => {
    if (name == null || name.trim().length === 0) {
        console.error(chalk.red('✖ Could not create a project with empty or blank name.'));
        process.exit(1);
    }
    else {
        const validationResult = validate(name);
        if (validationResult.validForNewPackages === false) {
            console.error(chalk.red(`✖ Could not create a project called ${chalk.red.underline(`"${name}"`)} because of npm naming restrictions:`));
            printValidationResults(validationResult.errors);
            printValidationResults(validationResult.warnings);
            process.exit(1);
        }
    }
};
const getPackageDirectory = (packageName) => {
    return path.resolve(packageName.startsWith('@') ? packageName.split('/')[1] : packageName);
};
const isDirectoryEmpty = (directory) => {
    const files = fs.readdirSync(directory);
    return files == null || files.length === 0 || (files.length === 1 && files[0] === '.DS_Store');
};
const createPackageDirectory = (packageName) => {
    const dir = getPackageDirectory(packageName);
    if (fs.existsSync(dir)) {
        if (!isDirectoryEmpty(dir)) {
            const relativeDir = path.relative(process.cwd(), dir);
            console.error(chalk.red(`✖ The directory "${relativeDir}" already exists and is not empty, so it is unable to create the application.`));
            process.exit(1);
        }
    }
    else {
        fs.mkdirpSync(dir);
        fs.mkdirpSync(path.resolve(dir, 'src'));
    }
    return dir;
};
const isNameFixed = () => {
    return process.argv.slice(3).includes('--fix-name');
};
const isDescDefault = () => {
    return process.argv.slice(3).includes('--default-desc');
};
const getStandardOption = async (packageName) => {
    const nameFixed = isNameFixed();
    const useDefaultDescription = isDescDefault();
    if (nameFixed && useDefaultDescription) {
        return {
            name: packageName,
            description: 'An application created based on Rainbow-O23, powered by InsureMO.'
        };
    }
    const result = await prompts([
        nameFixed ? null : {
            name: 'name',
            type: 'text',
            message: 'Package name:',
            initial: packageName
        },
        useDefaultDescription ? null : {
            name: 'description',
            type: 'text',
            message: 'Package description:',
            initial: 'An application created based on Rainbow-O23, powered by InsureMO.'
        }
    ].filter(x => x != null));
    return {
        name: packageName,
        description: 'An application created based on Rainbow-O23, powered by InsureMO.',
        ...result
    };
};
const createPackageJson = (options, directory) => {
    const { name, description } = options;
    fs.copySync(path.resolve(__dirname, './templates'), directory);
    fs.writeFileSync(path.resolve(directory, 'README.md'), `# ${name}\n\n${description}\n`);
    const packageFile = path.resolve(directory, 'package.json');
    const json = JSON.parse(fs.readFileSync(packageFile).toString());
    json.name = name;
    json.version = '0.1.0';
    json.description = description ?? '';
    json.license = 'UNLICENSED';
    delete json.jest;
    delete json.repository;
    delete json.bugs;
    delete json.author;
    return json;
};

const generatePackageJson = async (stdOptions, datasourceOptions, pluginOptions, directory) => {
    const json = createPackageJson(stdOptions, directory);
    writeDatasourceOptions(json, datasourceOptions);
    writePluginOptions(json, pluginOptions);
    const packageFile = path.resolve(directory, 'package.json');
    fs.writeFileSync(packageFile, JSON.stringify(json, null, 2) + '\n');
};
const generateReadme = async (packageName, directory) => {
    const readmeFile = path.resolve(directory, 'README.md');
    let content = fs.readFileSync(readmeFile).toString();
    content = content.replace(/o23\/n99/, packageName);
    fs.writeFileSync(readmeFile, content);
};
const generateFiles = async (datasourceOptions, pluginOptions, directory) => {
    writeDatasourceFiles(datasourceOptions, pluginOptions, directory);
    writePluginFiles(pluginOptions, directory);
    fs.mkdirSync(path.resolve(directory, 'scripts'));
    fs.mkdirSync(path.resolve(directory, 'server'));
};
const create = async () => {
    const packageName = process.argv[2];
    validateName(packageName);
    checkVersions();
    const { packageManager } = await getPackageManagerOption();
    if (packageManager === PackageManager.YARN) {
        checkYarnVersion();
    }
    const directory = createPackageDirectory(packageName);
    const stdOptions = await getStandardOption(packageName);
    const dataSourceOptions = await getDatasourceOptions();
    const pluginOptions = await getPluginOptions();
    await generatePackageJson(stdOptions, dataSourceOptions, pluginOptions, directory);
    await generateReadme(packageName, directory);
    await generateFiles(dataSourceOptions, pluginOptions, directory);
    await install(packageManager, directory);
    console.log();
    console.log(`${chalk.green('✔')} Success! Created ${chalk.cyan.underline(packageName)}.`);
    console.log(`${chalk.green('✔')} Check /envs/dev/.datasources to setup datasources.`);
    console.log();
};
const createApp = async () => {
    if (process.argv.includes('--help')) {
        help();
    }
    else {
        await create();
    }
    process.exit(0);
};

createApp();
