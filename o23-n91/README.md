![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![Nest](https://img.shields.io/badge/nest-white.svg?logo=nestjs&logoColor=E0234E&style=social)
![Puppeteer](https://img.shields.io/badge/Puppeteer-white.svg?logo=puppeteer&logoColor=40B5A4&style=social)
![ExcelJS](https://img.shields.io/badge/ExcelJS-white.svg?logo=microsoftexcel&logoColor=217346&style=social)
![CSV for Node.js](https://img.shields.io/badge/CSV%20for%20Node.js-548694.svg)

![Module Formats](https://img.shields.io/badge/module%20formats-cjs-green.svg)

# o23/n91

`o23/n91` is a web application that provides printing services for `o23/n90`.

### Environment Parameters

| Name                | Type    | Default Value | Comments                     |
|---------------------|---------|---------------|------------------------------|
| `app.plugins.print` | boolean | false         | Import print service or not. |

### Print Service

`o23/n91` has already deployed a printing service by leveraging the pipeline steps provided by `o23/n5` and `o23/n6`. You can find all the
service definitions in `server/03-print`. These services are based on database tables `T_O23_PRINT_TASKS` and `T_O23_PRINT_TEMPLATES`.

> Please note that the PDF printing service relies on Chromium, so please refer to `o23/n5` and the [Puppeteer](https://pptr.dev/)
> documentation for deployment instructions.
