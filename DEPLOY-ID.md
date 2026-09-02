# HDR Film — Panduan Deploy

yo
Website video: login admin → upload poster + link embed Doodstream + kategori.
Pengunjung lihat grid ala YouTube → klik poster → nonton + video terkait kategori sama.

Database: **Supabase** (Postgres). Hosting: **Cloudflare Pages**.

---

## 1. Database (Supabase)

Kamu sudah bikin tabel `admins`, `categories`, `videos`. Sekarang jalankan SATU LAGI
file SQL ini di **SQL Editor** Supabase (tabel `sessions`, dipakai untuk login):

→ `supabase-sessions.sql` (ada di folder ini)

## 2. Push kode ke GitHub

1. Bikin repo baru di GitHub (boleh private)
2. Upload semua isi folder ini ke repo itu (drag & drop di GitHub web juga bisa,
   atau pakai `git push` kalau familiar)

## 3. Deploy ke Cloudflare Pages

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Pilih repo yang tadi di-push
3. Build settings:
   - **Build command**: (kosongkan)
   - **Build output directory**: `public`
4. **Environment variables** — ini WAJIB diisi sebelum deploy, klik "Add variable":

   | Nama variabel | Isi |
   |---|---|
   | `SUPABASE_URL` | `https://yfppowaxezfhnwjngngq.supabase.co` |
   | `SUPABASE_SERVICE_KEY` | secret key kamu (`sb_secret_...`) |
   | `SETUP_TOKEN` | bikin sendiri, kata sandi bebas & rahasia, contoh: `rahasia-setup-2026` |

5. Klik **Save and Deploy**

## 4. Bikin akun admin pertama

1. Buka `https://nama-project-kamu.pages.dev/admin.html`
2. Karena belum ada admin, otomatis muncul form **"Bikin Akun Admin"**
3. Isi:
   - Setup token → sama persis dengan `SETUP_TOKEN` yang kamu isi di step 3
   - Username & password admin kamu
4. Setelah berhasil, login pakai username/password itu

## 5. Mulai pakai

- Di dashboard admin: tambah kategori dulu (misal Action, Drama, Horror)
- Lalu upload video: judul, URL poster (upload gambar ke mana saja yang kasih direct link, misal imgbb.com), link embed Doodstream, pilih kategori
- Cek halaman utama (`/`) — video akan muncul di grid, klik poster untuk nonton

## Catatan link embed Doodstream

Ambil link dari tombol **"Embed"** di halaman video Doodstream (bukan link biasa),
bentuknya seperti: `https://dood.../e/xxxxxxxxxxxx`

---

**Kalau ada error pas deploy atau pas dipakai, screenshot error-nya dan kirim ke saya.**
