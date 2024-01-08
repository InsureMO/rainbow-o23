-- author: brad.wu
-- tags: system

CREATE TABLE T_O23_PIPELINE_DEFS
(
    DEF_ID           BIGINT PRIMARY KEY NOT NULL,
    DEF_CODE         VARCHAR(32)        NOT NULL COMMENT 'Must be same as code in config.',
    ENABLED          TINYINT(1)         NOT NULL DEFAULT 1,
    EXPOSE_API       TINYINT(1)         NOT NULL DEFAULT 1 COMMENT 'Expose as rest api when true, only works when def is pipeline and must be as it in config.',
    EXPOSE_ROUTE     VARCHAR(128)       NULL COMMENT 'Rest api route when it exposes.',
    CONFIG           MEDIUMTEXT         NOT NULL,
    TENANT_CODE      VARCHAR(64)        NULL,
    VERSION          INT                NOT NULL DEFAULT 1 COMMENT 'Optimistic lock',
    CREATED_AT       DATETIME           NOT NULL,
    CREATED_BY       VARCHAR(64)        NOT NULL,
    LAST_MODIFIED_AT DATETIME           NOT NULL,
    LAST_MODIFIED_BY VARCHAR(64)        NOT NULL,
    UNIQUE INDEX (DEF_CODE, TENANT_CODE),
    UNIQUE INDEX (EXPOSE_API, TENANT_CODE),
    INDEX (TENANT_CODE)
);
