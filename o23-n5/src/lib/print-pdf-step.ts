import {PipelineStepData, PipelineStepPayload, UncatchableError, Undefinable} from '@rainbow-o23/n1';
import {
	AbstractFragmentaryPipelineStep,
	FragmentaryPipelineStepOptions,
	ScriptFuncOrBody,
	Utils
} from '@rainbow-o23/n3';
import {Browser, PaperFormat, PDFOptions, Viewport} from 'puppeteer';
// for o23-n99, use webpack to build standalone version, force use cjs.
import puppeteer from 'puppeteer/lib/cjs/puppeteer/puppeteer.js';
import {ERR_PDF_TEMPLATE_NOT_EMPTY} from './error-codes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FindSubTemplate = (data: any, templateCode: string) => Promise<Undefinable<string>>;

export interface PrintPdfPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	browserArgs?: string | Array<string>;
	viewport?: Viewport;
	pdfOptions?: PDFOptions;
	findSubTemplate?: ScriptFuncOrBody<FindSubTemplate>;
}

export interface PrintPdfPipelineStepInFragment {
	/** it is a html */
	template: Buffer | string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;
}

export interface PrintPdfPipelineStepOutFragment {
	file: Buffer;
}

/** key is browser args, number is tab count */
const BROWSERS: Map<string, Array<[Browser, number]>> = new Map<string, Array<[Browser, number]>>();

