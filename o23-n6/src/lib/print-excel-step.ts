import {PipelineStepData, PipelineStepPayload, UncatchableError, Undefinable} from '@rainbow-o23/n1';
import {AbstractFragmentaryPipelineStep, FragmentaryPipelineStepOptions, Utils} from '@rainbow-o23/n3';
import * as ExcelJS from 'exceljs';
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

export interface PrintExcelPipelineStepOptions<In = PipelineStepPayload, Out = PipelineStepPayload, InFragment = In, OutFragment = Out>
	extends FragmentaryPipelineStepOptions<In, Out, InFragment, OutFragment> {
}

export interface PrintExcelPipelineStepInFragment {
	/** it is an Excel file, after 2007 */
	template: Buffer;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;
}

export interface PrintExcelPipelineStepOutFragment {
	file: Buffer;
}

interface ExcelCell {
	value?: ExcelJS.Cell['value'];
	style?: ExcelJS.Cell['style'];
	note?: ExcelJS.Cell['note'];
}

enum ExcelAstCellType {
	STANDARD, VARIABLE
}

enum ExcelAstCellMergeType {
	SINGLE, MASTER, SLAVE
}

interface ExcelAstCell {
	type: ExcelAstCellType;
	merge: ExcelAstCellMergeType;
	originalCell: ExcelCell;
}

interface ExcelAstStdCell extends ExcelAstCell {
	type: ExcelAstCellType.STANDARD;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
}

interface ExcelAstVariableCell extends ExcelAstCell {
	type: ExcelAstCellType.VARIABLE;
	variable: string;
}

enum ExcelAstRowType {
	STANDARD, EMPTY_LINE, LOOP_ROWS
}

interface ExcelAstRow {
	type: ExcelAstRowType;
	lineNumber: number;
	height: ExcelJS.Row['height'];
	hidden: ExcelJS.Row['hidden'];
}

interface ExcelAstEmptyRow extends ExcelAstRow {
	type: ExcelAstRowType.EMPTY_LINE;
	cells: Array<ExcelAstCell>;
}

interface ExcelAstLoopRows extends ExcelAstRow {
	type: ExcelAstRowType.LOOP_ROWS;
	loopVariable?: string;
	rows: Array<ExcelAstRow>;
	end: boolean;
}

interface ExcelAstStdRow extends ExcelAstRow {
	type: ExcelAstRowType.STANDARD;
	cells: Array<ExcelAstCell>;
}

interface ExcelAstColumn {
	width?: number;
	hidden: boolean;
}

interface ExcelSheetAst {
	name?: string;
	loopVariable?: string;
	nameVariable?: string;
	rows: Array<ExcelAstRow>;
	columns: Array<ExcelAstColumn>;
	pageSetup?: ExcelJS.Worksheet['pageSetup'];
	headerFooter?: ExcelJS.Worksheet['headerFooter'];
	state?: ExcelJS.Worksheet['state'];
	properties?: ExcelJS.Worksheet['properties'];
	views?: ExcelJS.Worksheet['views'];
	autoFilter?: ExcelJS.Worksheet['autoFilter'];
}

interface ExcelBookAst {
	sheets: Array<ExcelSheetAst>;
}

/**
 * 1. theme is not supported when using stream writer.
 *    never use theme colors or something, all styles from theme cannot copy to created file.
 * 2. auto filter cannot be applied to merged cells correctly.
 *    use auto filter carefully.
 */

