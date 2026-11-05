-- Device secrets and pairing codes are hashed by the Edge Function.
-- Only the server service role can call this API or access these tables.
create table if not exists public.lions_cave_vaults(
 id uuid primary key default gen_random_uuid(),legacy_owner uuid unique references auth.users(id),
 revision bigint not null default 0,state jsonb,updated_at timestamptz not null default now(),
 check(state is null or (jsonb_typeof(state->'hero')='object' and octet_length(state::text)<=8000000))
);
create table if not exists public.lions_cave_devices(
 secret_hash text primary key check(length(secret_hash)=64),vault_id uuid not null references public.lions_cave_vaults(id),created_at timestamptz not null default now()
);
create index if not exists lions_cave_devices_vault on public.lions_cave_devices(vault_id);
create table if not exists public.lions_cave_pair_codes(
 code_hash text primary key,vault_id uuid not null references public.lions_cave_vaults(id),expires_at timestamptz not null
);
create index if not exists lions_cave_pair_vault on public.lions_cave_pair_codes(vault_id);
create table if not exists public.lions_cave_vault_versions(
 vault_id uuid not null references public.lions_cave_vaults(id),revision bigint not null,state jsonb not null,created_at timestamptz not null default now(),primary key(vault_id,revision)
);
create table if not exists public.lions_cave_device_limits(
 bucket text primary key,hits integer not null default 1,expires_at timestamptz not null
);
alter table public.lions_cave_vaults enable row level security;
alter table public.lions_cave_devices enable row level security;
alter table public.lions_cave_pair_codes enable row level security;
alter table public.lions_cave_vault_versions enable row level security;
alter table public.lions_cave_device_limits enable row level security;
revoke all on public.lions_cave_vaults,public.lions_cave_devices,public.lions_cave_pair_codes,public.lions_cave_vault_versions,public.lions_cave_device_limits from public,anon,authenticated;
grant select,insert,update,delete on public.lions_cave_vaults,public.lions_cave_devices,public.lions_cave_pair_codes,public.lions_cave_vault_versions,public.lions_cave_device_limits to service_role;

create or replace function public.lions_cave_device_api(p_action text,p_device text,p_ip text,p_code text default null,p_legacy uuid default null,p_state jsonb default null,p_revision bigint default 0,p_backup boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.lions_cave_vaults%rowtype;target uuid;counter integer;bucket_key text;
begin
 if length(p_device)<>64 or length(p_ip)<>64 then raise exception 'Invalid device';end if;
 select vault.* into v from public.lions_cave_devices d join public.lions_cave_vaults vault on vault.id=d.vault_id where d.secret_hash=p_device;
 if p_action='open' and v.id is null then
  bucket_key:='create:'||p_ip||':'||to_char(now(),'YYYYMMDDHH24');
  insert into public.lions_cave_device_limits(bucket,expires_at) values(bucket_key,now()+interval '2 hours') on conflict(bucket) do update set hits=public.lions_cave_device_limits.hits+1 returning hits into counter;
  if counter>30 then return jsonb_build_object('error','Aguarde antes de vincular outro aparelho.');end if;
  if p_legacy is not null then select * into v from public.lions_cave_vaults where legacy_owner=p_legacy;end if;
  if v.id is null then
   insert into public.lions_cave_vaults(legacy_owner) values(p_legacy) on conflict(legacy_owner) do update set legacy_owner=excluded.legacy_owner returning * into v;
   if p_legacy is not null then
    update public.lions_cave_vaults set state=s.state,revision=s.revision,updated_at=s.updated_at from public.lions_cave_saves s where id=v.id and s.user_id=p_legacy returning public.lions_cave_vaults.* into v;
    if not found then select vault.* into v from public.lions_cave_vaults vault where legacy_owner=p_legacy;end if;
   end if;
  end if;
  insert into public.lions_cave_devices(secret_hash,vault_id) values(p_device,v.id) on conflict do nothing;
  select vault.* into v from public.lions_cave_devices d join public.lions_cave_vaults vault on vault.id=d.vault_id where d.secret_hash=p_device;
 end if;
 if v.id is null then raise exception 'Device not linked' using errcode='28000';end if;
 if p_action='pair' then
  if length(p_code)<>64 then raise exception 'Invalid code';end if;
  delete from public.lions_cave_pair_codes where vault_id=v.id or expires_at<now();
  insert into public.lions_cave_pair_codes values(p_code,v.id,now()+interval '10 minutes');
 elsif p_action='redeem' then
  bucket_key:='redeem:'||p_ip||':'||to_char(now(),'YYYYMMDDHH24');
  insert into public.lions_cave_device_limits(bucket,expires_at) values(bucket_key,now()+interval '2 hours') on conflict(bucket) do update set hits=public.lions_cave_device_limits.hits+1 returning hits into counter;
  if counter>20 then return jsonb_build_object('error','Muitas tentativas. Aguarde para tentar novamente.');end if;
  delete from public.lions_cave_pair_codes where code_hash=p_code and expires_at>now() returning vault_id into target;
  if target is null then return jsonb_build_object('error','Código inválido, já usado ou expirado. Gere outro no aparelho de origem.');end if;
  update public.lions_cave_devices set vault_id=target where secret_hash=p_device;
  select * into v from public.lions_cave_vaults where id=target;
 elsif p_action='write' then
  if p_state is null or jsonb_typeof(p_state->'hero') is distinct from 'object' or octet_length(p_state::text)>8000000 then raise exception 'Invalid save';end if;
  select * into v from public.lions_cave_vaults where id=v.id for update;
  if v.revision<>p_revision then raise exception 'Save conflict' using errcode='PT409';end if;
  if p_backup and v.state is not null then insert into public.lions_cave_vault_versions values(v.id,v.revision,v.state,now()) on conflict do nothing;end if;
  update public.lions_cave_vaults set state=p_state,revision=revision+1,updated_at=clock_timestamp() where id=v.id returning * into v;
 elsif p_action not in ('open','read') then raise exception 'Invalid action';
 end if;
 delete from public.lions_cave_device_limits where expires_at<now();
 return jsonb_build_object('vault',v.id,'revision',v.revision,'state',v.state,'updated_at',v.updated_at);
end;$$;
revoke all on function public.lions_cave_device_api(text,text,text,text,uuid,jsonb,bigint,boolean) from public,anon,authenticated;
grant execute on function public.lions_cave_device_api(text,text,text,text,uuid,jsonb,bigint,boolean) to service_role;
