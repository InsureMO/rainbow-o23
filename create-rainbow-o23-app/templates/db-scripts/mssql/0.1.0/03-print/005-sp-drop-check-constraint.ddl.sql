-- author: brad.wu
-- tags: system

CREATE OR ALTER PROC SP_DROP_CHECK_CONSTRAINT(
    @table_name SYSNAME,
    @column_name SYSNAME
)
AS
DECLARE @check_constraint_name SYSNAME, @sql NVARCHAR(MAX)
SELECT @check_constraint_name = NAME FROM SYS.CHECK_CONSTRAINTS WHERE PARENT_OBJECT_ID = OBJECT_ID(@table_name) -- Table name
  AND TYPE = 'C'                                -- Check Constraint
  AND PARENT_COLUMN_ID = (SELECT COLUMN_ID
                          FROM SYS.COLUMNS
                          WHERE OBJECT_ID = OBJECT_ID(@table_name) AND NAME = @column_name) -- Column name
    IF @check_constraint_name IS NOT NULL
        BEGIN
            SET @sql = N'ALTER TABLE ' + @table_name + ' DROP CONSTRAINT ' + @check_constraint_name
            -- print @sql
            EXEC sp_executesql @sql
        END
