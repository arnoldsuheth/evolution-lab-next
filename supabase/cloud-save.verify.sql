
begin;
select set_config('lions.test_a',gen_random_uuid()::text,true),set_config('lions.test_b',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role) values(current_setting('lions.test_a')::uuid,'authenticated','authenticated'),(current_setting('lions.test_b')::uuid,'authenticated','authenticated');
select set_config('request.jwt.claim.sub',current_setting('lions.test_a'),true);
set local role authenticated;
do $test$
declare r jsonb;
begin
 r:=public.lions_cave_save('{"hero":{"name":"TEST_A","gold":10}}',0);
 if (r->>'revision')::bigint<>1 then raise exception 'initial revision failed';end if;
 r:=public.lions_cave_save('{"hero":{"name":"TEST_A","gold":20}}',1,true);
 if (r->>'revision')::bigint<>2 then raise exception 'update revision failed';end if;
 if (select count(*) from public.lions_cave_save_versions)<>1 then raise exception 'backup failed';end if;
 if (select (state->'hero'->>'gold')::int from public.lions_cave_save_versions)<>10 then raise exception 'original backup failed';end if;
 begin perform public.lions_cave_save('{"hero":{"gold":999}}',1);raise exception 'stale save accepted';exception when sqlstate 'PT409' then null;end;
 begin perform public.lions_cave_save('{"invalid":true}',2);raise exception 'invalid save accepted';exception when sqlstate '22023' then null;end;
end;$test$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('lions.test_b'),true);
set local role authenticated;
do $test$
declare changed integer;
begin
 if (select count(*) from public.lions_cave_saves)<>0 then raise exception 'other account can read save';end if;
 if (select count(*) from public.lions_cave_save_versions)<>0 then raise exception 'other account can read backup';end if;
 update public.lions_cave_saves set state='{"hero":{"gold":9999}}' where user_id=current_setting('lions.test_a')::uuid;
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'other account can update save';end if;
 begin insert into public.lions_cave_saves(user_id,revision,state) values(current_setting('lions.test_a')::uuid,10,'{"hero":{}}');raise exception 'other account can insert save';exception when insufficient_privilege then null;end;
end;$test$;
reset role;
set local role anon;
do $test$
begin
 begin perform * from public.lions_cave_saves;raise exception 'anonymous can read saves';exception when insufficient_privilege then null;end;
 begin perform public.lions_cave_save('{"hero":{}}',0);raise exception 'anonymous can write saves';exception when insufficient_privilege then null;end;
end;$test$;
reset role;
rollback;
select 'PASS: revisions, conflict rejection, backup, invalid input, account isolation, anonymous denial. All test data rolled back.' as verification;
