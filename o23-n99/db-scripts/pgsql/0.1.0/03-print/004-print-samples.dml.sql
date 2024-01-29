-- author: brad.wu
-- tags: system, print-sample

INSERT INTO T_O23_PRINT_TEMPLATES (TEMPLATE_ID, TEMPLATE_CODE, TEMPLATE_NAME, TEMPLATE_TYPE, ENABLED, DATA_PIPELINE,
                                   TEMPLATE_FILE_NAME, TEMPLATE_FILE, TENANT_CODE, VERSION, CREATED_AT, CREATED_BY,
                                   LAST_MODIFIED_AT, LAST_MODIFIED_BY)
VALUES (5, 'O23-PT-005', 'Sample Pdf', 'PDF', 1, NULL, 'sample-pdf.html', e'<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script>
        window.postDataPrepare = () => {
            console.log(\'Hello, this log is printed when data prepared and everything is replaced.\');
        }
    </script>
</head>
<body>
    <data-print-template data-code="O23-PT-006"></data-print-template>
    <div>
        <h1 style="color: red" data-print="field" data-print-field="type">Name</h1>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Birthday</th>
                </tr>
            </thead>
            <tbody>
                <tr data-print="loop" data-print-field="information">
                    <td data-print="field" style="color: red" data-print-field="name">Name</td>
                    <td data-print="field" data-print-field="age">Age</td>
                    <td data-print="field" data-print-field="birthday">Birthday</td>
                    <td>
                        <span data-print="loop" data-print-field="addresses">
                            <span data-print="field" data-print-field="" style="display: block">Address</span>
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
        <table>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Product Name</th>
                    <th>Product Info</th>
                </tr>
            </thead>
            <tbody>
                <tr data-print="loop" data-print-field="policy">
                    <td data-print="field" style="color: red" data-print-field="id">id</td>
                    <td data-print="field" data-print-field="productName">productName</td>
                    <td data-print="field" data-print-field="productInfo">productInfo</td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>', NULL, 1, '2024-01-22 19:36:40.000000', 'O23', '2024-01-22 19:36:44.000000', 'O23');
INSERT INTO T_O23_PRINT_TEMPLATES (TEMPLATE_ID, TEMPLATE_CODE, TEMPLATE_NAME, TEMPLATE_TYPE, ENABLED, DATA_PIPELINE,
                                   TEMPLATE_FILE_NAME, TEMPLATE_FILE, TENANT_CODE, VERSION, CREATED_AT, CREATED_BY,
                                   LAST_MODIFIED_AT, LAST_MODIFIED_BY)
VALUES (6, 'O23-PT-006', 'Sample Pdf Sub Template', 'PDF', 1, NULL, 'sample-pdf-sub-template.html', e'<div>Hello, I was replaced by O23-PT-006</div>
<data-print-template data-code="O23-PT-007"></data-print-template>', NULL, 1, '2024-01-22 19:39:34.000000', 'O23',
        '2024-01-22 19:39:37.000000', 'O23');
INSERT INTO T_O23_PRINT_TEMPLATES (TEMPLATE_ID, TEMPLATE_CODE, TEMPLATE_NAME, TEMPLATE_TYPE, ENABLED, DATA_PIPELINE,
                                   TEMPLATE_FILE_NAME, TEMPLATE_FILE, TENANT_CODE, VERSION, CREATED_AT, CREATED_BY,
                                   LAST_MODIFIED_AT, LAST_MODIFIED_BY)
VALUES (7, 'O23-PT-007', 'Sample Pdf Sub Template', 'PDF', 1, NULL, 'sample-pdf-sub-template.html', e'<div>Hello, I was replaced by O23-PT-007</div>
', NULL, 1, '2024-01-22 20:07:07.000000', 'O23', '2024-01-22 20:07:10.000000', 'O23');