export class PrintPdfPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, >
	extends AbstractFragmentaryPipelineStep<In, Out, PrintPdfPipelineStepInFragment, PrintPdfPipelineStepOutFragment> {
	private readonly _executablePath: string;
	private readonly _browserArgs: Array<string>;
	private readonly _browserArgsAsStr: string;
	private readonly _cacheBrowser: boolean;
	private readonly _devTools: boolean;
	private readonly _headless: boolean;
	private readonly _maxPageCount: number;
	private readonly _viewport: Viewport;
	private readonly _pdfOptions?: PDFOptions;
	private readonly _keepPage?: boolean;
	private readonly _findSubTemplateSnippet?: ScriptFuncOrBody<FindSubTemplate>;
	private readonly _findSubTemplateFunc?: FindSubTemplate;

	public constructor(options: PrintPdfPipelineStepOptions<In, Out, PrintPdfPipelineStepInFragment, PrintPdfPipelineStepOutFragment>) {
		super(options);
		const config = this.getConfig();
		this._executablePath = config.getString('puppeteer.executable.path');
		const globalBrowserArgs = config.getString('puppeteer.browser.args', '')
			.split(',')
			.map(arg => arg.trim())
			.filter(arg => arg.length !== 0);
		const browserArgs = [(options.browserArgs ?? '')].flat()
			.map(arg => arg.split(','))
			.flat()
			.map(arg => arg.trim())
			.filter(arg => arg.length !== 0);
		this._browserArgs = [...globalBrowserArgs, ...browserArgs];
		this._browserArgsAsStr = this._browserArgs.join(' ');
		this._cacheBrowser = config.getBoolean('puppeteer.browser.cache', true);
		this._devTools = config.getBoolean('puppeteer.devtools.enabled', false);
		this._headless = config.getBoolean('puppeteer.headless.enabled', true);
		this._maxPageCount = config.getNumber('puppeteer.max.pages', 50);
		this._viewport = options.viewport ?? {
			width: config.getNumber('puppeteer.viewport.width', 1920),
			height: config.getNumber('puppeteer.viewport.height', 1080)
		};
		this._pdfOptions = options.pdfOptions ?? {};
		this._pdfOptions.displayHeaderFooter = this._pdfOptions.displayHeaderFooter ?? config.getBoolean('puppeteer.pdf.header.and.footer.display', false);
		this._pdfOptions.printBackground = this._pdfOptions.printBackground ?? config.getBoolean('puppeteer.pdf.background', false);
		this._pdfOptions.format = this._pdfOptions.format ?? config.getString('puppeteer.pdf.format', 'a4') as PaperFormat;
		this._pdfOptions.timeout = this._pdfOptions.timeout ?? config.getNumber('puppeteer.pdf.timeout', 30) * 1000;
		this._keepPage = config.getBoolean('puppeteer.page.keep', false);
		this._findSubTemplateSnippet = options.findSubTemplate;
		this._findSubTemplateFunc = Utils.createAsyncFunction(this.getFindSubTemplateSnippet(), {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			createDefault: () => async (_$data, _$templateCode): Promise<Undefinable<string>> => (void 0),
			getVariableNames: () => ['$data', '$templateCode'],
			error: (e: Error) => {
				this.getLogger().error(`Failed on create function for get template, snippet is [${this.getFindSubTemplateSnippet()}].`);
				throw e;
			}
		});
	}

	protected getExecutablePath(): string {
		return this._executablePath;
	}

	protected getBrowserArgs(): Array<string> {
		return this._browserArgs;
	}

	protected getBrowserArgsAsStr(): string {
		return this._browserArgsAsStr;
	}

	protected shouldCacheBrowser(): boolean {
		return this._cacheBrowser;
	}

	protected isDevToolsEnabled(): boolean {
		return this._devTools;
	}

	/**
	 * only when headless is true and not keep page
	 */
	protected isHeadless(): boolean {
		return this._headless && !this.shouldKeepPage();
	}

	protected getMaxTabCount(): number {
		return this._maxPageCount;
	}

	protected getViewport(): Viewport {
		return this._viewport;
	}

	protected getPdfOptions(): PDFOptions {
		return this._pdfOptions;
	}

	protected shouldKeepPage(): boolean {
		return this._keepPage;
	}

	protected async createBrowser(): Promise<Browser> {
		const browser = await puppeteer.launch({
			executablePath: this.getExecutablePath() ?? (void 0),
			headless: this.isHeadless() ? 'new' : false, devtools: this.isDevToolsEnabled(),
			args: this.getBrowserArgs()
		});
		if (this.shouldCacheBrowser()) {
			const key = this.getBrowserArgsAsStr();
			const existing = BROWSERS.get(key);
			if (existing == null) {
				// create first
				BROWSERS.set(key, [[browser, 1]]);
			} else {
				// append
				existing.push([browser, 1]);
			}
		}
		return browser;
	}

	protected async findOrCreateBrowser(): Promise<Browser> {
		const found = BROWSERS.get(this.getBrowserArgsAsStr());
		if (found != null) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const appropriate = found.find(([_, count]) => count < this.getMaxTabCount());
			if (appropriate != null) {
				appropriate[1] = appropriate[1] + 1;
				return appropriate[0];
			}
		}
		return await this.createBrowser();
	}

	protected decreasePageCount(browser: Browser): void {
		const found = BROWSERS.get(this.getBrowserArgsAsStr());
		if (found != null) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const appropriate = found.find(([existing, _]) => existing === browser);
			if (appropriate != null) {
				appropriate[1] = appropriate[1] - 1;
			}
		}
	}

	public getFindSubTemplateSnippet(): ScriptFuncOrBody<FindSubTemplate> {
		return this._findSubTemplateSnippet;
	}

	protected createPageEvalFunction() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return async (data: any): Promise<PDFOptions> => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const replaceTemplates = async (root: Document, data: any): Promise<void> => {
				const elements = root.querySelectorAll('data-print-template');
				if (elements.length !== 0) {
					for (let index = 0, count = elements.length; index < count; index++) {
						const element = elements.item(index);
						const templateCode = ((element as HTMLElement).dataset.code || '').trim();
						if (templateCode.length === 0) {
							// no template code found, remote itself
							element.remove();
						} else {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							element.outerHTML = await window.findSubTemplate(data, templateCode);
						}
					}
					// template may introduce new templates, replace again
					await replaceTemplates(root, data);
				}
			};
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const replaceFields = async (root: HTMLElement | Document, data: any): Promise<void> => {
				// only scan the fields, inside loop ignored
				const elements = root.querySelectorAll('[data-print=field]:not([data-print=loop] [data-print=field])');
				await Array.from(elements).reduce(async (previous, element) => {
					await previous;
					const node = element as HTMLElement;
					let path = node.dataset.printField ?? '';
					if (path.trim().length === 0) {
						path = '.';
					}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					node.textContent = await window.getValue(data, path) ?? 'Configuration not found, use "data-field" to define your property path.';
					return Promise.resolve();
				}, Promise.resolve());
			};
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const replaceLoops = async (root: HTMLElement | Document, data: any): Promise<void> => {
				const loopElements = root.querySelectorAll('[data-print=loop]:not([data-print=loop] [data-print=loop])');
				await Array.from(loopElements).reduce(async (previous, element) => {
					await previous;
					const node = element as HTMLElement;
					const baseNode = node.cloneNode(true) as HTMLElement;
					const parent = node.parentNode as HTMLElement;
					// remove original node
					node.remove();
					let path = node.dataset.printField ?? '';
					if (path.trim().length === 0) {
						path = '.';
					}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					let loopData = await window.getValue(data, path);
					if (loopData == null) {
						loopData = [];
					} else if (!Array.isArray(loopData)) {
						loopData = [loopData];
					}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					await (loopData as Array<any>).reduce(async (previous: Promise<void>, item: any) => {
						await previous;
						const cloneNode = baseNode.cloneNode(true) as HTMLElement;
						cloneNode.dataset.print = 'loop-used';
						await replaceFields(cloneNode, item);
						await replaceLoops(cloneNode, item);
						parent.appendChild(cloneNode);
						return Promise.resolve();
					}, Promise.resolve());
					return Promise.resolve();
				}, Promise.resolve());
			};
			await replaceTemplates(document, data);
			await replaceFields(document, data);
			await replaceLoops(document, data);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			if (window.postDataPrepare != null) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				window.postDataPrepare(data);
			}

			const headerTemplate = document.getElementById('header')?.innerHTML;
			const footerTemplate = document.getElementById('footer')?.innerHTML;
			const pdfOptions = document.getElementById('pdfOptions')?.dataset?.attr || '{}';

			return {
				headerTemplate: headerTemplate || '</>',
				footerTemplate: footerTemplate || '</>',
				displayHeaderFooter: !!(headerTemplate || footerTemplate),
				...JSON.parse(pdfOptions)
			};
		};
	}

	protected async closeBrowser(browser: Browser): Promise<void> {
		const browsers = BROWSERS.get(this.getBrowserArgsAsStr());
		if (browsers != null) {
			const foundIndex = browsers.findIndex(([existing]) => existing === browser);
			if (foundIndex != null) {
				browsers.splice(foundIndex, 1);
			}
		}
		try {
			await browser.close();
		} catch (e) {
			this.getLogger().error('Failed to close browser.', e, this.constructor.name);
		}
	}

	protected copy(target: PDFOptions, source: PDFOptions): PDFOptions {
		return Object.keys(source ?? {}).reduce((copyTo, key) => {
			const value = source[key];
			if (value == null || Array.isArray(value)) {
				copyTo[key] = value;
			} else if (typeof value === 'object') {
				if (copyTo[key] == null || Array.isArray(copyTo[key])) {
					copyTo[key] = value;
				} else if (typeof copyTo[key] === 'object') {
					this.copy(copyTo[key], value);
				} else {
					copyTo[key] = value;
				}
			} else {
				copyTo[key] = value;
			}
			return copyTo;
		}, target);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async printPdf(templateHtml: Buffer | string, data: Record<string, any>): Promise<Buffer> {
		let browser: Browser = null;
		try {
			browser = await this.findOrCreateBrowser();
			const page = await browser.newPage();
			await page.setViewport(this.getViewport());
			await page.setContent(templateHtml.toString());
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await page.exposeFunction('findSubTemplate', async (data: any, templateCode: string) => {
				return this._findSubTemplateFunc(data, templateCode);
			});
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await page.exposeFunction('getValue', (data: any, property: string) => Utils.getValue(data, property));
			const definePdfOptions = this.getPdfOptions();
			const pdfOptions = await page.evaluate(this.createPageEvalFunction(), data);
			const mergedPdfOptions = this.copy(definePdfOptions, pdfOptions);
			const pdf = await page.pdf(mergedPdfOptions);
			if (!this.shouldKeepPage()) {
				// keep browser and page when keep page is true
				if (!this.shouldCacheBrowser()) {
					await this.closeBrowser(browser);
				} else {
					this.decreasePageCount(browser);
					// browser is cached, close page
					await page.close();
				}
			}
			return Buffer.from(pdf);
		} catch (e) {
			// noinspection PointlessBooleanExpressionJS
			if (browser != null) {
				await this.closeBrowser(browser);
			}
			throw e;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: PrintPdfPipelineStepInFragment, _request: PipelineStepData<In>): Promise<PrintPdfPipelineStepOutFragment> {
		if (data.template == null) {
			throw new UncatchableError(ERR_PDF_TEMPLATE_NOT_EMPTY, 'Print template cannot be empty.');
		}
		const file = await this.printPdf(data.template, data.data);
		return {file};
	}
}
