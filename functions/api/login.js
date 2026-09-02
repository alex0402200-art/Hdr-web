import { db, json, verifyPassword } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const supabase = db(env);

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('username', body.username)
    .single();

  if (!admin || !(await verifyPassword(body.password, admin.password_hash, admin.password_salt))) {
    return json({ error: 'Username atau password salah' }, 401);
  }

  const expires = new Date(Date.now() + 604800000); // 7 hari
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({ username: admin.username, expires_at: expires.toISOString() })
    .select('token')
    .single();

  if (error) return json({ error: error.message }, 500);

  return json(
    { ok: true },
    200,
    { 'Set-Cookie': `session=${session.token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800` }
  );
}