export class PrintExcelPipelineStep<In = PipelineStepPayload, Out = PipelineStepPayload, >
	extends AbstractFragmentaryPipelineStep<In, Out, PrintExcelPipelineStepInFragment, PrintExcelPipelineStepOutFragment> {
	private readonly _keepTempFile: boolean;

	public constructor(options: PrintExcelPipelineStepOptions<In, Out, PrintExcelPipelineStepInFragment, PrintExcelPipelineStepOutFragment>) {
		super(options);
		const config = this.getConfig();
		this._keepTempFile = config.getBoolean('print.excel.temporary.file.keep', false);
	}

	protected shouldKeepTempFile(): boolean {
		return this._keepTempFile;
	}

	protected getTemporaryDir(): string {
		// noinspection JSUnresolvedReference
		const dir = path.resolve(process.cwd(), this.getConfig().getString('print.excel.temporary.dir', '.excel-temporary-files'));
		if (!fs.existsSync(dir)) {
			try {
				fs.mkdirSync(dir);
			} catch {
				// ignore exception
			}
		}
		return dir;
	}

	protected isEmptyRow(row: ExcelAstRow): row is ExcelAstEmptyRow {
		return row.type === ExcelAstRowType.EMPTY_LINE;
	}

	protected isLoopRows(row: ExcelAstRow): row is ExcelAstLoopRows {
		return row.type === ExcelAstRowType.LOOP_ROWS;
	}

	protected isStandardRow(row: ExcelAstRow): row is ExcelAstStdRow {
		return row.type === ExcelAstRowType.STANDARD;
	}

	protected isStandardCell(cell: ExcelAstCell): cell is ExcelAstStdCell {
		return cell.type == ExcelAstCellType.STANDARD;
	}

	protected isVariableCell(cell: ExcelAstCell): cell is ExcelAstVariableCell {
		return cell.type == ExcelAstCellType.VARIABLE;
	}

	protected getLastLoopRowsOrMyself(rows: ExcelAstLoopRows): ExcelAstLoopRows {
		if (rows.rows.length === 0) {
			// no sub rows, return myself
			return rows;
		}
		const lastRow = rows.rows[rows.rows.length - 1];
		if (!this.isLoopRows(lastRow)) {
			// last of sub rows is not a loop rows, return myself
			return rows;
		}
		if (lastRow.end === true) {
			// last of sub rows is a loop rows, but already end, return myself
			return rows;
		}
		// deep dig
		return this.getLastLoopRowsOrMyself(lastRow);
	}

	protected getLastLoopRows(ast: ExcelSheetAst): Undefinable<ExcelAstLoopRows> {
		if (ast.rows.length === 0) {
			// no row parsed
			return (void 0);
		}
		const lastRow = ast.rows[ast.rows.length - 1];
		if (!this.isLoopRows(lastRow) || lastRow.end === true) {
			return (void 0);
		}
		return this.getLastLoopRowsOrMyself(lastRow);
	}

	protected pushIntoAst(ast: ExcelSheetAst, parsedRow: ExcelAstRow): void {
		const loopRows = this.getLastLoopRows(ast);
		if (loopRows != null) {
			loopRows.rows.push(parsedRow);
		} else {
			ast.rows.push(parsedRow);
		}
	}

	protected transformCell(cell: ExcelJS.Cell, value?: ExcelJS.CellValue): ExcelCell {
		return {
			value: value === (void 0) ? cell.value : value,
			style: cell.style,
			note: cell.note
		};
	}

	protected getCellMergeType(cell: ExcelJS.Cell): ExcelAstCellMergeType {
		if (cell.isMerged !== true) {
			return ExcelAstCellMergeType.SINGLE;
		} else if (cell.master === cell) {
			return ExcelAstCellMergeType.MASTER;
		} else {
			return ExcelAstCellMergeType.SLAVE;
		}
	}

	protected parseCell(cell: ExcelJS.Cell): ExcelAstCell {
		const merge = this.getCellMergeType(cell);
		const {value} = cell;
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (trimmed.startsWith('$')) {
				if (trimmed === '$.$del') {
					return {
						type: ExcelAstCellType.STANDARD, merge, value, originalCell: this.transformCell(cell, '')
					} as ExcelAstStdCell;
				} else if (trimmed === '$.$') {
					return {
						type: ExcelAstCellType.VARIABLE, merge, variable: '', originalCell: this.transformCell(cell)
					} as ExcelAstVariableCell;
				} else {
					return {
						type: ExcelAstCellType.VARIABLE, merge, variable: trimmed.substring(1).trim(),
						originalCell: this.transformCell(cell)
					} as ExcelAstVariableCell;
				}
			} else {
				return {
					type: ExcelAstCellType.STANDARD, merge, value, originalCell: this.transformCell(cell)
				} as ExcelAstStdCell;
			}
		} else {
			return {
				type: ExcelAstCellType.STANDARD, merge, value, originalCell: this.transformCell(cell)
			} as ExcelAstStdCell;
		}
	}

	protected parseEmptyRow(row: ExcelJS.Row, rowIndex: number, ast: ExcelSheetAst) {
		// empty line
		const parsedRow = {
			type: ExcelAstRowType.EMPTY_LINE, cells: [],
			lineNumber: rowIndex, height: row.height, hidden: row.hidden
		} as ExcelAstEmptyRow;
		row.eachCell({includeEmpty: true}, cell => {
			const parsedCell = this.parseCell(cell);
			parsedRow.cells.push(parsedCell);
		});
		this.pushIntoAst(ast, parsedRow);
	}

	protected parseStandardRow(row: ExcelJS.Row, rowIndex: number, ast: ExcelSheetAst) {
		// normal row, even it is a loop row start or end
		const parsedRow = {
			type: ExcelAstRowType.STANDARD, cells: [],
			lineNumber: rowIndex, height: row.height, hidden: row.hidden
		} as ExcelAstStdRow;
		row.eachCell({includeEmpty: true}, cell => {
			const parsedCell = this.parseCell(cell);
			parsedRow.cells.push(parsedCell);
		});
		this.pushIntoAst(ast, parsedRow);
	}

	protected readNoteOfFirstCell(row: ExcelJS.Row): Array<string> {
		let note = row.getCell(1).note;
		if (note != null && typeof note !== 'string') {
			// noinspection JSUnresolvedReference
			note = (note.texts || []).map(text => text.text).join('\n');
		} else {
			note = note ?? '';
		}
		return (note as string).split('\n')
			.map(line => line.trim())
			.filter(line => line.startsWith('$') && (line.endsWith('.start') || line.endsWith('.end')));
	}

	/**
	 * returns the given row is consumed or not
	 */
	protected consumeRowWithNote(row: ExcelJS.Row, rowIndex: number, ast: ExcelSheetAst): boolean {
		const notes = this.readNoteOfFirstCell(row);
		if (notes.length === 0) {
			// no note, should be a standard row
			return false;
		}

		let endDetected = false;
		return notes.reduce((consumed, line) => {
			if (line.endsWith('.start')) {
				if (endDetected) {
					throw new UncatchableError(ERR_INCORRECT_LOOP_START, `Cannot start loop end when loop end detected in same row, check line ${rowIndex + 1}.`);
				}

				// loop rows start
				const loopVariable = line.substring(1, line.length - 6).trim();
				const lastLoopRow = this.getLastLoopRows(ast);
				if (lastLoopRow == null) {
					// no loop rows opened, which means new loop rows started now
					this.pushIntoAst(ast, {
						type: ExcelAstRowType.LOOP_ROWS, loopVariable, rows: [], end: false,
						lineNumber: rowIndex, height: row.height, hidden: row.hidden
					} as ExcelAstLoopRows);
				} else if (loopVariable === '' || loopVariable === lastLoopRow.loopVariable) {
					// there is loop rows opened, check the loop variable
					throw new UncatchableError(ERR_NESTED_LOOP_ON_SAME_ARRAY_NOT_ALLOWED, `Nested rows loop cannot build on same data hierarchy level with its parent, check line ${rowIndex + 1}.`);
				} else {
					// nested loop detected
					this.pushIntoAst(ast, {
						type: ExcelAstRowType.LOOP_ROWS, loopVariable, rows: [], end: false,
						lineNumber: rowIndex, height: row.height, hidden: row.hidden
					} as ExcelAstLoopRows);
				}
				return false;
			} else if (line.endsWith('.end')) {
				// loop rows end
				const lastLoopRow = this.getLastLoopRows(ast);
				if (lastLoopRow == null) {
					throw new UncatchableError(ERR_INCORRECT_LOOP_END, `Loop rows end detected with no start, check line ${rowIndex}.`);
				}
				const loopVariable = line.substring(1, line.length - 4).trim();
				if (loopVariable !== lastLoopRow.loopVariable) {
					throw new UncatchableError(ERR_INCORRECT_LOOP_END_VARIABLE, `Loop rows end variable doesn't match start, check line ${rowIndex}.`);
				}
				if (!consumed) {
					this.parseStandardRow(row, rowIndex, ast);
				}
				endDetected = true;
				lastLoopRow.end = true;
				return true;
			}
		}, false);
	}

	protected parseRow(row: ExcelJS.Row, rowIndex: number, ast: ExcelSheetAst): void {
		if (row.cellCount === 0) {
			this.parseEmptyRow(row, rowIndex, ast);
		} else {
			if (!this.consumeRowWithNote(row, rowIndex, ast)) {
				this.parseStandardRow(row, rowIndex, ast);
			}
		}
	}

	// noinspection JSUnresolvedReference
	protected parseSheet(sheet: ExcelJS.Worksheet): ExcelSheetAst {
		const ast: ExcelSheetAst = {rows: [], columns: []};
		const name = sheet.name ?? '';
		const names = name.split(',').map(part => part.trim()).filter(part => part.length !== 0);
		if (names.length === 2 && names[0].startsWith('$')) {
			// loop, first is loop variable, second is name variable
			ast.loopVariable = names[0].substring(1).trim();
			if (names[1].startsWith('$')) {
				ast.nameVariable = names[1].substring(1).trim();
			} else {
				ast.name = names[1];
			}
		} else {
			// no loop
			ast.name = name;
		}
		const rowCount = sheet.rowCount;
		if (rowCount !== 0) {
			for (let rowIndex = 1; rowIndex <= rowCount; rowIndex++) {
				this.parseRow(sheet.getRow(rowIndex), rowIndex, ast);
			}
		}

		ast.pageSetup = sheet.pageSetup;
		ast.headerFooter = sheet.headerFooter;
		ast.state = sheet.state;
		ast.properties = sheet.properties;
		ast.views = sheet.views;
		ast.autoFilter = sheet.autoFilter;

		const columnCount = sheet.columnCount;
		new Array(columnCount).fill(1).forEach((_, index) => {
			const column = sheet.getColumn(index + 1);
			ast.columns.push({
				width: column.width,
				hidden: column.hidden ?? false
			});
		});

		return ast;
	}

	protected async parseTemplateExcel(templateExcel: Buffer): Promise<ExcelBookAst> {
		const ast: ExcelBookAst = {sheets: []};
		const workbook = new ExcelJS.Workbook();
		// noinspection JSUnresolvedReference
		await workbook.xlsx.load(templateExcel);
		// when excel opened, reload excel calculation formula
		// noinspection JSUnresolvedReference
		workbook.calcProperties.fullCalcOnLoad = true;
		// cyclical loading worksheet
		// noinspection JSUnresolvedReference
		workbook.eachSheet(sheet => ast.sheets.push(this.parseSheet(sheet)));
		return ast;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected getLoopData(data: any, variable: string): Array<any> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let loopData: Array<any> | any;
		if (variable != null && variable !== '') {
			loopData = Utils.getValue(data, variable);
		} else {
			loopData = data;
		}
		if (!Array.isArray(loopData)) {
			loopData = [loopData];
		}
		return loopData;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected getSheetName(data: any, name: string, variable: string): string {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let sheetName: any;
		if (variable != null && variable !== '') {
			sheetName = Utils.getValue(data, variable);
		} else {
			sheetName = name;
		}
		if (typeof sheetName !== 'string') {
			if (sheetName != null && sheetName.toString != null) {
				sheetName = sheetName.toString();
			} else {
				sheetName = `${sheetName ?? ''}`;
			}
		}
		return sheetName;
	}

	protected tryToMergeRowsOrCells(sheet: ExcelJS.Worksheet, rows: Array<[ExcelJS.Row, Array<ExcelAstCellMergeType>]>): void {
		if (rows.length === 0) {
			return;
		}
		const [lastRow, types] = rows[rows.length - 1];
		if (types.some(type => type !== ExcelAstCellMergeType.SINGLE)) {
			// at least one cell need to be merged, no matter it is master or slave
			// which means next row might need to be merged
			return;
		}
		if (rows.length === 1) {
			// only one row, and no merge cell, commit row
			lastRow.commit();
			// clear
			rows.length = 0;
			return;
		}

		// find merge master cell
		rows
			.reduce((masterCells, [row, merges], rowIndex) => {
				// noinspection JSUnresolvedReference
				for (let cellIndex = 1, cellCount = row.cellCount; cellIndex <= cellCount; cellIndex++) {
					// noinspection JSUnresolvedReference
					const cell = row.getCell(cellIndex);
					const merge = merges[cellIndex - 1];
					if (merge === ExcelAstCellMergeType.MASTER) {
						masterCells.push([row, cell, rowIndex, cellIndex - 1]);
					}
				}
				return masterCells;
			}, [] as Array<[ExcelJS.Row, ExcelJS.Cell, number, number]>)
			.forEach(([
				          // eslint-disable-next-line @typescript-eslint/no-unused-vars
				          _, cell,
				          firstRowIndex, // starts from 0
				          firstColumnIndex// starts from 0, given column index is the master cell
			          ]) => {
				// find end cell horizontal
				const merges = rows[firstRowIndex][1];
				const maxColumnIndex = merges.length - 1;
				let columnIndex = firstColumnIndex;
				while (columnIndex < maxColumnIndex) {
					// to next horizontal cell
					if (merges[columnIndex + 1] !== ExcelAstCellMergeType.SLAVE) {
						// right cell is not slave, merge broken
						break;
					}
					columnIndex = columnIndex + 1;
				}
				// after search horizontal, now the last column is detected
				// find end cell vertical
				const maxRowIndex = rows.length - 1;
				let rowIndex = firstRowIndex;
				while (rowIndex < maxRowIndex) {
					const merges = rows[rowIndex + 1][1];
					if (merges[firstColumnIndex] !== ExcelAstCellMergeType.SLAVE) {
						// down cell is not slave, merge broken
						break;
					}
					if (firstColumnIndex <= 1) {
						// no cell on left, check next row
						// or only one cell on left, check next row
						rowIndex = rowIndex + 1;
					} else if (merges[firstColumnIndex - 1] === ExcelAstCellMergeType.SINGLE) {
						// previous cell is single, check next row
						rowIndex = rowIndex + 1;
					} else if (merges[firstColumnIndex - 1] === ExcelAstCellMergeType.MASTER) {
						// previous cell is master, merge broken
						break;
					} else {
						let broken = false;
						for (let cellIndex = firstColumnIndex - 2; cellIndex >= 0; cellIndex--) {
							if (merges[cellIndex] === ExcelAstCellMergeType.MASTER) {
								// left cell is master, merge broken
								broken = true;
								break;
							}
						}
						if (broken) {
							break;
						}
					}
				}
				// noinspection JSUnresolvedReference
				const lastMergeCell = rows[rowIndex][0].getCell(columnIndex + 1);
				sheet.mergeCells(`${cell.address}:${lastMergeCell.address}`);
			});
		// merged, commit last row
		lastRow.commit();
		// clear
		rows.length = 0;
	}

	protected printEmptyRow(
		sheet: ExcelJS.Worksheet, rowsToMerge: Array<[ExcelJS.Row, Array<ExcelAstCellMergeType>]>,
		row: ExcelAstEmptyRow): void {
		const added = sheet.addRow([]);
		added.height = row.height;
		added.hidden = row.hidden;
		rowsToMerge.push([added, row.cells.map(({merge}) => merge)]);
		this.tryToMergeRowsOrCells(sheet, rowsToMerge);
	}

	protected redressCellNote(note?: string | ExcelJS.Comment): Undefinable<string | ExcelJS.Comment> {
		if (note == null) {
			return (void 0);
		} else if (typeof note === 'string') {
			const trimmed = note.trim();
			if (trimmed.startsWith('$') && (trimmed.endsWith('.start') || trimmed.endsWith('.end'))) {
				return (void 0);
			} else {
				return note;
			}
		} else if (note.texts == null || note.texts.length === 0) {
			return (void 0);
		} else {
			const texts = note.texts.map(text => {
				if (text.text != null) {
					const trimmed = text.text.trim();
					if (trimmed.startsWith('$') && (trimmed.endsWith('.start') || trimmed.endsWith('.end'))) {
						return null;
					} else {
						return text;
					}
				} else {
					return text;
				}
			}).filter(x => x != null);
			const redressedTexts: Array<ExcelJS.RichText> = [];
			for (let textIndex = 0, textCount = texts.length; textIndex < textCount; textIndex++) {
				const text = texts[textIndex].text;
				if (text.trim() === '\n') {
					if (textIndex === textCount - 1 || texts[textIndex + 1].text.trim() === '\n') {
						// ignore this one
					} else {
						redressedTexts.push(texts[textIndex]);
					}
				}
			}
			if (redressedTexts.length === 0) {
				return (void 0);
			} else {
				return {...note, texts};
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected printCell(row: ExcelAstStdRow, cell: ExcelAstCell, cellIndex: number, data: any): [ExcelCell, ExcelAstCellMergeType] {
		if (cell.merge === ExcelAstCellMergeType.SLAVE) {
			return [{}, cell.merge];
		} else if (this.isStandardCell(cell)) {
			return [{...cell.originalCell, note: this.redressCellNote(cell.originalCell.note)}, cell.merge];
		} else if (this.isVariableCell(cell)) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let value: any = Utils.getValue(data, cell.variable === '' ? '.' : cell.variable);
			const type = typeof value;
			if (value == null || ['number', 'bigint', 'string'].includes(type)) {
				// do nothing, let it be null
			} else {
				if (value.toString != null) {
					value = value.toString();
				} else {
					value = `${value ?? ''}`;
				}
			}
			return [
				{value, style: cell.originalCell.style, note: this.redressCellNote(cell.originalCell.note)},
				cell.merge];
		} else {
			// never occurred
			throw new UncatchableError(ERR_UNDETECTABLE_ROW, `Undetectable cell found, check line ${row.lineNumber}, column ${cellIndex}.`);
		}
	}

	protected printStandardRow(
		sheet: ExcelJS.Worksheet, rowsToMerge: Array<[ExcelJS.Row, Array<ExcelAstCellMergeType>]>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		row: ExcelAstStdRow, data: any): void {
		const printedCells = row.cells.map((cell, cellIndex) => this.printCell(row, cell, cellIndex + 1, data));
		const added = sheet.addRow(printedCells.map(([{value}]) => value));
		printedCells.forEach(([{style, note}], index) => {
			if (style == null && note == null) {
				return;
			}
			// noinspection JSUnresolvedReference
			const cell = added.getCell(index + 1);
			if (note != null) {
				cell.note = note;
			}
			if (style != null) {
				cell.style = style;
			}
		});
		added.height = row.height;
		added.hidden = row.hidden;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		rowsToMerge.push([added, printedCells.map(([_, merge]) => merge)]);
		this.tryToMergeRowsOrCells(sheet, rowsToMerge);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected printLoopRows(
		sheet: ExcelJS.Worksheet, rowsToMerge: Array<[ExcelJS.Row, Array<ExcelAstCellMergeType>]>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		row: ExcelAstLoopRows, data: any): void {
		let loopData = row.loopVariable === '' ? data : Utils.getValue(data, row.loopVariable);
		loopData = loopData == null ? [] : (Array.isArray(loopData) ? loopData : [loopData]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		loopData.forEach((itemData: any) => row.rows.forEach(row => this.printRow(sheet, rowsToMerge, row, itemData)));
	}

	protected printRow(
		sheet: ExcelJS.Worksheet, rowsToMerge: Array<[ExcelJS.Row, Array<ExcelAstCellMergeType>]>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		row: ExcelAstRow, data: any): void {
		if (this.isEmptyRow(row)) {
			this.printEmptyRow(sheet, rowsToMerge, row);
		} else if (this.isStandardRow(row)) {
			this.printStandardRow(sheet, rowsToMerge, row, data);
		} else if (this.isLoopRows(row)) {
			this.printLoopRows(sheet, rowsToMerge, row, data);
		} else {
			// never occurred
			throw new UncatchableError(ERR_UNDETECTABLE_ROW, `Undetectable row found, check line ${row.lineNumber}.`);
		}
	}

	// noinspection JSUnresolvedReference
	protected printSheet(
		ast: ExcelSheetAst,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		data: any,
		workbook: ExcelJS.stream.xlsx.WorkbookWriter): void {
		const {name, nameVariable, loopVariable, rows} = ast;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.getLoopData(data, loopVariable).forEach((loopData: any) => {
			const sheet = workbook.addWorksheet(this.getSheetName(loopData, name, nameVariable), {
				pageSetup: ast.pageSetup,
				headerFooter: ast.headerFooter,
				state: ast.state,
				properties: ast.properties,
				views: ast.views
			});
			(ast.columns ?? []).forEach((col, index) => {
				// noinspection JSUnresolvedReference
				const column = sheet.getColumn(index + 1);
				column.width = col.width;
				column.hidden = col.hidden;
			});
			sheet.autoFilter = ast.autoFilter;
			const rowsToMerge: Array<[ExcelJS.Row, Array<ExcelAstCellMergeType>]> = [];
			rows.forEach(rowAst => {
				this.printRow(sheet, rowsToMerge, rowAst, loopData);
			});
			sheet.commit();
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async printExcel(templateExcel: Buffer, data: any): Promise<Buffer> {
		const ast = await this.parseTemplateExcel(templateExcel);
		// use stream mode to write workbook
		const tempFileName = path.resolve(this.getTemporaryDir(), `${nanoid(16)}-${Date.now()}.temp.xlsx`);
		// noinspection JSUnresolvedReference
		const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
			useStyles: true, useSharedStrings: true, filename: tempFileName
		});
		ast.sheets.forEach(ast => this.printSheet(ast, data, workbook));
		workbook.calcProperties = {fullCalcOnLoad: true};
		await workbook.commit();

		const content = fs.readFileSync(tempFileName, 'binary');
		const buffer = Buffer.from(content, 'binary');
		if (!this.shouldKeepTempFile()) {
			try {
				fs.unlinkSync(tempFileName);
			} catch {
				// ignore the exception
			}
		}
		return buffer;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async doPerform(data: PrintExcelPipelineStepInFragment, _request: PipelineStepData<In>): Promise<PrintExcelPipelineStepOutFragment> {
		if (data.template == null) {
			throw new UncatchableError(ERR_TEMPLATE_NOT_DEFINED, 'Print template cannot be null.');
		}
		const file = await this.printExcel(data.template, data.data);
		return {file};
	}
}
