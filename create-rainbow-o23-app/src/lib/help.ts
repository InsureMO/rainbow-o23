import chalk from 'chalk';

export const help = () => {
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
	console.log(`  --plugin-all-packed                                         Include all plugins without asking for confirmation`);
	console.log(`  --plugin-free                                               Do not include any plugin without asking for confirmation`);
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