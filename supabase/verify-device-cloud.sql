-- Transactional fixtures only: does not modify real journeys.
begin;
set local role service_role;
do $$
declare a jsonb;b jsonb;r jsonb;dev_a text:=repeat('a',64);dev_b text:=repeat('b',64);ip text:=repeat('f',64);code text:=repeat('c',64);
begin
 a:=public.lions_cave_device_api('open',dev_a,ip);
 b:=public.lions_cave_device_api('open',dev_b,ip);
 if a->>'vault'=b->>'vault' then raise exception 'Isolation failed';end if;
 r:=public.lions_cave_device_api('write',dev_a,ip,p_state:='{"hero":{"name":"Fixture"}}',p_revision:=0);
 if (r->>'revision')::int<>1 then raise exception 'Write failed';end if;
 r:=public.lions_cave_device_api('read',dev_b,ip);
 if r->'state'<>'null'::jsonb then raise exception 'Cross-device leak';end if;
 perform public.lions_cave_device_api('pair',dev_a,ip,code);
 r:=public.lions_cave_device_api('redeem',dev_b,ip,code);
 if r->>'vault'<>a->>'vault' or r->'state'->'hero'->>'name'<>'Fixture' then raise exception 'Pair failed';end if;
 r:=public.lions_cave_device_api('redeem',dev_b,ip,code);
 if r->>'error' is null then raise exception 'Code reuse allowed';end if;
 begin
  perform public.lions_cave_device_api('write',dev_b,ip,p_state:='{"hero":{}}',p_revision:=0);
  raise exception 'Stale save allowed';
 exception when sqlstate 'PT409' then null;end;
 r:=public.lions_cave_device_api('write',dev_b,ip,p_state:='{"hero":{"name":"Fixture updated"}}',p_revision:=1,p_backup:=true);
 if (select count(*) from public.lions_cave_vault_versions where vault_id=(a->>'vault')::uuid)<>1 then raise exception 'Backup missing';end if;
 perform public.lions_cave_device_api('pair',dev_a,ip,code);
 update public.lions_cave_pair_codes set expires_at=now()-interval '1 second' where code_hash=code;
 r:=public.lions_cave_device_api('redeem',dev_b,ip,code);
 if r->>'error' is null then raise exception 'Expired code accepted';end if;
 if has_function_privilege('anon','public.lions_cave_device_api(text,text,text,text,uuid,jsonb,bigint,boolean)','execute') or has_function_privilege('authenticated','public.lions_cave_device_api(text,text,text,text,uuid,jsonb,bigint,boolean)','execute') then raise exception 'Public RPC access';end if;
end;$$;
rollback;
