![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![Nest](https://img.shields.io/badge/nest-white.svg?logo=nestjs&logoColor=E0234E&style=social)
![Puppeteer](https://img.shields.io/badge/Puppeteer-white.svg?logo=puppeteer&logoColor=40B5A4&style=social)
![ExcelJS](https://img.shields.io/badge/ExcelJS-white.svg?logo=microsoftexcel&logoColor=217346&style=social)
![CSV for Node.js](https://img.shields.io/badge/CSV%20for%20Node.js-548694.svg)
![Docx-templates](https://img.shields.io/badge/Docx--templates-white.svg?logo=microsoftword&logoColor=2B579A&style=social)
![dotenv](https://img.shields.io/badge/dotenv-white.svg?logo=dotenv&logoColor=ECD53F&style=social)

![TypeORM](https://img.shields.io/badge/TypeORM-E83524.svg)
![MySQL](https://img.shields.io/badge/MySQL-white.svg?logo=mysql&logoColor=4479A1&style=social)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-white.svg?logo=postgresql&logoColor=4169E1&style=social)
![MSSQL](https://img.shields.io/badge/MSSQL-white.svg?logo=microsoftsqlserver&logoColor=CC2927&style=social)
![Oracle](https://img.shields.io/badge/Oracle-white.svg?logo=oracle&logoColor=F80000&style=social)

![Module Formats](https://img.shields.io/badge/module%20formats-cjs-green.svg)

# Idea of `o23`

The inspiration for `o23` comes from the increasing complexity of backend systems, especially in the context of microservices. Each
microservice focuses on providing its own specific functionality, but when it comes to organizing and consuming the multitude of these
services, we often face a significant challenge. It becomes difficult to have a convenient way to consume services while effectively
managing their organizational structure. This often leads to front-end applications having to invest a considerable amount of effort in
implementation work.

Therefore, `o23` introduces the concept that everything is a pipeline. In reality, our front-end service is to some extent a pipeline that
reorganizes and connects existing microservices. In the past, this process usually involved re-implementing an application, regardless of
the language it was based on (such as Java, Python, Go, Kotlin, Node.js). It was always a process of redevelopment. Although the code itself
may be
controlled, the logic within the code is not effectively managed.

However, if we make this code logic configurable, scriptable, and modular, we will find that it becomes much simpler to understand an
end-to-end process. Additionally, it becomes easier to modify and customize the process when needed.

So, leveraging the powerful dynamic script execution capabilities of JavaScript, we attempted to build a pipeline engine based on Node.js
and further deploy it on a web server. With this infrastructure in place, our aim is to make the development of front-end applications
simpler, more understandable, faster in terms of iteration speed, and more controlled.

# Modular Design

`o23`'s design has considered multiple use cases, including:

- Embedded applications: some Node.js applications may want to use the pipeline engine locally while maintaining their original structure,
- Standalone application services: if possible, we recommend building front-end applications entirely based on `o23`. `o23` provides very
  convenient scaffolding to create your own application within minutes.
- Cloud-native applications: thanks to the convenience of cloud services, `o23` also supports deployment using serverless/lambda. In this
  way, users can detach from the tedious operation and maintenance of applications and focus more on the business itself. This is also one
  of the recommended deployment methods.

Based on the various scenarios described above, `o23` has been designed as multiple modules, outlined as follows:

- [o23/n1](o23-n1/README.md): Provides the standard API and basic implementation for the pipeline. It also includes support for system
  environment variable retrieval, logging, and exception definitions at the lowest level,
- [o23/n2](o23-n2/README.md): Implemented using [NestJS](https://nestjs.com/), it provides the ability to expose the pipeline as a REST API.
  By properly defining the pipeline, you can use this module to quickly build and launch a web service within minutes and expose the
  specified pipeline as a standard REST API for external use,
- [o23/n3](o23-n3/README.md): The actual implementation of the pipeline engine, providing essential building capabilities such as database
  operations and remote API operations. We will delve into further details in the subsequent chapters,
- [o23/n4](o23-n4/README.md): An implementation of the pipeline configuration parser, providing basic capabilities to parse pipelines based
  on YAML configuration,
- [o23/n5](o23-n5/README.md): Provides a pipeline step to generate PDFs based on HTML templates,
- [o23/n6](o23-n6/README.md): Provides pipeline steps to generate Excel reports based on xlsx templates and CSV reports based on CSV
  templates,
- [o23/n7](o23-n7/README.md): Provides pipeline steps to generate Word reports based on docx templates,
- [o23/n90](o23-n90/README.md): Application basic package, which includes all the fundamental settings for building O23 applications,
- [o23/n91](o23-n91/README.md): O23 Application printing plugin package,
- [o23/n99](o23-n99/README.md): A complete pre-application built on all the above modules, which is a complete web service itself and can
  also be used as an engineering template,
- [create-rainbow-o23-app](create-rainbow-o23-app/README.md): `npx` module for create customized awesome `o23` application.

In the following chapters, we will introduce these modules one by one.