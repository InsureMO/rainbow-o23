import {execSync} from 'child_process';

export enum PackageManager {
	NPM = 'npm', PNPM = 'pnpm', YARN = 'yarn'
}

export const install = (manager: PackageManager, directory: string): void => {
	const cmd = manager === 'yarn' ? 'yarn' : manager + ' i';
	execSync(cmd, {stdio: 'inherit', cwd: directory});
};
