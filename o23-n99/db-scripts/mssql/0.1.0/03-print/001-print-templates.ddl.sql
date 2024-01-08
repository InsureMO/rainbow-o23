-- author: brad.wu
-- tags: system

CREATE TABLE T_O23_PRINT_TEMPLATES
(
    TEMPLATE_ID        BIGINT PRIMARY KEY NOT NULL,
    TEMPLATE_CODE      NVARCHAR(32)       NOT NULL,
    TEMPLATE_NAME      NVARCHAR(32)       NULL,
    TEMPLATE_TYPE      NVARCHAR(16)       NOT NULL CHECK (TEMPLATE_TYPE IN ('PDF', 'EXCEL', 'CSV')),
    ENABLED            SMALLINT           NOT NULL DEFAULT 1,
    DATA_PIPELINE      NVARCHAR(MAX)      NULL,
    TEMPLATE_FILE_NAME NVARCHAR(128)      NULL,
    TEMPLATE_FILE      VARBINARY(MAX)     NULL,
    TENANT_CODE        NVARCHAR(64)       NULL,
    VERSION            INT                NOT NULL DEFAULT 1,
    CREATED_AT         DATETIME          NOT NULL,
    CREATED_BY         NVARCHAR(64)       NOT NULL,
    LAST_MODIFIED_AT   DATETIME          NOT NULL,
    LAST_MODIFIED_BY   NVARCHAR(64)       NOT NULL
);
CREATE UNIQUE INDEX I_O23_PRINT_TEMPLATES_1 ON T_O23_PRINT_TEMPLATES (TEMPLATE_CODE, TENANT_CODE);
CREATE INDEX I_O23_PRINT_TEMPLATES_2 ON T_O23_PRINT_TEMPLATES (TENANT_CODE);
EXEC SP_ADDEXTENDEDPROPERTY 'MS_Description', 'Optimistic lock',
     'SCHEMA', 'dbo', 'TABLE', 'T_O23_PRINT_TEMPLATES', 'COLUMN', 'VERSION';
