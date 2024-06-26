![Static Badge](https://img.shields.io/badge/InsureMO-777AF2.svg)

![Amazon S3](https://img.shields.io/badge/Amazon%20S3-white.svg?logo=amazons3&logoColor=569A31&style=social)

![Module Formats](https://img.shields.io/badge/module%20formats-cjs-green.svg)

# o23/n8

`o23/n8` provides the pipeline steps related to AWS.

## AWS Credential Identity Environment Parameters

| Name                                 | Type   | Default Value | Comments                      |
|--------------------------------------|--------|---------------|-------------------------------|
| `aws.client.CLIENT.access.key`       | string |               | AWS credential access key.    |
| `aws.client.CLIENT.secret.key`       | string |               | AWS credential secret key.    |
| `aws.client.CLIENT.session.token`    | string |               | AWS credential session token. |
| `aws.client.CLIENT.credential.scope` | string |               | AWS credential scope.         |

## AWS Region Step Environment Parameters

| Name                       | Type   | Default Value | Comments    |
|----------------------------|--------|---------------|-------------|
| `aws.client.CLIENT.region` | string |               | AWS region. |

## AWS S3 Steps

S3 pipeline steps are actually a simple wrapper for the AWS SDK, so their parameters and returns follow the specifications
of [@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3).

### Environment Parameters

| Name                        | Type   | Default Value | Comments     |
|-----------------------------|--------|---------------|--------------|
| `aws.s3.CLIENT.client.type` | string | `default`     | Client type. |

`CLIENT` represents client name.

> Use `RegionClientManager.registerS3ClientCreator` to register client creator.

#### Default

When `aws.s3.CLIENT.client.type=default` or not presents:

| Name                   | Type   | Default Value | Comments         |
|------------------------|--------|---------------|------------------|
| `aws.s3.CLIENT.bucket` | string |               | AWS bucket name. |

> `default` client type read AWS credential identity and region environment parameters.

### Constructor Parameters

| Name       | Type   | Default Value | Comments                                                                                                                                               |
|------------|--------|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| clientName | string |               | S3 client name, used for reading related configuration information.                                                                                    |
| bucketName | string |               | S3 bucket name, if not set, it will attempt to use the client's configuration for reading; or it can also be passed during the execution of the steps. |

#### Request and Response

```typescript
export interface AbstractS3PipelineStepInFragment {
	Bucket?: string | undefined;
}

export interface AbstractS3PipelineStepOutFragment {
}
```

### Get Object Step

#### Constructor Parameters

| Name           | Type    | Default Value | Comments                                     |
|----------------|---------|---------------|----------------------------------------------|
| contentAs      | string  |               | Read object content as `string` or `buffer`. |
| ignoreNotFound | boolean | false         | Ignore error when object not found.          |

#### Request and Response

```typescript
export type S3GetObjectPipelineStepInFragment = AbstractS3PipelineStepInFragment & GetObjectCommandInput;
export type S3GetObjectPipelineStepOutFragment = AbstractS3PipelineStepOutFragment & GetObjectCommandOutput;
```

### Put Object Step

#### Request and Response

```typescript
export type S3PutObjectPipelineStepInFragment = AbstractS3PipelineStepInFragment & PutObjectCommandInput;
export type S3PutObjectPipelineStepOutFragment = AbstractS3PipelineStepOutFragment & PutObjectCommandOutput;
```

### Delete Object Step

#### Request and Response

```typescript
export type S3DeleteObjectPipelineStepInFragment = AbstractS3PipelineStepInFragment & DeleteObjectCommandInput;
export type S3DeleteObjectPipelineStepOutFragment = AbstractS3PipelineStepOutFragment & DeleteObjectCommandOutput;
```

### List Objects Step

#### Request and Response

```typescript
export type S3ListObjectsPipelineStepInFragment = AbstractS3PipelineStepInFragment & ListObjectsV2CommandInput;
export type S3ListObjectsPipelineStepOutFragment = AbstractS3PipelineStepOutFragment & ListObjectsV2CommandOutput;
```
