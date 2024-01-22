# o23/n5

`o23/n5` provides a pipeline step that converts HTML templates to PDF, implemented based on [Puppeteer](https://pptr.dev/).

## Environment Parameters

| Name                                      | Type    | Default Value | Comments                                                                                                                                                                                           |
|-------------------------------------------|---------|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `puppeteer.executable.path`               | string  |               | Chromium path.                                                                                                                                                                                     |
| `puppeteer.browser.args`                  | string  |               | Chromium browser launch arguments.<br>Format follows `--disable-gpu[,--no-sandbox[...]]`.<br>See https://peter.sh/experiments/chromium-command-line-switches/ for more details.                    |
| `puppeteer.browser.cache`                 | boolean | true          | Use browser cache or not.                                                                                                                                                                          |
| `puppeteer.devtools.enabled`              | boolean | false         | Open devtools or not.                                                                                                                                                                              |
| `puppeteer.headless.enabled`              | boolean | true          | Use headless mode or not.                                                                                                                                                                          |
| `puppeteer.max.pages`                     | number  | 50            | Maximum pages(tabs) in single browser, only works when browser cache is enabled.                                                                                                                   |
| `puppeteer.viewport.width`                | number  | 1920          | Default viewport width, only works when `viewport` not present by constructor.                                                                                                                     |
| `puppeteer.viewport.height`               | number  | 1080          | Default viewport height, only works when `viewport` not present by constructor.                                                                                                                    |
| `puppeteer.pdf.header.and.footer.display` | boolean | false         | Show pdf header and footer or not, only works when `pdfOptions.displayHeaderFooter` not present by constructor.                                                                                    |
| `puppeteer.pdf.background`                | boolean | false         | Print background or not, only works when `pdfOptions.printBackground` not present by constructor.                                                                                                  |
| `puppeteer.pdf.format`                    | string  | a4            | Print page format, only works when `pdfOptions.format` not present by constructor.                                                                                                                 |
| `puppeteer.pdf.timeout`                   | number  | 30            | Print timeout, in seconds, only works when `pdfOptions.timeout` not present by constructor.                                                                                                        |
| `puppeteer.page.keep`                     | boolean | false         | Keep browser page after printed, enable this feature will disable headless mode automatically, also, recommend to disable browser cache.<br>Only for debug purpose, never enable it in production. |

## Constructor Parameters

| Name        | Type                 | Default Value | Comments                                                                                                                                                                   |
|-------------|----------------------|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| browserArgs | string               |               | Additional browser arguments.<br>Format follows `--disable-gpu[,--no-sandbox[...]]`.<br>See https://peter.sh/experiments/chromium-command-line-switches/ for more details. |
| viewport    | puppeteer.Viewport   |               |                                                                                                                                                                            |
| pdfOptions  | puppeteer.PDFOptions |               |                                                                                                                                                                            |

## Request and Response

```typescript
export interface PrintPdfPipelineStepInFragment {
	/** it is a html */
	template: Buffer | string;
	data: any;
}

export interface PrintPdfPipelineStepOutFragment {
	file: Buffer;
}
```

## An Example

### Data

```javascript
const data = {
	type: 'Test Pdf',
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

### Template

```html

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
<div>
    <h1 style="color: red" data-print="field" data-print-field="type">Name</h1>
    <table>
        <thead>
        <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Birthday</th>
        </tr>
        </thead>
        <tbody>
        <tr data-print="loop" data-print-field="information">
            <td data-print="field" style="color: red" data-print-field="name">Name</td>
            <td data-print="field" data-print-field="age">Age</td>
            <td data-print="field" data-print-field="birthday">Birthday</td>
            <td>
                <span data-print="loop" data-print-field="addresses">
                    <span data-print="field" data-print-field="" style="display: block">Address</span>
                </span>
            </td>
        </tr>
        </tbody>
    </table>
    <table>
        <thead>
        <tr>
            <th>Id</th>
            <th>Product Name</th>
            <th>Product Info</th>
        </tr>
        </thead>
        <tbody>
        <tr data-print="loop" data-print-field="policy">
            <td data-print="field" style="color: red" data-print-field="id">id</td>
            <td data-print="field" data-print-field="productName">productName</td>
            <td data-print="field" data-print-field="productInfo">productInfo</td>
        </tr>
        </tbody>
    </table>
</div>
</body>
</html>
  ```

- Supports nested loops,
- `data-print=loop` represents loop,
- `data-print=field` represents property,
- `data-print-field` represents property name,
	- Supports multi-level property names, connected by `.`. For example, `person.name` represents that `person` is an object
	  and `name` is a property under `person`,
- `` or `.` represents use loop array itself,
- All properties are relative paths, calculated relative to their parent node. Therefore, within a loop, only the values of each element
  can be accessed.

#### Post Data Prepare

After the data preparation phase is completed, but before obtaining the header, footer, and printing parameters, the system will
automatically detect and invoke the `postDataPrepare` function in order to incorporate additional custom logic. This function receives a
parameter of the current printing data, and custom logic can be written based on the data.

> Please note that this function is executed synchronously, so it is not recommended to perform time-consuming operations.

#### Page Header and Footer

Both headers and footers are supported simultaneously, and you only need to use standard HTML node definitions with specified IDs.
Additionally, thanks to the support provided by Puppeteer itself, the following fixed usage patterns can be used to obtain the specified
information:

| HTML                               | Description                        |
|------------------------------------|------------------------------------|
| `<header id="header"></header>`    | Page header, can include anything. |
| `<footer id="footer"></footer>`    | Page footer, can include anything. |
| `<span class=”date”></span>`       | Current date                       |
| `<span class=”title”></span>`      | Document title                     |
| `<span class=””url></span>`        | Document URL                       |
| `<span class=”pageNumber”></span>` | Current page number                |
| `<span class=”totalPages”></span>` | Total pages in the document        |

#### PDF Options

Furthermore, `pdfOptions` can also be specified by the template, allowing each template to have its own settings. The syntax is as follows:

```html
<!-- format of data-attr follows pdfOptions signature -->
<template id="pdfOptions" data-attr='{"margin": {"top": "100px", "bottom": "100px", "left": "50px", "right": "50px"}}'></template>
```

> In the example above, the margin of the print page header is set. Typically, when using headers and footers, it is necessary to manually
> set the page margin information as well.

## Installation

Generally speaking, when installing dependencies, `Node` will automatically download Chromium.
If it is not automatically installed, you can use the following command for installation.
The installed Chromium can be found in the `puppeteer` directory.

``` 

// workspace mode
node ../node_modules/puppeteer/install.mjs

// single project mode
node ./node_modules/puppeteer/install.mjs

```

> Use `puppeteer.config.cjs` to provide the location of chromium, see https://pptr.dev/guides/configuration for more details.
