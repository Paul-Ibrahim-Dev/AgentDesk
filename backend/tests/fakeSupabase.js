/**
 * A minimal fake of the Supabase JS query builder, enough to exercise our
 * route/service/tool logic without a real database. Supports the small
 * subset of chained calls this codebase actually uses:
 *   .from(table).select(...).eq(...).eq(...).single()/.maybeSingle()/.limit()
 *   .insert(obj).select().single()
 *   .update(obj).eq(...).select().single()
 *   .delete().eq(...)
 *
 * Each table is a plain in-memory array of row objects that tests seed
 * directly via `db.__seed(table, rows)`.
 */
export function createFakeSupabase() {
  const tables = {};

  function seed(table, rows) {
    tables[table] = rows.map((r) => ({ ...r }));
  }

  function from(table) {
    if (!tables[table]) tables[table] = [];
    let rows = tables[table];
    let filtered = [...rows];
    let pendingInsert = null;
    let pendingUpdate = null;
    let pendingDelete = false;
    let selected = null;

    const builder = {
      select(_cols, opts) {
        selected = _cols;
        if (opts && opts.count === 'exact' && opts.head) {
          builder.__wantCount = true;
        }
        return builder;
      },
      eq(col, val) {
        filtered = filtered.filter((r) => r[col] === val);
        return builder;
      },
      ilike(col, pattern) {
        const needle = String(pattern).replace(/%/g, '').toLowerCase();
        filtered = filtered.filter((r) => String(r[col] || '').toLowerCase().includes(needle));
        return builder;
      },
      gte(col, val) {
        filtered = filtered.filter((r) => r[col] >= val);
        return builder;
      },
      order() {
        return builder;
      },
      limit(n) {
        filtered = filtered.slice(0, n);
        return builder;
      },
      insert(obj) {
        pendingInsert = Array.isArray(obj) ? obj : [obj];
        return builder;
      },
      update(obj) {
        pendingUpdate = obj;
        return builder;
      },
      delete() {
        pendingDelete = true;
        return builder;
      },
      single() {
        return builder.__resolve(true);
      },
      maybeSingle() {
        return builder.__resolve(true);
      },
      then(resolve, reject) {
        // Allows `await builder` without an explicit terminal call
        // (used for plain select().eq() chains and count queries).
        return builder.__resolve(false).then(resolve, reject);
      },
      async __resolve(requireOne) {
        if (pendingInsert) {
          const inserted = pendingInsert.map((obj) => ({
            id: obj.id || `id-${Math.random().toString(36).slice(2, 10)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...obj,
          }));
          rows.push(...inserted);
          const result = inserted.length === 1 ? inserted[0] : inserted;
          return { data: result, error: null };
        }
        if (pendingUpdate) {
          filtered.forEach((row) => Object.assign(row, pendingUpdate, { updated_at: new Date().toISOString() }));
          const result = requireOne ? filtered[0] || null : filtered;
          return { data: result, error: null };
        }
        if (pendingDelete) {
          const idsToDelete = new Set(filtered.map((r) => r.id));
          tables[table] = rows.filter((r) => !idsToDelete.has(r.id));
          return { data: null, error: null };
        }
        if (builder.__wantCount) {
          return { data: null, error: null, count: filtered.length };
        }
        if (requireOne) {
          return { data: filtered[0] || null, error: filtered[0] ? null : null };
        }
        return { data: filtered, error: null };
      },
    };
    return builder;
  }

  return { from, __seed: seed, __tables: tables };
}
