import { json } from '../../_utils.js';

export async function onRequestGet({ env }) {
  const url = `${env.SUPABASE_URL}/rest/v1/admins?select=id&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
    }
  });
  const bodyText = await res.text();
  return json({
    status: res.status,
    statusText: res.statusText,
    body: bodyText
  });
}
