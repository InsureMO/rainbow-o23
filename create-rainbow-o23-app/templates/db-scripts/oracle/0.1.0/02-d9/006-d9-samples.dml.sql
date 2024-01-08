-- author: brad.wu
-- tags: system, d9-sample

INSERT ALL
    INTO T_O23_D9_CONFIG (CONFIG_ID, CONFIG_CODE, CONFIG_NAME, CONFIG_TYPE, LANGUAGE, ENABLED, CONFIG, DATA_PIPELINE,
                          TENANT_CODE, VERSION, CREATED_AT, CREATED_BY, LAST_MODIFIED_AT, LAST_MODIFIED_BY)
VALUES (1, 'O23-D9-001', 'Sample Tabs', 'TABS', 'en', 1,
        '{"dependencies": {"tabs": ["O23-d9-002"], "dialogs": ["O23-d9-003"]}}',
        '{"content": "code: PrepareSampleTabsData\nname: Prepare Sample Tabs Data\ntype: pipeline\n\nsteps:\n  - name: Prepare Data\n    use: snippet\n    snippet: |-\n      return {\n        type: $factor.type,\n        information: [\n          {name: ''John'', age: 25, birthday: ''1998-03-27'', addresses: [''address line 1'', ''address line 2'']},\n          {name: ''Jane'', age: 27, birthday: ''1996-08-12'', addresses: [''address line 3'']},\n          {name: ''Mike'', age: 21, birthday: ''2002-11-20''}\n        ],\n        policy: [\n          {id: 1000001, productName: ''PRDT-001'', productInfo: ''PRDT-001-INFO''},\n          {id: 1000002, productName: ''PRDT-002'', productInfo: ''PRDT-002-INFO''}\n        ]\n      }"}',
        NULL, 1, TO_TIMESTAMP('2023-12-11 14:52:46', 'YYYY-MM-DD HH24:MI:SS'), 'O23',
        TO_TIMESTAMP('2023-12-11 14:52:53', 'YYYY-MM-DD HH24:MI:SS'), 'O23')
INTO T_O23_D9_CONFIG (CONFIG_ID, CONFIG_CODE, CONFIG_NAME, CONFIG_TYPE, LANGUAGE, ENABLED, CONFIG, DATA_PIPELINE,
                      TENANT_CODE, VERSION, CREATED_AT, CREATED_BY, LAST_MODIFIED_AT, LAST_MODIFIED_BY)
VALUES (2, 'O23-D9-001', 'Sample Tabs', 'TABS', 'en_US', 1,
        '{"dependencies": {"tabs": ["O23-d9-002"], "dialogs": ["O23-d9-003"]}}',
        '{"content": "code: PrepareSampleTabsData\nname: Prepare Sample Tabs Data\ntype: pipeline\n\nsteps:\n  - name: Prepare Data\n    use: snippet\n    snippet: |-\n      return {\n        type: $factor.type,\n        information: [\n          {name: ''John'', age: 25, birthday: ''1998-03-27'', addresses: [''address line 1'', ''address line 2'']},\n          {name: ''Jane'', age: 27, birthday: ''1996-08-12'', addresses: [''address line 3'']},\n          {name: ''Mike'', age: 21, birthday: ''2002-11-20''}\n        ],\n        policy: [\n          {id: 1000001, productName: ''PRDT-001'', productInfo: ''PRDT-001-INFO''},\n          {id: 1000002, productName: ''PRDT-002'', productInfo: ''PRDT-002-INFO''}\n        ]\n      }"}',
        NULL, 1, TO_TIMESTAMP('2023-12-11 14:52:46', 'YYYY-MM-DD HH24:MI:SS'), 'O23',
        TO_TIMESTAMP('2023-12-11 14:52:53', 'YYYY-MM-DD HH24:MI:SS'), 'O23')
INTO T_O23_D9_CONFIG (CONFIG_ID, CONFIG_CODE, CONFIG_NAME, CONFIG_TYPE, LANGUAGE, ENABLED, CONFIG, DATA_PIPELINE,
                      TENANT_CODE, VERSION, CREATED_AT, CREATED_BY, LAST_MODIFIED_AT, LAST_MODIFIED_BY)
VALUES (3, 'O23-d9-002', 'Sample Tab 01', 'TAB', 'en', 1,
        '{"md": "# Page::This is Tab 01", "api": "/d9/data", "key": "policy", "body": "return {id: $def.configId, data: {policyId: $model.policyId}}", "title": "Policy", "method": "post"}',
        NULL, NULL, 1, TO_TIMESTAMP('2023-12-11 14:52:46', 'YYYY-MM-DD HH24:MI:SS'), 'O23',
        TO_TIMESTAMP('2023-12-11 14:52:53', 'YYYY-MM-DD HH24:MI:SS'), 'O23')
INTO T_O23_D9_CONFIG (CONFIG_ID, CONFIG_CODE, CONFIG_NAME, CONFIG_TYPE, LANGUAGE, ENABLED, CONFIG, DATA_PIPELINE,
                      TENANT_CODE, VERSION, CREATED_AT, CREATED_BY, LAST_MODIFIED_AT, LAST_MODIFIED_BY)
VALUES (4, 'O23-d9-003', 'Sample Tab Content 01', 'TAB', 'en', 1, '{"md": "# Page::This is Tab Content 01"}', NULL,
        NULL, 1, TO_TIMESTAMP('2023-12-11 14:52:46', 'YYYY-MM-DD HH24:MI:SS'), 'O23',
        TO_TIMESTAMP('2023-12-11 14:52:53', 'YYYY-MM-DD HH24:MI:SS'), 'O23')
SELECT 1
FROM DUAL
