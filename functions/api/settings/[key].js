import { db, json, getLoggedInUser } from '../../_utils.js';

export async function onRequestGet({ params, env }) {
  const supabase = db(env);
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .eq('key', params.key)
    .single();

  // SEMENTARA: tampilkan detail error asli buat debug
  if (error || !data) {
    return json({
      error: 'Setting tidak ditemukan',
      debug_error: error,
      debug_params: params,
      debug_hasUrl: !!env.SUPABASE_URL,
      debug_hasKey: !!env.SUPABASE_SERVICE_KEY
    }, 404);
  }

  return json(data.value);
}

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
