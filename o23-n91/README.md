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
