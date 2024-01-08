-- author: brad.wu
-- tags: system

CREATE TYPE PRINT_TEMPLATE_TYPE AS ENUM ('PDF', 'EXCEL', 'CSV');
CREATE TABLE T_O23_PRINT_TEMPLATES
(
    TEMPLATE_ID        DECIMAL(20) PRIMARY KEY NOT NULL,
    TEMPLATE_CODE      VARCHAR(32)             NOT NULL,
    TEMPLATE_NAME      VARCHAR(32)             NULL,
    TEMPLATE_TYPE      PRINT_TEMPLATE_TYPE     NOT NULL,
    ENABLED            SMALLINT                NOT NULL DEFAULT 1,
    DATA_PIPELINE      JSON                    NULL,
    TEMPLATE_FILE_NAME VARCHAR(128)            NULL,
    TEMPLATE_FILE      BYTEA                   NULL,
    TENANT_CODE        VARCHAR(64)             NULL,
    VERSION            INT                     NOT NULL DEFAULT 1,
    CREATED_AT         TIMESTAMP               NOT NULL,
    CREATED_BY         VARCHAR(64)             NOT NULL,
    LAST_MODIFIED_AT   TIMESTAMP               NOT NULL,
    LAST_MODIFIED_BY   VARCHAR(64)             NOT NULL
);
CREATE UNIQUE INDEX I_O23_PRINT_TEMPLATES_1 ON T_O23_PRINT_TEMPLATES (TEMPLATE_CODE, TENANT_CODE);
CREATE INDEX I_O23_PRINT_TEMPLATES_2 ON T_O23_PRINT_TEMPLATES (TENANT_CODE);
COMMENT ON COLUMN T_O23_PRINT_TEMPLATES.VERSION IS 'Optimistic lock';
