-- author: brad.wu
-- tags: system

CREATE TABLE T_O23_PRINT_TASKS
(
    TASK_ID           BIGINT PRIMARY KEY                              NOT NULL,
    TASK_KEY          VARCHAR(64)                                     NOT NULL,
    TEMPLATE_ID       BIGINT                                          NOT NULL,
    STATUS            ENUM ('READY', 'PROCESSING', 'SUCCESS', 'FAIL') NOT NULL,
    PRINTED_FILE      MEDIUMBLOB                                      NULL,
    PRINTED_FILE_NAME VARCHAR(128)                                    NULL,
    CONTENT_TYPE      VARCHAR(128)                                    NOT NULL,
    TRIGGERED_AT      DATETIME                                        NOT NULL,
    TRIGGERED_BY      VARCHAR(64)                                     NOT NULL,
    PRINT_STARTED_AT  DATETIME                                        NULL,
    PRINT_FINISHED_AT DATETIME                                        NULL,
    FAIL_CAUSED_BY    MEDIUMTEXT                                      NULL,
    TENANT_CODE       VARCHAR(64)                                     NULL,
    UNIQUE INDEX (TASK_KEY, TENANT_CODE),
    INDEX (TEMPLATE_ID),
    INDEX (STATUS),
    INDEX (TRIGGERED_AT),
    INDEX (TRIGGERED_BY),
    INDEX (TENANT_CODE)
);
