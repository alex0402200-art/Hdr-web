import { db, json, getLoggedInUser } from '../../_utils.js';

// Publik: ambil 1 video + naikkan jumlah views
export async function onRequestGet({ params, env }) {
  const supabase = db(env);
  const { data: video, error } = await supabase
    .from('videos')
    .select('id, title, poster_url, embed_url, category_id, views, created_at, categories(id, name, slug)')
    .eq('id', params.id)
    .single();

  if (error || !video) return json({ error: 'Video tidak ditemukan' }, 404);

  // Naikkan views secara diam-diam (tidak perlu ditunggu)
  supabase.from('videos').update({ views: (video.views || 0) + 1 }).eq('id', params.id).then(() => {});

  return json(video);
}

// Admin: hapus video
export async function onRequestDelete({ params, request, env }) {
  const username = await getLoggedInUser(request, env);
  if (!username) return json({ error: 'Harus login' }, 401);

  const { error } = await db(env).from('videos').delete().eq('id', params.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
