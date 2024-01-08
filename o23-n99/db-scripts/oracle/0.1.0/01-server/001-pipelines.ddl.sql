-- author: brad.wu
-- tags: system

CREATE TABLE T_O23_PIPELINE_DEFS
(
    DEF_ID           NUMBER(19) PRIMARY KEY NOT NULL,
    DEF_CODE         VARCHAR2(32)           NOT NULL,
    ENABLED          NUMBER(1)  DEFAULT 1   NOT NULL,
    EXPOSE_API       NUMBER(1)  DEFAULT 1   NOT NULL,
    EXPOSE_ROUTE     VARCHAR2(128)          NULL,
    CONFIG           CLOB                   NOT NULL,
    TENANT_CODE      VARCHAR2(64)           NULL,
    VERSION          NUMBER(10) DEFAULT 1   NOT NULL,
    CREATED_AT       TIMESTAMP              NOT NULL,
    CREATED_BY       VARCHAR2(64)           NOT NULL,
    LAST_MODIFIED_AT TIMESTAMP              NOT NULL,
    LAST_MODIFIED_BY VARCHAR2(64)           NOT NULL
)
