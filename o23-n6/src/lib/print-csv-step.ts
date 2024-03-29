import {PipelineStepData, PipelineStepPayload, UncatchableError, Undefinable} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions, Utils} from '@rainbow-o23/n3';
import {parse} from 'csv-parse/sync';
import {stringify} from 'csv-stringify/sync';
import * as fs from 'fs';
import {nanoid} from 'nanoid';
import * as path from 'path';
import {
	ERR_INCORRECT_LOOP_END,
	ERR_INCORRECT_LOOP_END_VARIABLE,
	ERR_INCORRECT_LOOP_START,
	ERR_NESTED_LOOP_ON_SAME_ARRAY_NOT_ALLOWED,
	ERR_TEMPLATE_NOT_DEFINED,
	ERR_UNDETECTABLE_ROW
} from './error-codes';

export interface PrintCsvPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
	delimiter?: string;
	escapeChar?: string;
	useTempFile?: boolean;
}

export interface PrintCsvPipelineStepInFragment {
	template: Buffer | string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;
}

export interface PrintCsvPipelineStepOutFragment {
	file: Buffer;
}

type CsvCell = string;
type CsvRow = Array<CsvCell>;
type CsvSheet = Array<CsvRow>;

interface PrintedCsvSheet {
	push: (...rows: Array<CsvRow>) => void;
	csv: () => string;
}

enum CsvAstCellType {
	STANDARD, VARIABLE
}

interface CsvAstCell {
	type: CsvAstCellType;
}

interface CsvAstStdCell extends CsvAstCell {
	type: CsvAstCellType.STANDARD;
	value: string;
}

interface CsvAstVariableCell extends CsvAstCell {
	type: CsvAstCellType.VARIABLE;
	variable: string;
}

enum CsvAstRowType {
	STANDARD, EMPTY_LINE, LOOP_ROWS
}

interface CsvAstRow {
	type: CsvAstRowType;
	lineNumber: number;
	originalRow: Array<string>;
}

interface CsvAstEmptyRow extends CsvAstRow {
	type: CsvAstRowType.EMPTY_LINE;
}

interface CsvAstLoopRows extends CsvAstRow {
	type: CsvAstRowType.LOOP_ROWS;
	loopVariable?: string;
	rows: Array<CsvAstRow>;
	end: boolean;
}

interface CsvAstStdRow extends CsvAstRow {
	type: CsvAstRowType.STANDARD;
	cells: Array<CsvAstCell>;
}

type CsvSheetAst = Array<CsvAstRow>;

