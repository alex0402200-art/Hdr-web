import { db, json, getLoggedInUser } from '../../_utils.js';

// Publik: ambil 1 video + naikkan jumlah views
export async function onRequestGet({ params, env, waitUntil }) {
  const supabase = db(env);
  const { data: video, error } = await supabase
    .from('videos')
    .select('id, title, poster_url, embed_url, category_id, views, created_at, categories(id, name, slug)')
    .eq('id', params.id)
    .single();

  if (error || !video) return json({ error: 'Video tidak ditemukan' }, 404);

  // Naikkan views di background lewat fungsi RPC increment_views.
  // waitUntil() memastikan Cloudflare tidak mematikan proses sebelum
  // update ini selesai dikirim ke Supabase.
  const updatePromise = supabase
    .rpc('increment_views', { video_id: params.id })
    .then(({ error: updateError }) => {
      if (updateError) console.error('Gagal update views:', updateError.message);
    });

  if (typeof waitUntil === 'function') {
    waitUntil(updatePromise);
  } else {
    await updatePromise;
  }

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
