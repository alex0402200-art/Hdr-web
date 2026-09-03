import { json, getLoggedInUser } from '../../_utils.js';

export async function onRequestPost({ request, env }) {
  const username = await getLoggedInUser(request, env);
  if (!username) return json({ error: 'Harus login' }, 401);

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file) return json({ error: 'Tidak ada file' }, 400);

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filename = `${Date.now()}-${safeName}`;

  const uploadRes = await fetch(
    `${env.SUPABASE_URL}/storage/v1/object/Poster/${filename}`,
    {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: await file.arrayBuffer()
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    return json({ error: `Upload gagal (${uploadRes.status}): ${errText}` }, 500);
  }

  const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/Poster/${filename}`;
  return json({ url: publicUrl });
}
