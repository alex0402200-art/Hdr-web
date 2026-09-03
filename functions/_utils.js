import { createClient } from '@supabase/supabase-js';

// Bikin koneksi ke Supabase pakai service_role key (akses penuh, dipakai di server saja)
export function db(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });
}

// ===== Password hashing (PBKDF2) =====
const enc = new TextEncoder();
const toB64 = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s) => {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
};

export async function hashPassword(password, saltB64) {
  const salt = saltB64 ? fromB64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    key,
    256
  );
  return { hash: toB64(bits), salt: toB64(salt) };
}

export async function verifyPassword(password, hash, salt) {
  const result = await hashPassword(password, salt);
  return result.hash === hash;
}

// ===== Sesi login (cookie) =====
export async function getLoggedInUser(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;

  const supabase = db(env);
  const { data } = await supabase
    .from('sessions')
    .select('username, expires_at')
    .eq('token', match[1])
    .single();

  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data.username;
}

// ===== Validasi link embed Doodstream =====
// Longgar sengaja: Doodstream sering ganti domain mirror (dood.to, dood.li, ds2play.com, dll)
export function isValidDoodstreamEmbed(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}
