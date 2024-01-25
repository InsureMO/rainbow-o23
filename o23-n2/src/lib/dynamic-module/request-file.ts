import {
	FileTypeValidatorOptions,
	FileValidator,
	MaxFileSizeValidatorOptions,
	ParseFilePipe,
	UploadedFile,
	UploadedFiles,
	UseInterceptors
} from '@nestjs/common';
import {AnyFilesInterceptor, FileFieldsInterceptor, FileInterceptor, FilesInterceptor} from '@nestjs/platform-express';
import {Undefinable} from '@rainbow-o23/n1';
import {DynamicModuleParameter} from './parameter-decorator';
import {
	DynamicModuleMultipleNamedFiles,
	DynamicModuleNonameOrNamedFiles,
	DynamicModulePipeline,
	ParameterDecoratorDelegateDef,
	ParameterType
} from './types';

export class MaxFileSizeValidator extends FileValidator<MaxFileSizeValidatorOptions> {
	public buildErrorMessage(): string {
		if ('message' in this.validationOptions) {
			if (typeof this.validationOptions.message === 'function') {
				return this.validationOptions.message(this.validationOptions.maxSize);
			}
			return this.validationOptions.message;
		}
		return `Validation failed (expected size should be less than or equal to ${this.validationOptions.maxSize}).`;
	}

	public isValid(file: { size: number }) {
		if (!this.validationOptions) {
			return true;
		}
		return file.size <= this.validationOptions.maxSize;
	}
}

export class MultiFilesMaxFileSizeValidator extends FileValidator<MaxFileSizeValidatorOptions> {
	public buildErrorMessage(): string {
		if ('message' in this.validationOptions) {
			if (typeof this.validationOptions.message === 'function') {
				return this.validationOptions.message(this.validationOptions.maxSize);
			}
			return this.validationOptions.message;
		}
		return `Validation failed (expected size should be less than or equal to ${this.validationOptions.maxSize})`;
	}

	public isValid(file: Record<string, { size: number } | Array<{ size: number }>>) {
		if (!this.validationOptions) {
			return true;
		}
		return Object.keys(file).every(name => {
			const files = file[name];
			if (Array.isArray(files)) {
				return files.every(file => file.size < this.validationOptions.maxSize);
			} else {
				return files.size <= this.validationOptions.maxSize;
			}
		});
	}
}

export class FileTypeValidator extends FileValidator<FileTypeValidatorOptions & {
	message?: string | ((fileType: string | RegExp) => string);
}> {
	public buildErrorMessage(): string {
		if ('message' in this.validationOptions) {
			if (typeof this.validationOptions.message === 'function') {
				return this.validationOptions.message(this.validationOptions.fileType);
			}
			return this.validationOptions.message;
		}
		return `Validation failed (expected mime-type should be ${this.validationOptions.fileType}).`;
	}

	public isValid(file: { mimetype?: string }) {
		if (!this.validationOptions) {
			return true;
		}
		if (!file.mimetype) {
			return false;
		}
		return Boolean(file.mimetype.match(this.validationOptions.fileType));
	}
}

export class MultiFilesFileTypeValidator extends FileValidator<FileTypeValidatorOptions & {
	message?: string | ((fileType: string | RegExp) => string);
}> {
	public buildErrorMessage(): string {
		if ('message' in this.validationOptions) {
			if (typeof this.validationOptions.message === 'function') {
				return this.validationOptions.message(this.validationOptions.fileType);
			}
			return this.validationOptions.message;
		}
		return `Validation failed (expected mime-type should be ${this.validationOptions.fileType}).`;
	}

	public isValid(file: Record<string, { mimetype?: string } | Array<{ mimetype?: string }>>) {
		if (!this.validationOptions) {
			return true;
		}
		return Object.keys(file).every(name => {
			const files = file[name];
			if (Array.isArray(files)) {
				return files.every(file => {
					return file.mimetype != null && Boolean(file.mimetype.match(this.validationOptions.fileType));
				});
			} else if (files.mimetype == null) {
				return false;
			} else {
				return Boolean(files.mimetype.match(this.validationOptions.fileType));
			}
		});
	}
}

export class DynamicModuleRequestFile {
	// noinspection JSUnusedLocalSymbols
	private constructor() {
		// avoid extend
	}

