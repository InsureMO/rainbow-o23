-- author: brad.wu
-- tags: system

CREATE TABLE T_O23_PRINT_TASKS
(
    TASK_ID           NUMBER(19) PRIMARY KEY NOT NULL,
    TASK_KEY          VARCHAR2(64)           NOT NULL,
    TEMPLATE_ID       NUMBER(19)             NOT NULL,
    STATUS            VARCHAR2(16)           NOT NULL CHECK (STATUS IN ('READY', 'PROCESSING', 'SUCCESS', 'FAIL')),
    PRINTED_FILE      BLOB                   NULL,
    PRINTED_FILE_NAME VARCHAR2(128)          NULL,
    CONTENT_TYPE      VARCHAR2(128)          NOT NULL,
    TRIGGERED_AT      TIMESTAMP              NOT NULL,
    TRIGGERED_BY      VARCHAR2(64)           NOT NULL,
    PRINT_STARTED_AT  TIMESTAMP              NULL,
    PRINT_FINISHED_AT TIMESTAMP              NULL,
    FAIL_CAUSED_BY    CLOB                   NULL,
    TENANT_CODE       VARCHAR2(64)           NULL
)
