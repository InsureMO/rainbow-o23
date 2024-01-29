![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![Docx-templates](https://img.shields.io/badge/Docx--templates-white.svg?logo=microsoftword&logoColor=2B579A&style=social)

![Module Formats](https://img.shields.io/badge/module%20formats-cjs-green.svg)

# o23/n7

`o23/n7` provides

- A pipeline step that converts word templates to word, implemented based on [Docx-templates](https://github.com/guigrpa/docx-templates).

## Word Generate Step

### Environment Parameters

| Name                              | Type    | Default Value | Comments                                             |
|-----------------------------------|---------|---------------|------------------------------------------------------|

### Request and Response

```typescript
export interface PrintWordPipelineStepInFragment {
	template: Buffer;
	data: any;
}

export interface PrintWordPipelineStepOutFragment {
	file: Buffer;
}
```

### An Example

### Known Issues

