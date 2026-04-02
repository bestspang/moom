-- Atomic package assignment: wraps transaction + member_packages + member_billing in one call
create or replace function public.assign_package_to_member(
  p_member_id uuid,
  p_package_id uuid,
  p_staff_id uuid default null,
  p_location_id uuid default null,
  p_notes text default null
)
returns json
language plpgsql security definer
as $$
declare
  v_package record;
  v_txn_number text;
  v_vat_rate numeric := 0.07;
  v_net numeric;
  v_vat numeric;
  v_txn record;
  v_mp record;
begin
  -- 1. Get package details
  select * into v_package from public.packages where id = p_package_id;
  if v_package is null then
    raise exception 'Package not found';
  end if;

  -- 2. Get next transaction number
  select 'TXN-' || lpad(nextval('transaction_number_seq')::text, 6, '0') into v_txn_number;

  -- 3. Calculate VAT
  v_net := round(v_package.price / (1 + v_vat_rate), 2);
  v_vat := v_package.price - v_net;

  -- 4. Insert transaction
  insert into public.transactions (
    transaction_number, member_id, amount, vat_amount, net_amount,
    type, status, payment_method, location_id, notes, staff_id
  ) values (
    v_txn_number, p_member_id, v_package.price, v_vat, v_net,
    'new_member', 'paid', 'cash', p_location_id, p_notes, p_staff_id
  ) returning * into v_txn;

  -- 5. Insert member_packages
  insert into public.member_packages (
    member_id, package_id, transaction_id,
    start_date, end_date, sessions_total, sessions_used, status
  ) values (
    p_member_id, p_package_id, v_txn.id,
    now()::date,
    now()::date + (v_package.duration_days || ' days')::interval,
    coalesce(v_package.session_count, 0), 0, 'active'
  ) returning * into v_mp;

  -- 6. Insert member_billing
  insert into public.member_billing (
    member_id, transaction_id, amount, billing_type, status
  ) values (
    p_member_id, v_txn.id, v_package.price, 'package_purchase', 'paid'
  );

  return json_build_object(
    'transaction_id', v_txn.id,
    'member_package_id', v_mp.id,
    'transaction_number', v_txn_number
  );
end;
$$;
