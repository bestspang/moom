-- Squad Feed Reactions: table + RPC functions
-- Supports reaction (like/emoji) on squad activity feed entries

-- 1. Create table
create table if not exists public.squad_feed_reactions (
  id uuid primary key default gen_random_uuid(),
  audit_log_id uuid not null references public.gamification_audit_log(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (audit_log_id, member_id)
);

-- 2. Enable RLS
alter table public.squad_feed_reactions enable row level security;

-- 3. RLS policies
create policy "Members can view all reactions"
  on public.squad_feed_reactions for select
  using (true);

create policy "Members can insert own reactions"
  on public.squad_feed_reactions for insert
  with check (member_id = auth.uid());

create policy "Members can delete own reactions"
  on public.squad_feed_reactions for delete
  using (member_id = auth.uid());

-- 4. RPC: get_squad_feed_reactions
create or replace function public.get_squad_feed_reactions(p_audit_log_ids text[])
returns table (
  audit_log_id uuid,
  reaction_count bigint,
  reacted_by_me boolean
)
language sql stable security definer
as $$
  select
    r.audit_log_id,
    count(*)::bigint as reaction_count,
    bool_or(r.member_id = auth.uid()) as reacted_by_me
  from public.squad_feed_reactions r
  where r.audit_log_id = any(p_audit_log_ids::uuid[])
  group by r.audit_log_id;
$$;

-- 5. RPC: toggle_squad_feed_reaction
create or replace function public.toggle_squad_feed_reaction(p_audit_log_id text)
returns json
language plpgsql security definer
as $$
declare
  v_member_id uuid := auth.uid();
  v_exists boolean;
  v_new_count bigint;
  v_reacted boolean;
begin
  select exists(
    select 1 from public.squad_feed_reactions
    where audit_log_id = p_audit_log_id::uuid and member_id = v_member_id
  ) into v_exists;

  if v_exists then
    delete from public.squad_feed_reactions
    where audit_log_id = p_audit_log_id::uuid and member_id = v_member_id;
    v_reacted := false;
  else
    insert into public.squad_feed_reactions (audit_log_id, member_id)
    values (p_audit_log_id::uuid, v_member_id);
    v_reacted := true;
  end if;

  select count(*) into v_new_count
  from public.squad_feed_reactions
  where audit_log_id = p_audit_log_id::uuid;

  return json_build_object('new_count', v_new_count, 'reacted', v_reacted);
end;
$$;

-- 6. Add to realtime publication
alter publication supabase_realtime add table public.squad_feed_reactions;
