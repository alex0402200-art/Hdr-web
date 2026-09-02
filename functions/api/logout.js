import { db, json } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/session=([^;]+)/);
  if (match) {
    await db(env).from('sessions').delete().eq('token', match[1]);
  }
  return json({ ok: true }, 200, {
    'Set-Cookie': 'session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
  });
}
