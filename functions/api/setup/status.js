import { db, json } from '../../_utils.js';

export async function onRequestGet({ env }) {
  const supabase = db(env);
  const { count } = await supabase.from('admins').select('*', { count: 'exact', head: true });
  return json({ available: count === 0 });
}
