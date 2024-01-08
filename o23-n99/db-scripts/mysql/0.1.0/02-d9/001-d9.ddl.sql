-- author: brad.wu
-- tags: system

CREATE TABLE T_O23_D9_CONFIG
(
    CONFIG_ID        BIGINT PRIMARY KEY NOT NULL,
    CONFIG_CODE      VARCHAR(32)        NOT NULL,
    CONFIG_NAME      VARCHAR(128)       NOT NULL,
    CONFIG_TYPE      VARCHAR(32)        NOT NULL,
    LANGUAGE         VARCHAR(32)        NULL,
    ENABLED          TINYINT(1)         NOT NULL DEFAULT 1,
    CONFIG           JSON               NOT NULL,
    DATA_PIPELINE    JSON               NULL,
    TENANT_CODE      VARCHAR(64)        NULL,
    VERSION          INT                NOT NULL DEFAULT 1 COMMENT 'Optimistic lock',
    CREATED_AT       DATETIME           NOT NULL,
    CREATED_BY       VARCHAR(64)        NOT NULL,
    LAST_MODIFIED_AT DATETIME           NOT NULL,
    LAST_MODIFIED_BY VARCHAR(64)        NOT NULL,
    UNIQUE INDEX (CONFIG_CODE, LANGUAGE, TENANT_CODE),
    INDEX (CONFIG_TYPE),
    INDEX (TENANT_CODE)
);
