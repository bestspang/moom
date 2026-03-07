DO $$
DECLARE
  max_num integer;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN transaction_id ~ '^T-[0-9]+$' 
    THEN CAST(SUBSTRING(transaction_id FROM 3) AS integer) 
    ELSE 0 END
  ), 0) INTO max_num FROM public.transactions;
  
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.transaction_number_seq START %s', max_num + 1);
END $$;

CREATE OR REPLACE FUNCTION public.next_transaction_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 'T-' || lpad(nextval('public.transaction_number_seq')::text, 7, '0');
$$;