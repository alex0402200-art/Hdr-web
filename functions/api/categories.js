import { db, json, getLoggedInUser } from '../_utils.js';

// Publik: daftar semua kategori
export async function onRequestGet({ env }) {
  const supabase = db(env);
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  if (error) return json({ error: error.message }, 500);
  return json({ items: data });
}

// Admin: tambah kategori baru
export async function onRequestPost({ request, env }) {
  const username = await getLoggedInUser(request, env);
  if (!username) return json({ error: 'Harus login' }, 401);

  const body = await request.json();
  const name = (body.name || '').trim();
  if (!name) return json({ error: 'Nama kategori wajib diisi' }, 400);

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data, error } = await db(env)
    .from('categories')
    .insert({ name, slug })
    .select('id, name, slug')
    .single();

  if (error) {
    if (error.code === '23505') return json({ error: 'Kategori sudah ada' }, 409);
    return json({ error: error.message }, 500);
  }
  return json(data);
}