	public static isNonameOrNamedFiles(def: DynamicModulePipeline['files']): def is DynamicModuleNonameOrNamedFiles {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return def != null && typeof def === 'object' && (def as any).names == null;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public static isMultipleNamedFiles(def: DynamicModulePipeline['files']): def is DynamicModuleMultipleNamedFiles {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return def != null && typeof def === 'object' && (def as any).names != null && Array.isArray((def as DynamicModuleMultipleNamedFiles).names);
	}

	public static createMethodDecoratorOfAnyFiles(def: DynamicModulePipeline) {
		if (def.files === true) {
			return UseInterceptors(AnyFilesInterceptor());
		} else {
			return (void 0);
		}
	}

	public static createMethodDecoratorOfNamedFile(def: DynamicModulePipeline) {
		if (typeof def.files === 'string') {
			// single or multiple files with single name
			return UseInterceptors(FileInterceptor(def.files));
		} else {
			return (void 0);
		}
	}

	public static createMethodDecoratorOfMultiNamedFiles(def: DynamicModulePipeline) {
		if (Array.isArray(def.files)) {
			// multiple files with multiple names
			return UseInterceptors(FileFieldsInterceptor(def.files.map(file => {
				if (typeof file === 'string') {
					return {name: file};
				} else {
					return {name: file.name, maxCount: file.maxCount};
				}
			})));
		} else {
			return (void 0);
		}
	}

	public static createMethodDecoratorOfNonameOrNamedFiles(def: DynamicModulePipeline) {
		if (def.files != null && def.files !== false && DynamicModuleRequestFile.isNonameOrNamedFiles(def.files)) {
			// noname; or single/multiple files with same name
			if (def.files.name == null || `${def.files.name}`.trim().length === 0) {
				// any files
				return UseInterceptors(AnyFilesInterceptor());
			} else if (def.files.multiple === true) {
				// multiple files with single name
				return UseInterceptors(FilesInterceptor(def.files.name));
			} else {
				// single file
				return UseInterceptors(FileInterceptor(def.files.name));
			}
		} else {
			return (void 0);
		}
	}

	public static createMethodDecoratorOfMultiNamedFilesWithCheck(def: DynamicModulePipeline) {
		if (def.files != null && def.files !== false && DynamicModuleRequestFile.isMultipleNamedFiles(def.files)) {
			return UseInterceptors(FileFieldsInterceptor(def.files.names.map(file => {
				if (typeof file === 'string') {
					return {name: file};
				} else {
					return {name: file.name, maxCount: file.maxCount};
				}
			})));
		} else {
			return (void 0);
		}
	}

	public static createMethodDecorator(def: DynamicModulePipeline): Undefinable<MethodDecorator> {
		const creates = [
			DynamicModuleRequestFile.createMethodDecoratorOfAnyFiles,
			DynamicModuleRequestFile.createMethodDecoratorOfNamedFile,
			DynamicModuleRequestFile.createMethodDecoratorOfMultiNamedFiles,
			DynamicModuleRequestFile.createMethodDecoratorOfNonameOrNamedFiles,
			DynamicModuleRequestFile.createMethodDecoratorOfMultiNamedFilesWithCheck
		];
		for (const create of creates) {
			const decorator = create(def);
			if (decorator != null) {
				return decorator;
			}
		}
		return (void 0);
	}

	public static createParameterDecoratorOfAnyFiles(def: DynamicModulePipeline, index: number) {
		if (def.files === true) {
			return DynamicModuleParameter.createParameterDecoratorDelegateDef({
				decorator: UploadedFiles(), index, type: ParameterType.FILE, name: 'files'
			});
		} else {
			return (void 0);
		}
	}

	public static createParameterDecoratorOfNamedFile(def: DynamicModulePipeline, index: number) {
		if (typeof def.files === 'string') {
			// single or multiple files with single name
			return DynamicModuleParameter.createParameterDecoratorDelegateDef({
				decorator: UploadedFile(), index, type: ParameterType.FILE, name: def.files
			});
		} else {
			return (void 0);
		}
	}

	public static createParameterDecoratorOfMultiNamedFiles(def: DynamicModulePipeline, index: number) {
		if (Array.isArray(def.files)) {
			// multiple files with multiple names
			return DynamicModuleParameter.createParameterDecoratorDelegateDef({
				decorator: UploadedFiles(), index, type: ParameterType.FILE, name: 'files'
			});
		} else {
			return (void 0);
		}
	}

	public static findMaxSize(given?: string | number) {
		let maxSize = -1;
		if (given == null || `${given}`.trim().length === 0) {
			return -1;
		}
		if (typeof given === 'string') {
			if (given.endsWith('m') || given.endsWith('M')) {
				// mega-bytes
				maxSize = 1024 * 1024 * Number(given.substring(0, given.length - 1));
			} else if (given.endsWith('k') || given.endsWith('K')) {
				// kilo-bytes
				maxSize = 1024 * Number(given.substring(0, given.length - 1));
			} else {
				// bytes
				maxSize = Number(given.substring(0, given.length - 1));
			}
		} else {
			maxSize = given;
		}
		if (!isNaN(maxSize) && maxSize >= 0) {
			return maxSize;
		} else {
			return -1;
		}
	}

	public static createParameterDecoratorOfNonameOrNamedFiles(def: DynamicModulePipeline, index: number) {
		if (def.files != null && def.files !== false && DynamicModuleRequestFile.isNonameOrNamedFiles(def.files)) {
			const validators = [];
			const maxSize = DynamicModuleRequestFile.findMaxSize(def.files.maxSize);
			if (maxSize !== -1) {
				validators.push(new MaxFileSizeValidator({maxSize}));
			}
			if (def.files.mimeType != null && def.files.mimeType.trim().length !== 0) {
				validators.push(new FileTypeValidator({fileType: def.files.mimeType}));
			}
			const hasValidators = validators.length !== 0;
			let decorator: ParameterDecorator;
			if (def.files.name == null || `${def.files.name}`.trim().length === 0 || def.files.multiple === true) {
				// multiple files
				decorator = hasValidators ? UploadedFiles(new ParseFilePipe({validators})) : UploadedFiles();
			} else {
				// file
				decorator = hasValidators ? UploadedFile(new ParseFilePipe({validators})) : UploadedFile();
			}
			return DynamicModuleParameter.createParameterDecoratorDelegateDef({
				decorator, index, type: ParameterType.FILE, name: `${def.files.name}`.trim() || 'files'
			});
		} else {
			return (void 0);
		}
	}

	public static createParameterDecoratorOfMultiNamedFilesWithCheck(def: DynamicModulePipeline, index: number) {
		if (def.files != null && def.files !== false && DynamicModuleRequestFile.isMultipleNamedFiles(def.files)) {
			const validators = [];
			const maxSize = DynamicModuleRequestFile.findMaxSize(def.files.maxSize);
			if (maxSize !== -1) {
				validators.push(new MultiFilesMaxFileSizeValidator({maxSize}));
			}
			if (def.files.mimeType != null && def.files.mimeType.trim().length !== 0) {
				validators.push(new MultiFilesFileTypeValidator({fileType: def.files.mimeType}));
			}
			const hasValidators = validators.length !== 0;
			const decorator = hasValidators ? UploadedFiles(new ParseFilePipe({validators})) : UploadedFiles();
			return DynamicModuleParameter.createParameterDecoratorDelegateDef({
				decorator, index, type: ParameterType.FILE, name: 'files'
			});
		} else {
			return (void 0);
		}
	}

	public static createParameterDecorator(def: DynamicModulePipeline, index: number): Undefinable<ParameterDecoratorDelegateDef> {
		const creates = [
			DynamicModuleRequestFile.createParameterDecoratorOfAnyFiles,
			DynamicModuleRequestFile.createParameterDecoratorOfNamedFile,
			DynamicModuleRequestFile.createParameterDecoratorOfMultiNamedFiles,
			DynamicModuleRequestFile.createParameterDecoratorOfNonameOrNamedFiles,
			DynamicModuleRequestFile.createParameterDecoratorOfMultiNamedFilesWithCheck
		];
		for (const create of creates) {
			const decorator = create(def, index);
			if (decorator != null) {
				return decorator;
			}
		}
		return (void 0);
	}
}