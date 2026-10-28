-- Evolution Lab Next only. No existing BLESSAINT database is touched.
create table public.next_records (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 collection text not null check (collection in ('prog','claude','tasks','projects','skills','reviews','prefs','sessions','external','books','guitar','songs','sites','prospects','subjects','legacy')),
 record_id text not null check (record_id ~ '^[-a-zA-Z0-9_:.]{1,120}$' and record_id not in ('__proto__','constructor','prototype')),
 value jsonb not null default 'null'::jsonb check (octet_length(value::text)<=1048576),
 revision integer not null default 1 check (revision>0),
 updated_at timestamptz not null default now(),
 primary key(user_id,collection,record_id)
);
alter table public.next_records enable row level security;
create policy next_owner_select on public.next_records for select to authenticated using ((select auth.uid())=user_id);
create policy next_owner_insert on public.next_records for insert to authenticated with check ((select auth.uid())=user_id);
create policy next_owner_update on public.next_records for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
revoke all on public.next_records from anon,authenticated;
grant select,insert,update on public.next_records to authenticated;
create function public.next_write(p_collection text,p_id text,p_value jsonb,p_expected integer)
returns table(revision integer,updated_at timestamptz) language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or p_expected<0 then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_expected=0 then
  return query insert into public.next_records as r(user_id,collection,record_id,value) values(auth.uid(),p_collection,p_id,coalesce(p_value,'null'::jsonb)) on conflict do nothing returning r.revision,r.updated_at;
 else
  return query update public.next_records as r set value=coalesce(p_value,'null'::jsonb),revision=r.revision+1,updated_at=now() where r.user_id=auth.uid() and r.collection=p_collection and r.record_id=p_id and r.revision=p_expected returning r.revision,r.updated_at;
 end if;
 if not found then raise exception 'Concurrent record change' using errcode='40001'; end if;
end $$;
revoke all on function public.next_write(text,text,jsonb,integer) from public,anon;
grant execute on function public.next_write(text,text,jsonb,integer) to authenticated;

create table public.next_tutor_usage (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 day date not null default current_date,
 requests integer not null default 1 check(requests between 1 and 10),
 primary key(user_id,day)
);
alter table public.next_tutor_usage enable row level security;
create policy tutor_owner_select on public.next_tutor_usage for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.next_tutor_usage from anon,authenticated;
grant select on public.next_tutor_usage to authenticated;
create schema next_private;
revoke all on schema next_private from public,anon;
grant usage on schema next_private to authenticated;
create table next_private.tutor_daily(day date primary key,requests integer not null check(requests between 1 and 20));
alter table next_private.tutor_daily enable row level security;
create function next_private.reserve_tutor() returns integer language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 insert into next_private.tutor_daily as d(day,requests) values(current_date,1)
 on conflict(day) do update set requests=d.requests+1 where d.requests<20 returning requests into n;
 if n is null then raise exception 'Project daily limit reached' using errcode='P0001';end if;
 insert into public.next_tutor_usage as u(user_id,day,requests) values(auth.uid(),current_date,1)
 on conflict(user_id,day) do update set requests=u.requests+1 where u.requests<10 returning requests into n;
 if n is null then raise exception 'Daily limit reached' using errcode='P0001';end if;
 return n;
end $$;
revoke all on function next_private.reserve_tutor() from public,anon;
grant execute on function next_private.reserve_tutor() to authenticated;
create function public.next_reserve_tutor() returns integer language sql security invoker set search_path='' as $$select next_private.reserve_tutor();$$;
revoke all on function public.next_reserve_tutor() from public,anon;
grant execute on function public.next_reserve_tutor() to authenticated;
