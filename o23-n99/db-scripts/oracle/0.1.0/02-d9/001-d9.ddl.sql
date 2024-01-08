-- author: brad.wu
-- tags: system

CREATE TABLE T_O23_D9_CONFIG
(
    CONFIG_ID        NUMBER(19) PRIMARY KEY NOT NULL,
    CONFIG_CODE      VARCHAR2(32)           NOT NULL,
    CONFIG_NAME      VARCHAR2(128)          NOT NULL,
    CONFIG_TYPE      VARCHAR2(32)           NOT NULL,
    LANGUAGE         VARCHAR2(32)           NULL,
    ENABLED          NUMBER(1)  DEFAULT 1   NOT NULL,
    CONFIG           CLOB                   NOT NULL,
    DATA_PIPELINE    CLOB                   NULL,
    TENANT_CODE      VARCHAR2(64)           NULL,
    VERSION          NUMBER(10) DEFAULT 1   NOT NULL,
    CREATED_AT       TIMESTAMP              NOT NULL,
    CREATED_BY       VARCHAR2(64)           NOT NULL,
    LAST_MODIFIED_AT TIMESTAMP              NOT NULL,
    LAST_MODIFIED_BY VARCHAR2(64)           NOT NULL
)
