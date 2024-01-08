-- author: brad.wu
-- tags: system

CREATE TYPE PRINT_TASK_STATUS AS ENUM ('READY', 'PROCESSING', 'SUCCESS', 'FAIL');
CREATE TABLE T_O23_PRINT_TASKS
(
    TASK_ID           DECIMAL(20) PRIMARY KEY NOT NULL,
    TASK_KEY          VARCHAR(64)             NOT NULL,
    TEMPLATE_ID       DECIMAL(20)             NOT NULL,
    STATUS            PRINT_TASK_STATUS       NOT NULL,
    PRINTED_FILE      BYTEA                   NULL,
    PRINTED_FILE_NAME VARCHAR(128)            NULL,
    CONTENT_TYPE      VARCHAR(128)            NOT NULL,
    TRIGGERED_AT      TIMESTAMP               NOT NULL,
    TRIGGERED_BY      VARCHAR(64)             NOT NULL,
    PRINT_STARTED_AT  TIMESTAMP               NULL,
    PRINT_FINISHED_AT TIMESTAMP               NULL,
    FAIL_CAUSED_BY    TEXT                    NULL,
    TENANT_CODE       VARCHAR(64)             NULL
);
CREATE UNIQUE INDEX I_O23_PRINT_TASKS_1 ON T_O23_PRINT_TASKS (TASK_KEY, TENANT_CODE);
CREATE INDEX I_O23_PRINT_TASKS_2 ON T_O23_PRINT_TASKS (TEMPLATE_ID);
CREATE INDEX I_O23_PRINT_TASKS_3 ON T_O23_PRINT_TASKS (STATUS);
CREATE INDEX I_O23_PRINT_TASKS_4 ON T_O23_PRINT_TASKS (TRIGGERED_AT);
CREATE INDEX I_O23_PRINT_TASKS_5 ON T_O23_PRINT_TASKS (TRIGGERED_BY);
CREATE INDEX I_O23_PRINT_TASKS_6 ON T_O23_PRINT_TASKS (TENANT_CODE);
