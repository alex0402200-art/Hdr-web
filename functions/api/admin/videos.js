import { db, json, getLoggedInUser } from '../../_utils.js';

export async function onRequestGet({ request, env }) {
  const username = await getLoggedInUser(request, env);
  if (!username) return json({ error: 'Harus login' }, 401);

  const { data, error } = await db(env)
    .from('videos')
    .select('id, title, poster_url, embed_url, category_id, views, created_at, categories(name)')
    .order('created_at', { ascending: false });

  if (error) return json({ error: error.message }, 500);
  return json({ items: data });
}
