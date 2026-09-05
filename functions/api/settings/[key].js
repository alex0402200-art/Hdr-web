import { db, json, getLoggedInUser } from '../../_utils.js';

// Publik: siapa aja bisa baca settings (misal buat nampilin banner di halaman utama)
export async function onRequestGet({ params, env }) {
  const supabase = db(env);
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .eq('key', params.key)
    .single();

  if (error || !data) return json({ error: 'Setting tidak ditemukan' }, 404);
  return json(data.value);
}

// Admin: update settings (misal ganti teks/link/gambar banner)
export async function onRequestPut({ params, request, env }) {
  const username = await getLoggedInUser(request, env);
  if (!username) return json({ error: 'Harus login' }, 401);

  const body = await request.json();
  const { error } = await db(env)
    .from('settings')
    .update({ value: body, updated_at: new Date().toISOString() })
    .eq('key', params.key);

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
    }
