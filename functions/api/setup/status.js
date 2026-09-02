import { db, json } from '../../_utils.js';

export async function onRequestGet({ env }) {
  const diag = {
    has_url: !!env.SUPABASE_URL,
    url_value: env.SUPABASE_URL || null,
    has_key: !!env.SUPABASE_SERVICE_KEY,
    key_prefix: (env.SUPABASE_SERVICE_KEY || '').slice(0, 12),
    key_length: (env.SUPABASE_SERVICE_KEY || '').length
  };

  try {
    const supabase = db(env);
    const { count, error } = await supabase.from('admins').select('*', { count: 'exact', head: true });
    if (error) {
      return json({ available: false, diag, error_full: JSON.stringify(error) });
    }
    return json({ available: count === 0, diag, count });
  } catch (e) {
    return json({ available: false, diag, caught: String(e && e.message || e) });
  }
}
