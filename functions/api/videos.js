import { db, json, getLoggedInUser, isValidDoodstreamEmbed } from '../_utils.js';

// Publik: daftar video. Bisa difilter ?category=<id> dan/atau ?q=<judul>, dengan ?page & ?limit
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const categoryId = url.searchParams.get('category') || '';
  const q = url.searchParams.get('q') || '';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Number(url.searchParams.get('limit')) || 24;

  const supabase = db(env);
  let query = supabase
    .from('videos')
    .select('id, title, poster_url, category_id, views, created_at, categories(name, slug)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (categoryId) query = query.eq('category_id', categoryId);
  if (q) query = query.ilike('title', `%${q}%`);

  const from = (page - 1) * limit;
  const { data, error, count } = await query.range(from, from + limit - 1);

  if (error) return json({ error: error.message }, 500);
  return json({ items: data, page, limit, total: count, pages: Math.ceil((count || 0) / limit) });
}

// Admin: tambah video baru atau update video (kalau body.id diisi)
export async function onRequestPost({ request, env }) {
  const username = await getLoggedInUser(request, env);
  if (!username) return json({ error: 'Harus login' }, 401);

  const body = await request.json();
  if (!body.title || !body.poster_url || !isValidDoodstreamEmbed(body.embed_url)) {
    return json({ error: 'Judul, URL poster, dan link embed Doodstream wajib diisi dengan benar' }, 400);
  }
  try {
    new URL(body.poster_url);
  } catch {
    return json({ error: 'URL poster tidak valid' }, 400);
  }

  const supabase = db(env);
  const row = {
    title: body.title,
    poster_url: body.poster_url,
    embed_url: body.embed_url,
    category_id: body.category_id || null
  };

  let result;
  if (body.id) {
    result = await supabase.from('videos').update(row).eq('id', body.id).select('id').single();
  } else {
    result = await supabase.from('videos').insert(row).select('id').single();
  }

  if (result.error) return json({ error: result.error.message }, 500);
  return json({ message: body.id ? 'Video diperbarui' : 'Video dipublikasikan', id: result.data.id });
}
