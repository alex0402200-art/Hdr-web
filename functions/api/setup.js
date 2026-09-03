import { db, json, hashPassword } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    if (!env.SETUP_TOKEN || body.token !== env.SETUP_TOKEN) {
      return json({ error: 'Setup token salah' }, 403);
    }

    const supabase = db(env);

    const { count } = await supabase.from('admins').select('*', { count: 'exact', head: true });
    if (count > 0) return json({ error: 'Admin sudah ada' }, 409);

    if (!body.username || !body.password || body.password.length < 8) {
      return json({ error: 'Username wajib diisi, password minimal 8 karakter' }, 400);
    }

    const { hash, salt } = await hashPassword(body.password);

    const { error } = await supabase
      .from('admins')
      .insert({ username: body.username, password_hash: hash, password_salt: salt });

    if (error) {
      return json({ error: `Gagal insert: ${error.message || JSON.stringify(error)}` }, 500);
    }
    return json({ message: 'Admin berhasil dibuat' });
  } catch (e) {
    return json({ error: `Server error: ${e && e.message ? e.message : String(e)}` }, 500);
  }
}