export class PrintCsvPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, >
	extends AbstractFragmentaryPipelineStep<In, Out, PrintCsvPipelineStepInFragment, PrintCsvPipelineStepOutFragment> {
	private readonly _keepTempFile: boolean;
	private readonly _delimiter: Undefinable<string>;
	private readonly _escapeChar: Undefinable<string>;
	private readonly _useTempFile: boolean;

	public constructor(options: PrintCsvPipelineStepOptions<In, Out, PrintCsvPipelineStepInFragment, PrintCsvPipelineStepOutFragment>) {
		super(options);
		this._delimiter = options.delimiter;
		this._escapeChar = options.escapeChar;
		const config = this.getConfig();
		this._keepTempFile = config.getBoolean('print.csv.temporary.file.keep', false);
		this._useTempFile = options.useTempFile ?? config.getBoolean('print.csv.temporary.file.use', false);
	}

	protected getDelimiter(): Undefinable<string> {
		return this._delimiter;
	}

	protected getEscapeChar(): Undefinable<string> {
		return this._escapeChar;
	}

	protected shouldKeepTempFile(): boolean {
		return this._keepTempFile;
	}

	protected useTempFile(): boolean {
		return this._useTempFile;
	}

	protected getTemporaryDir(): string {
		// noinspection JSUnresolvedReference
		const dir = path.resolve(process.cwd(), this.getConfig().getString('print.csv.temporary.dir', '.csv-temporary-files'));
		if (!fs.existsSync(dir)) {
			try {
				fs.mkdirSync(dir);
			} catch {
				// ignore exception
			}
		}
		return dir;
	}

	protected isEmptyRow(row: CsvAstRow): row is CsvAstEmptyRow {
		return row.type === CsvAstRowType.EMPTY_LINE;
	}

	protected isLoopRows(row: CsvAstRow): row is CsvAstLoopRows {
		return row.type === CsvAstRowType.LOOP_ROWS;
	}

	protected isStandardRow(row: CsvAstRow): row is CsvAstStdRow {
		return row.type === CsvAstRowType.STANDARD;
	}

	protected isStandardCell(cell: CsvAstCell): cell is CsvAstStdCell {
		return cell.type == CsvAstCellType.STANDARD;
	}

	protected isVariableCell(cell: CsvAstCell): cell is CsvAstVariableCell {
		return cell.type == CsvAstCellType.VARIABLE;
	}

	protected getLastLoopRows(ast: CsvSheetAst): Undefinable<CsvAstLoopRows> {
		if (ast.length === 0) {
			// no row parsed
			return (void 0);
		}
		const lastRow = ast[ast.length - 1];
		if (!this.isLoopRows(lastRow) || lastRow.end === true) {
			return (void 0);
		}
		const lastRowInside = this.getLastLoopRows(lastRow.rows);
		if (lastRowInside == null) {
			return lastRow;
		} else {
			return lastRowInside;
		}
	}

	protected pushIntoAst(ast: CsvSheetAst, parsedRow: CsvAstRow): void {
		const loopRows = this.getLastLoopRows(ast);
		if (loopRows != null) {
			loopRows.rows.push(parsedRow);
		} else {
			ast.push(parsedRow);
		}
	}

	protected parseCell(value: string): CsvAstCell {
		const trimmed = value.trim();
		if (trimmed.startsWith('$')) {
			if (trimmed === '$.$') {
				return {type: CsvAstCellType.VARIABLE, variable: ''} as CsvAstVariableCell;
			} else {
				return {type: CsvAstCellType.VARIABLE, variable: trimmed.substring(1).trim()} as CsvAstVariableCell;
			}
		} else {
			return {type: CsvAstCellType.STANDARD, value} as CsvAstStdCell;
		}
	}

	protected parseAst(records: Array<Array<string>>): CsvSheetAst {
		return records.reduce((ast, row, rowIndex) => {
			if (row.length === 0) {
				// empty line
				this.pushIntoAst(ast, {
					type: CsvAstRowType.EMPTY_LINE, lineNumber: rowIndex + 1, originalRow: row
				} as CsvAstEmptyRow);
			} else if (row[0].startsWith('$') && row[0].endsWith('.start')) {
				// loop rows start
				if (row.length > 1) {
					throw new UncatchableError(ERR_INCORRECT_LOOP_START, `Only one cell is allowed for loop rows start, check [${row.join(this.getDelimiter())}] at line ${rowIndex + 1}.`);
				}
				const loopVariable = row[0].substring(1, row[0].length - 6).trim();
				const lastLoopRow = this.getLastLoopRows(ast);
				if (lastLoopRow == null) {
					// no loop rows opened, which means new loop rows started now
					this.pushIntoAst(ast, {
						type: CsvAstRowType.LOOP_ROWS, loopVariable, rows: [], end: false,
						lineNumber: rowIndex + 1, originalRow: row
					} as CsvAstLoopRows);
				} else if (loopVariable === '' || loopVariable === lastLoopRow.loopVariable) {
					// there is loop rows opened, check the loop variable
					throw new UncatchableError(ERR_NESTED_LOOP_ON_SAME_ARRAY_NOT_ALLOWED, `Nested rows loop cannot build on same data hierarchy level with its parent, check [${row.join(this.getDelimiter())}] at line ${rowIndex + 1}.`);
				} else {
					// nested loop detected
					this.pushIntoAst(ast, {
						type: CsvAstRowType.LOOP_ROWS, loopVariable, rows: [], end: false,
						lineNumber: rowIndex + 1, originalRow: row
					} as CsvAstLoopRows);
				}
			} else if (row[0].startsWith('$') && row[0].endsWith('.end')) {
				// loop rows end
				if (row.length > 1) {
					throw new UncatchableError(ERR_INCORRECT_LOOP_END, `Only one cell is allowed for loop rows end, check [${row.join(this.getDelimiter())}] at line ${rowIndex + 1}.`);
				}
				const lastLoopRow = this.getLastLoopRows(ast);
				if (lastLoopRow == null) {
					throw new UncatchableError(ERR_INCORRECT_LOOP_END, `Loop rows end detected with no start, check [${row.join(this.getDelimiter())}] at line ${rowIndex + 1}.`);
				}
				const loopVariable = row[0].substring(1, row[0].length - 4).trim();
				if (loopVariable !== lastLoopRow.loopVariable) {
					throw new UncatchableError(ERR_INCORRECT_LOOP_END_VARIABLE, `Loop rows end variable doesn't match start, check [${row.join(this.getDelimiter())}] at line ${rowIndex + 1}.`);
				}
				lastLoopRow.end = true;
			} else {
				// normal row
				this.pushIntoAst(ast, {
					type: CsvAstRowType.STANDARD, cells: row.map(cell => this.parseCell(cell)),
					lineNumber: rowIndex + 1, originalRow: row
				} as CsvAstStdRow);
			}
			return ast;
		}, [] as CsvSheetAst);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected printEmptyRow(_row: CsvAstEmptyRow, printedRows: PrintedCsvSheet): void {
		printedRows.push([]);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected printCell(row: CsvAstStdRow, cell: CsvAstCell, cellIndex: number, data: any): string {
		if (this.isStandardCell(cell)) {
			return cell.value;
		} else if (this.isVariableCell(cell)) {
			return Utils.getValue(data, cell.variable === '' ? '.' : cell.variable);
		} else {
			// never occurred
			throw new UncatchableError(ERR_UNDETECTABLE_ROW, `Undetectable cell found, check [${row.originalRow.join(this.getDelimiter())}] at line ${row.lineNumber}, column ${cellIndex}.`);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected printStandardRow(row: CsvAstStdRow, data: any, printedRows: PrintedCsvSheet): void {
		printedRows.push(row.cells.map((cell, cellIndex) => this.printCell(row, cell, cellIndex + 1, data)));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected printLoopRows(row: CsvAstLoopRows, data: any, printedRows: PrintedCsvSheet): void {
		let loopData = row.loopVariable === '' ? data : Utils.getValue(data, row.loopVariable);
		loopData = loopData == null ? [] : (Array.isArray(loopData) ? loopData : [loopData]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		loopData.forEach((itemData: any) => row.rows.forEach(row => this.printRow(row, itemData, printedRows)));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected printRow(row: CsvAstRow, data: any, printedRows: PrintedCsvSheet): void {
		if (this.isEmptyRow(row)) {
			this.printEmptyRow(row, printedRows);
		} else if (this.isStandardRow(row)) {
			this.printStandardRow(row, data, printedRows);
		} else if (this.isLoopRows(row)) {
			this.printLoopRows(row, data, printedRows);
		} else {
			// never occurred
			throw new UncatchableError(ERR_UNDETECTABLE_ROW, `Undetectable row found, check [${row.originalRow.join(this.getDelimiter())}] at line ${row.lineNumber}.`);
		}
	}

	protected createPrintedRowsForTempFile(): PrintedCsvSheet {
		const tempFileName = path.resolve(this.getTemporaryDir(), `${nanoid(16)}-${Date.now()}.temp.csv`);
		return {
			push: (...rows: Array<CsvRow>) => {
				fs.appendFileSync(tempFileName, stringify(rows, {
					delimiter: this.getDelimiter(), escape: this.getEscapeChar()
				}));
			},
			csv: (): string => {
				const content = fs.readFileSync(tempFileName, 'utf8');
				if (!this.shouldKeepTempFile()) {
					fs.unlinkSync(tempFileName);
				}
				return content;
			}
		};
	}

	protected createPrintedRowsInMemory(): PrintedCsvSheet {
		const rows = [];
		return {
			push: (...newRows: Array<CsvRow>) => {
				rows.push(...newRows);
			},
			csv: (): string => {
				return stringify(rows, {delimiter: this.getDelimiter(), escape: this.getEscapeChar()});
			}
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async printCsv(templateCsv: Buffer | string, data: any): Promise<Buffer> {
		const sheet: CsvSheet = parse(templateCsv, {
			delimiter: this.getDelimiter(), escape: this.getEscapeChar(), relaxColumnCount: true
		});
		const ast = this.parseAst(sheet);
		const printedRows = this.useTempFile() ? this.createPrintedRowsForTempFile() : this.createPrintedRowsInMemory();
		ast.forEach(row => this.printRow(row, data, printedRows));
		return Buffer.from(printedRows.csv());
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: PrintCsvPipelineStepInFragment, _request: PipelineStepData<In>): Promise<PrintCsvPipelineStepOutFragment> {
		if (data.template == null) {
			throw new UncatchableError(ERR_TEMPLATE_NOT_DEFINED, 'Print template cannot be null.');
		}
		const file = await this.printCsv(data.template, data.data);
		return {file};
	}
}
