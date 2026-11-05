
create table public.lions_cave_saves (
 user_id uuid primary key references auth.users(id),
 revision bigint not null check(revision>0),
 state jsonb not null check(jsonb_typeof(state)='object' and jsonb_typeof(state->'hero')='object' and octet_length(state::text)<=8000000),
 updated_at timestamptz not null default now()
);
create table public.lions_cave_save_versions (
 user_id uuid not null references auth.users(id),
 revision bigint not null,
 state jsonb not null,
 created_at timestamptz not null default now(),
 primary key(user_id,revision)
);
alter table public.lions_cave_saves enable row level security;
alter table public.lions_cave_save_versions enable row level security;
revoke all on public.lions_cave_saves,public.lions_cave_save_versions from anon;
grant select,insert,update on public.lions_cave_saves to authenticated;
grant select,insert on public.lions_cave_save_versions to authenticated;
create policy lions_save_read on public.lions_cave_saves for select to authenticated using ((select auth.uid())=user_id);
create policy lions_save_insert on public.lions_cave_saves for insert to authenticated with check ((select auth.uid())=user_id);
create policy lions_save_update on public.lions_cave_saves for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy lions_history_read on public.lions_cave_save_versions for select to authenticated using ((select auth.uid())=user_id);
create policy lions_history_insert on public.lions_cave_save_versions for insert to authenticated with check ((select auth.uid())=user_id);
create function public.lions_cave_save(p_state jsonb,p_expected_revision bigint,p_backup boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare owner_id uuid:=auth.uid(); current_save public.lions_cave_saves%rowtype;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='28000';end if;
 if jsonb_typeof(p_state) is distinct from 'object' or jsonb_typeof(p_state->'hero') is distinct from 'object' or octet_length(p_state::text)>8000000 then raise exception 'Invalid save' using errcode='22023';end if;
 select * into current_save from public.lions_cave_saves where user_id=owner_id for update;
 if found then
  if current_save.revision<>p_expected_revision then raise exception 'Save conflict' using errcode='PT409';end if;
  if p_backup then insert into public.lions_cave_save_versions(user_id,revision,state) values(owner_id,current_save.revision,current_save.state) on conflict do nothing;end if;
  update public.lions_cave_saves set state=p_state,revision=current_save.revision+1,updated_at=clock_timestamp() where user_id=owner_id returning * into current_save;
 else
  if p_expected_revision<>0 then raise exception 'Save conflict' using errcode='PT409';end if;
  insert into public.lions_cave_saves(user_id,revision,state) values(owner_id,1,p_state) on conflict do nothing returning * into current_save;
  if current_save.user_id is null then raise exception 'Save conflict' using errcode='PT409';end if;
 end if;
 return jsonb_build_object('revision',current_save.revision,'state',current_save.state,'updated_at',current_save.updated_at);
end;$$;
revoke all on function public.lions_cave_save(jsonb,bigint,boolean) from public,anon;
grant execute on function public.lions_cave_save(jsonb,bigint,boolean) to authenticated;
