![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![Docx-templates](https://img.shields.io/badge/Docx--templates-white.svg?logo=microsoftword&logoColor=2B579A&style=social)

![Module Formats](https://img.shields.io/badge/module%20formats-cjs-green.svg)

# o23/n7

`o23/n7` provides

- A pipeline step that converts word templates to word, implemented based on [Docx-templates](https://github.com/guigrpa/docx-templates).

## Word Generate Step

### Environment Parameters

| Name                       | Type                     | Default Value | Comments                                                                                                                                                                                                                                                                                                                                                                                        |
|----------------------------|--------------------------|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| cmd                        | string, [string, string] | `+++`         | Defines a custom command delimiter. This can be a String e.g. '+++' or an Array of Strings with length 2: ['{', '}'] in which the first element serves as the start delimiter and the second as the end delimiter.                                                                                                                                                                              |
| literalXmlDelimiter        | string                   | `\|\|`        | The delimiter that's used to indicate literal XML that should be inserted into the docx XML tree as-is.                                                                                                                                                                                                                                                                                         |
| processLineBreaks          | boolean                  | true          | Handle linebreaks in result of commands as actual linebreaks                                                                                                                                                                                                                                                                                                                                    |
| failFast                   | boolean                  | true          | Whether to fail on the first error encountered in the template.                                                                                                                                                                                                                                                                                                                                 |
| rejectNullish              | boolean                  | false         | When set to true, this setting ensures createReport throws a NullishCommandResultError when the result of an INS, HTML, IMAGE, or LINK command is null or undefined. This is useful as nullish return values usually indicate a mistake in the template or the invoking code.                                                                                                                   |
| fixSmartQuotes             | boolean                  | false         | MS Word usually autocorrects JS string literal quotes with unicode 'smart' quotes ('curly' quotes). E.g. 'aubergine' -> ‘aubergine’. This causes an error when evaluating commands containing these smart quotes, as they are not valid JavaScript. If you set fixSmartQuotes to 'true', these smart quotes will automatically get replaced with straight quotes (') before command evaluation. |
| processLineBreaksAsNewText | boolean                  | false         | Use the new way of injecting line breaks from command results (only applies when processLineBreaks is true) which has better results in LibreOffice and Google Drive.                                                                                                                                                                                                                           |

### Request and Response

```typescript
export interface PrintWordPipelineStepInFragment {
	template: Buffer;
	data: any;
	jsContext?: Object;
}

export interface PrintWordPipelineStepOutFragment {
	file: Buffer;
}
```

### An Example

Find template and unit test in `/test` folder, syntax for using a Word template is as follows.

#### Command Delimiters

The default command delimiters are `+++` and `+++`. This means that commands are written as `+++command+++`. You can change the delimiters
by setting the `cmd` option to a string or an array of strings with length 2: `['{', '}']`, `['{#', '#}']` for example.

#### Property Value

The following syntaxes are equivalent. You can choose based on your needs:

- `+++INS project.name+++`,
- `+++= project.name+++`,
- `+++project.name+++`.

It is important to note that the content supports JavaScript syntax. Therefore, the following notation is also equally effective:

- `+++INS ``${project.name ?? ''}``+++`.

> Always define the Word document style you need across the entire command. If it is only defined within the command content, the style will
> not take effect.

#### Image or SVG

Use the `IMAGE` syntax to replace images or SVG. This syntax calls a context function to retrieve image details, as follows:

- `+++IMAGE logo()+++`.

When using the syntax above, please ensure that the corresponding function is already provided in the `jsContext` context object passed as a
parameter,

```typescript
jsContext: {
	logo: () => {
		const data = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="63" height="20" role="img" aria-label="InsureMO"><title>InsureMO</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="63" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="0" height="20" fill="#777af2"/><rect x="0" width="63" height="20" fill="#777af2"/><rect width="63" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110"><text aria-hidden="true" x="315" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="530">InsureMO</text><text x="315" y="140" transform="scale(.1)" fill="#fff" textLength="530">InsureMO</text></g></svg>`, 'utf-8');
		return {width: 1.66687479, height: 0.5291666, data, extension: '.svg'};
	}
}
```

> Please note that the units for `width` and `height` are in centimeters (cm), not in pixel values. Generally, it can be assumed that at a
> resolution of 96 DPI, approximately one pixel is equal to `1.66687479cm`.

#### Link

Use the `LINK` syntax to replace links. This syntax also can call a context function to retrieve link details, as follows:

- `+++LINK ({ url: project.url, label: project.name })+++`,
- `+++LINK link()+++`.

When using the syntax above, please ensure that the corresponding function is already provided in the `jsContext` context object passed as a

```typescript
jsContext: {
	link: () => {
		// data is the data passed to the print step
		return {url: data.project.url, label: data.project.name};
	};
}
```

#### For Loop

Use the `FOR ... IN`, `END-FOR` syntax to loop through the array, as follows:

```
+++FOR group IN groups+++
Group (+++`${$idx + 1}`+++)
Cash In Tax: +++= $group.subTotal.cashInTxn+++
Cash In Amount: +++= $group.subTotal.cashInAmt+++
Departments:
+++FOR dept IN $group.depts+++
Department (+++`${$idx + 1}`+++)
	Name: +++$dept.name+++
	Cashier: +++$dept.cashierName+++
	Cash In Tax: +++$dept.cashInTxn+++
	Cash In Amount: +++$dept.cashInAmt+++
+++END-FOR dept+++
+++END-FOR group+++
```

> From the sample above, it can be observed that nested loops are also supported.

> It is possible to get the current element index of the inner-most loop with the variable `$idx`, starting from `0`.

To obtain the array data (`arrayPropertyName`) used in the loop body and define a variable name (`variableName`) that represents each array
element in the loop, you can use the `FOR variableName IN arrayPropertyName` syntax. In the example above, they are respectively:

- `+++FOR group IN groups+++`,
- `+++FOR dept IN $group.depts+++`.

Similarly, the loop ending must be defined in the correct order, following the rule of ending the ones that start later. The order is as
follows:

- `+++END-FOR dept+++`,
- `+++END-FOR group+++`.

> Please note that when ending the loop, you need to use the variable name defined in the loop start.

The following syntax can be used to output a table using loops:

| Group                            | Department         | Cashier                   | Cash In Tax                         | Cash In Amount                      |
|----------------------------------|--------------------|---------------------------|-------------------------------------|-------------------------------------|
| `+++For group In groups+++`      |                    |                           |                                     |                                     |
| `Group (+++``${$idx + 1}``+++)`  |                    |                           | `+++= $group.subTotal.cashInTxn+++` | `+++= $group.subTotal.cashInAmt+++` |
| `+++FOR dept IN $group.depts+++` |                    |                           |                                     |                                     |
|                                  | `+++$dept.name+++` | `+++$dept.cashierName+++` | `+++$dept.cashInTxn+++`             | `+++$dept.cashInAmt+++`             |
| `+++END-FOR dept+++`             |                    |                           |                                     |                                     |
| `+++END-FOR group+++`            |                    |                           |                                     |                                     |

#### If Statement

Use the `IF ... END-IF` syntax to implement the if statement, as follows:

```
+++FOR group IN groups+++
Group (+++`${$idx + 1}`+++)
Cash In Tax: +++= $group.subTotal.cashInTxn+++
Cash In Amount: +++= $group.subTotal.cashInAmt+++
Departments:
+++FOR dept IN $group.depts+++
+++IF $dept.name === 'Development'+++
Department (+++`${$idx + 1}`+++)
	Name: +++$dept.name+++
	Cashier: +++$dept.cashierName+++
	Cash In Tax: +++$dept.cashInTxn+++
	Cash In Amount: +++$dept.cashInAmt+++
+++END-IF+++
+++END-FOR dept+++
+++END-FOR group+++
```

> From the sample above, it can be observed that `IF ... END-IF` can be applied inside loop.

The `IF statement` actually executes the given JavaScript syntax and determines whether to output the internal content based on the boolean
value of the result:

- `+++IF $dept.name === 'Development'+++`,
- `+++END-IF+++`.

Similarly, `IF ... END-IF` can also be used in table output:

| Group                                   | Department         | Cashier                   | Cash In Tax                         | Cash In Amount                      |
|-----------------------------------------|--------------------|---------------------------|-------------------------------------|-------------------------------------|
| `+++For group In groups+++`             |                    |                           |                                     |                                     |
| `Group (+++``${$idx + 1}``+++)`         |                    |                           | `+++= $group.subTotal.cashInTxn+++` | `+++= $group.subTotal.cashInAmt+++` |
| `+++FOR dept IN $group.depts+++`        |                    |                           |                                     |                                     |
| `+++IF $dept.name === 'Development'+++` |                    |                           |                                     |                                     |
|                                         | `+++$dept.name+++` | `+++$dept.cashierName+++` | `+++$dept.cashInTxn+++`             | `+++$dept.cashInAmt+++`             |
| `+++END-IF+++`                          |                    |                           |                                     |                                     |
| `+++END-FOR dept+++`                    |                    |                           |                                     |                                     |
| `+++END-FOR group+++`                   |                    |                           |                                     |                                     |

### Known Issues

- If the `LINK` syntax is used in the header or footer, it may result in the issue of "Word found unreachable content" when opening the
  document in Word. Although this does not affect the final content display (the link will not work), it can easily confuse users. However,
  if it is a static link, it is not affected,
- Odd and even row background colors are currently not supported.