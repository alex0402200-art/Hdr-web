import { db, json, getLoggedInUser } from '../../_utils.js';

export async function onRequestDelete({ params, request, env }) {
  const username = await getLoggedInUser(request, env);
  if (!username) return json({ error: 'Harus login' }, 401);

  const { error } = await db(env).from('categories').delete().eq('id', params.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
