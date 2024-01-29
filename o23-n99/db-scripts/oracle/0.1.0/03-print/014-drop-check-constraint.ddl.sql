-- author: brad.wu
-- tags: system

CREATE OR REPLACE PROCEDURE DROP_CHECK_CONSTRAINT(p_table_name IN VARCHAR2, p_column_name IN VARCHAR2, p_keyword IN VARCHAR2) AS
    l_constraint_name VARCHAR2(100);
BEGIN
    SELECT ACC.CONSTRAINT_NAME
    INTO l_constraint_name
    FROM ALL_CONS_COLUMNS ACC, ALL_CONSTRAINTS AC
    WHERE AC.TABLE_NAME = p_table_name
      AND AC.CONSTRAINT_NAME = ACC.CONSTRAINT_NAME
      AND ACC.COLUMN_NAME = p_column_name
      AND AC.SEARCH_CONDITION_VC LIKE ('%' || p_keyword || '%');

    EXECUTE IMMEDIATE 'ALTER TABLE ' || p_table_name || ' DROP CONSTRAINT ' || l_constraint_name || ' ONLINE';
    DBMS_OUTPUT.PUT_LINE('Constraint ' || l_constraint_name || ' has been dropped from table ' || p_table_name);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Constraint not found for the specified table name and column name');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error dropping constraint: ' || SQLERRM);
END;
