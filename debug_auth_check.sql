select
  n.nspname as schema,
  c.relname as table,
  pg_catalog.pg_get_userbyid(c.relowner) as owner,
  c.relrowsecurity as rls_enabled
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n
  on n.oid = c.relnamespace
where n.nspname = 'auth'
  and c.relkind = 'r';
