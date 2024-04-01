![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![ExcelJS](https://img.shields.io/badge/ExcelJS-white.svg?logo=microsoftexcel&logoColor=217346&style=social)
![CSV for Node.js](https://img.shields.io/badge/CSV%20for%20Node.js-548694.svg)

![Module Formats](https://img.shields.io/badge/module%20formats-cjs-green.svg)

# o23/n6

`o23/n6` provides

- A pipeline step that converts csv templates to csv, implemented based on [CSV-Parse](https://csv.js.org/parse/)
  and [CSV-stringify](https://csv.js.org/stringify/),
- A pipeline step that converts excel template to excel, implemented base on [ExcelJS](https://www.npmjs.com/package/exceljs).

## CSV Generate Step

### Environment Parameters

| Name                              | Type    | Default Value          | Comments                                             |
|-----------------------------------|---------|------------------------|------------------------------------------------------|
| `print.csv.temporary.file.keep`   | boolean | false                  | Only for debug purpose, never turn on in production. |
| `print.csv.temporary.file.use`    | boolean | false                  | Use temporary file or not.                           |
| `print.csv.temporary.lines.fresh` | number  | 100                    | How many lines to fresh to temporary file.           |
| `print.csv.temporary.dir`         | string  | `.csv-temporary-files` | Temporary file directory.                            |

### Constructor Parameters

| Name        | Type    | Default Value | Comments |
|-------------|---------|---------------|----------|
| delimiter   | string  | `,`           |          |
| escapeChar  | string  | `"`           |          |
| useTempFile | boolean |               |          |

### Request and Response

```typescript
export interface PrintCsvPipelineStepInFragment {
	template: Buffer | string;
	data: any;
}

export interface PrintCsvPipelineStepOutFragment {
	file: Buffer;
}
```

### An Example

#### Data

```javascript
const data = {
	type: 'Test CSV',
	information: [
		{name: 'John', age: 25, birthday: '1998-03-27', addresses: ['address line 1', 'address line 2']},
		{name: 'Jane', age: 27, birthday: '1996-08-12', addresses: ['address line 3']},
		{name: 'Mike', age: 21, birthday: '2002-11-20'}
	],
	policy: [
		{id: 1000001, productName: 'PRDT-001', productInfo: 'PRDT-001-INFO'},
		{id: 1000002, productName: 'PRDT-002', productInfo: 'PRDT-002-INFO'}
	]
};
```

#### Template

```csv
column1,column2
$type
Name,Age,Birthday
$information.start
$name,$age,$birthday
$addresses.start
$.$
$addresses.end
$information.end
Id,Product Name,Product Info
$policy.start
$id,$productName,$productInfo
$policy.end
```

- Supports nested loops,
- `$information.start`, `$addresses.start`, `$policy.start` represent loop start,
- `$addresses.end`, `$information.end`, `$policy.end` represent loop end,
- `$name`, `$age`, `$birthday` represent property,
	- Supports multi-level property names, connected by `.`. For example, `$person.name` represents that `person` is an object
	  and `name` is a property under `person`,
- `$.$` represents use loop array itself, in this example, `addresses` array is a string array,
- All properties are relative paths, calculated relative to their parent node. Therefore, within a loop, only the values of each element
  can be accessed.

#### Output

```csv
column1,column2
Test CSV
Name,Age,Birthday
John,25,1998-03-27
address line 1
address line 2
Jane,27,1996-08-12
address line 3
Mike,21,2002-11-20
Id,Product Name,Product Info
1000001,PRDT-001,PRDT-001-INFO
1000002,PRDT-002,PRDT-002-INFO
```

### Performance Benchmark

This benchmark was conducted on the following hardware and environment:

- CPU: 2.6 GHz 6-Core Intel Core i7,
- Memory: 64 GB 2667 MHz DDR4,
- OS: macOS Sonoma 14.2.1,
- MySQL: 8.2.0,
- NodeJS: v18.19.0,
- NPM: v10.2.3.

With scenario:

- Flow:
	- Load template from database,
	- Print file,
	- Write printed file to database,
	- Return to client,
- Template size: 0.4kb, 4 lines * 30 columns,
- Output size: 5.8mb, 10001 lines * 30 columns.

| # | Item                                 | Max CPU Usage | Max Memory Usage | Avg. Response Time (ms) |
|---|--------------------------------------|---------------|------------------|-------------------------|
| 1 | 100 iterations, single thread        | 120%          | 600M             | 471                     |
| 2 | 100 iterations, 4 concurrent threads | 150%          | 700M             | 1444                    |
| 3 | 100 iterations, 8 concurrent threads | 160%          | 750M             | 2917                    |

## Excel Generate Step

### Environment Parameters

| Name                              | Type    | Default Value            | Comments                                             |
|-----------------------------------|---------|--------------------------|------------------------------------------------------|
| `print.excel.temporary.file.keep` | boolean | false                    | Only for debug purpose, never turn on in production. |
| `print.excel.temporary.dir`       | string  | `.excel-temporary-files` | Temporary file directory.                            |

### Request and Response

```typescript
export interface PrintExcelPipelineStepInFragment {
	/** it is an Excel file, after 2007 */
	template: Buffer;
	data: any;
}

export interface PrintExcelPipelineStepOutFragment {
	file: Buffer;
}
```

### Syntax

Find template and unit test in `/test` folder, syntax for using an Excel template is as follows:

- Supports nested loops,
- `$xxx.start` represents loop start,
- `$xxx.end` represents loop end,
- Loop flag needs to be defined in the note of the cell and occupy a separate line,
- Loop flag must be defined in first column,
- `$xxx` represents property,
	- Supports multi-level property names, connected by `.`. For example, `$person.name` represents that `person` is an object
	  and `name` is a property under `person`,
- `$.$` represents use loop array itself,
- All properties are relative paths, calculated relative to their parent node. Therefore, within a loop, only the values of each element
  can be accessed.

### Known Issues

- Cannot apply auto filter into merged cells correctly, each cell will display a filter, which should only be displayed on the last cell.
- Cannot copy theme correctly, please use the specified color and do not choose from the suggested theme colors provided by Excel.
- ExcelJS does not read the note data of empty cells. Therefore, when the loop flag appears on an empty cell, it needs to be specially
  marked with the `$.$del` flag.

### Performance Benchmark

This benchmark was conducted on the following hardware and environment:

- CPU: 2.6 GHz 6-Core Intel Core i7,
- Memory: 64 GB 2667 MHz DDR4,
- OS: macOS Sonoma 14.2.1,
- MySQL: 8.2.0,
- NodeJS: v18.19.0,
- NPM: v10.2.3.

With scenario:

- Flow:
	- Load template from database,
	- Print file,
	- Write printed file to database,
	- Return to client,
- Template size: 12kb, 2 lines * 30 columns,
- Output size: 4.1mb, 10001 lines * 30 columns.

| # | Item                                 | Max CPU Usage | Max Memory Usage | Avg. Response Time (ms) |
|---|--------------------------------------|---------------|------------------|-------------------------|
| 1 | 100 iterations, single thread        | 120%          | 550M             | 945                     |
| 2 | 100 iterations, 4 concurrent threads | 150%          | 850M             | 2878                    |
| 3 | 100 iterations, 8 concurrent threads | 170%          | 1000M            | 5718                    |
