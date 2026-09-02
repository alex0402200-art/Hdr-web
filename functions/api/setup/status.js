import { db, json } from '../../_utils.js';

export async function onRequestGet({ env }) {
  const supabase = db(env);
  const { count, error } = await supabase.from('admins').select('*', { count: 'exact', head: true });
  if (error) {
    return json({ available: false, debug_error: error.message, debug_code: error.code }, 200);
  }
  return json({ available: count === 0, debug_count: count });
}
