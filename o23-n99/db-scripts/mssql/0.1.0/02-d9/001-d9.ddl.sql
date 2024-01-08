-- author: brad.wu
-- tags: system

CREATE TABLE T_O23_D9_CONFIG
(
    CONFIG_ID        BIGINT PRIMARY KEY NOT NULL,
    CONFIG_CODE      NVARCHAR(32)       NOT NULL,
    CONFIG_NAME      NVARCHAR(128)      NOT NULL,
    CONFIG_TYPE      NVARCHAR(32)       NOT NULL,
    LANGUAGE         NVARCHAR(32)       NULL,
    ENABLED          TINYINT            NOT NULL DEFAULT 1,
    CONFIG           NVARCHAR(MAX)      NOT NULL,
    DATA_PIPELINE    NVARCHAR(MAX)      NULL,
    TENANT_CODE      NVARCHAR(64)       NULL,
    VERSION          INT                NOT NULL DEFAULT 1,
    CREATED_AT       DATETIME          NOT NULL,
    CREATED_BY       NVARCHAR(64)       NOT NULL,
    LAST_MODIFIED_AT DATETIME          NOT NULL,
    LAST_MODIFIED_BY NVARCHAR(64)       NOT NULL
);
CREATE UNIQUE INDEX I_O23_D9_CONFIG_1 ON T_O23_D9_CONFIG (CONFIG_CODE, LANGUAGE, TENANT_CODE);
CREATE INDEX I_O23_D9_CONFIG_2 ON T_O23_D9_CONFIG (CONFIG_TYPE);
CREATE INDEX I_O23_D9_CONFIG_3 ON T_O23_D9_CONFIG (TENANT_CODE);
EXEC SP_ADDEXTENDEDPROPERTY 'MS_Description', 'Optimistic lock',
     'SCHEMA', 'dbo', 'TABLE', 'T_O23_D9_CONFIG', 'COLUMN', 'VERSION';
