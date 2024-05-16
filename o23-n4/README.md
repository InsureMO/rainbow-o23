![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![Module Formats](https://img.shields.io/badge/module%20formats-cjs-green.svg)

# o23/n4

`o23/n4` provides the ability to read pipeline and pipeline step configurations, currently supporting the YAML format. While reading the
configuration, o23/n4 simplifies the notation of certain properties and also adds some related validation and script parsing supplements, as
follows:

- For single-line snippet, a prefix `return ` will be automatically added to ensure that data can be returned,
- Automatic conversion between camel case and kebab case property names,
- If a property value starts with `env:`, it will be automatically replaced with the corresponding environment variable value,
- The prefix `env:` supports multiple environment variables, separated by commas, with the first one having a value taking precedence.

When writing YAML configurations, the following syntax rules should also be noted:

- `null` string value will be recognized as a `null` value. If you need to return a `null` value, you can write it as `"null"`
  or `return null`,
- Property values that conform to JSON syntax will be automatically parsed. Therefore, if a value needs to be treated as a snippet, it
  should be enclosed in double quotation marks (""). For example, `{name: $factor.name}` can be written as `"{name: $factor.name}"`,
- Sometimes, we don't want the `return ` prefix to be automatically added before a single-line snippet. In this case, we can use the
  vertical line `|` syntax to avoid this problem. For example, consider this:

  ```yaml
  snippet: $factor.enabled = true
  ```

  If it is written in this way, the return value is `true`. We can instead write it as following:

  ```yaml
  snippet: |
    $factor.enabled = true
  ```

You can find all relevant YAML configuration examples in the `server/02-api-test` folder of `o23/n99`. Since the property names are
self-explanatory, we will not explain the purpose of each property in the following section. You can refer to the documentation of `o23/n3`
for this part.
