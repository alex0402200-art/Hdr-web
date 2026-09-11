import { db, json, verifyPassword } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const supabase = db(env);

    const { data: admin, error: adminErr } = await supabase
      .from('admins')
      .select('*')
      .eq('username', body.username)
      .single();

    if (adminErr) {
      // DEBUG SEMENTARA: tampilkan error asli dari query admin
      return json({ error: 'DEBUG admin query: ' + adminErr.message, code: adminErr.code }, 500);
    }

    if (!admin || !(await verifyPassword(body.password, admin.password_hash, admin.password_salt))) {
      return json({ error: 'Username atau password salah' }, 401);
    }

    const expires = new Date(Date.now() + 604800000); // 7 hari
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ username: admin.username, expires_at: expires.toISOString() })
      .select('token')
      .single();

    if (error) return json({ error: 'DEBUG session insert: ' + error.message, code: error.code }, 500);

    return json(
      { ok: true },
      200,
      { 'Set-Cookie': `session=${session.token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800` }
    );
  } catch (err) {
    // DEBUG SEMENTARA: tangkap exception mentah yang bikin halaman 500 generik
    return json({ error: 'DEBUG exception: ' + (err && err.message), stack: err && err.stack }, 500);
  }
      }
       
