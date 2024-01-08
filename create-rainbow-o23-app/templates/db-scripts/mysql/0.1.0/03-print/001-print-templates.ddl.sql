-- author: brad.wu
-- tags: system

CREATE TABLE T_O23_PRINT_TEMPLATES
(
    TEMPLATE_ID        BIGINT PRIMARY KEY          NOT NULL,
    TEMPLATE_CODE      VARCHAR(32)                 NOT NULL,
    TEMPLATE_NAME      VARCHAR(32)                 NULL,
    TEMPLATE_TYPE      ENUM ('PDF', 'EXCEL','CSV') NOT NULL,
    ENABLED            TINYINT(1)                  NOT NULL DEFAULT 1,
    DATA_PIPELINE      JSON                        NULL,
    TEMPLATE_FILE_NAME VARCHAR(128)                NULL,
    TEMPLATE_FILE      MEDIUMBLOB                  NULL,
    TENANT_CODE        VARCHAR(64)                 NULL,
    VERSION            INT                         NOT NULL DEFAULT 1 COMMENT 'Optimistic lock',
    CREATED_AT         DATETIME                    NOT NULL,
    CREATED_BY         VARCHAR(64)                 NOT NULL,
    LAST_MODIFIED_AT   DATETIME                    NOT NULL,
    LAST_MODIFIED_BY   VARCHAR(64)                 NOT NULL,
    UNIQUE INDEX (TEMPLATE_CODE, TENANT_CODE),
    INDEX (TENANT_CODE)
);
