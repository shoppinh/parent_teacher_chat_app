
-- Get All Index
SELECT
    format('DROP INDEX %I.%I;', n.nspname, c_ind.relname)
  FROM pg_index ind
  JOIN pg_class c_ind ON c_ind.oid = ind.indexrelid
  JOIN pg_namespace n ON n.oid = c_ind.relnamespace
  LEFT JOIN pg_constraint cons ON cons.conindid = ind.indexrelid
  WHERE
    n.nspname NOT IN ('pg_catalog','information_schema') AND
    n.nspname !~ '^pg_toast'::TEXT AND
    cons.oid IS NULL
---------

SELECT relname, relkind FROM pg_class WHERE relkind = 'i';

-- Create index with case-insensitive
CREATE INDEX "gift_promotions_name_idx" ON "gift_promotions" (LOWER("name"));
