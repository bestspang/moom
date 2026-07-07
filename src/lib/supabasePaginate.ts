// Supabase caps a single .select() at 1000 rows by default. Aggregations that read
// every matching row (revenue-by-month, fill-rate, churn windows) silently under-count
// once a gym crosses that many rows. fetchAllRows pages past the cap with .range().

type QueryResult<T> = { data: T[] | null; error: unknown };

/**
 * Fetch every row of a query, paging past Supabase's default 1000-row cap.
 *
 * `build` MUST return a fresh query for each page — it is invoked once per page with the
 * `.range()` bounds to apply. Give the underlying query a stable `.order()` so page
 * boundaries don't skip or duplicate rows.
 *
 * @example
 *   const rows = await fetchAllRows<{ amount: number }>((from, to) =>
 *     supabase.from('transactions').select('amount').eq('status', 'paid')
 *       .order('created_at').range(from, to));
 */
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<QueryResult<T>>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  // Hard page ceiling as a backstop against an unbounded loop.
  for (let page = 0; page < 500; page++) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return all;
}
