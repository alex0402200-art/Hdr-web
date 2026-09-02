-- Jalankan SQL ini TAMBAHAN di SQL Editor Supabase
-- (tabel admins, categories, videos sudah kamu buat sebelumnya)

create table sessions (
  token uuid primary key default gen_random_uuid(),
  username text not null,
  expires_at timestamptz not null
);

create index idx_sessions_expires on sessions(expires_at);
