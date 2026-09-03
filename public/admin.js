const setupCard = document.getElementById('setupCard');
const loginCard = document.getElementById('loginCard');
const dashboard = document.getElementById('dashboard');
const whoami = document.getElementById('whoami');

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

// ===== Boot: cek status setup & login =====
async function boot() {
  const statusRes = await fetch('/api/setup/status');
  const status = await statusRes.json();

  if (status.available) {
    setupCard.style.display = 'block';
    return;
  }

  const authRes = await fetch('/api/auth');
  const auth = await authRes.json();

  if (auth.loggedIn) {
    whoami.style.display = 'inline-block';
    whoami.textContent = `Login sebagai ${auth.username}`;
    dashboard.style.display = 'block';
    loadCategories();
    loadVideos();
  } else {
    loginCard.style.display = 'block';
  }
}

// ===== Setup admin pertama =====
document.getElementById('setupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('setupMsg');
  msg.textContent = '';
  msg.className = 'msg';
  try {
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: document.getElementById('setupToken').value,
        username: document.getElementById('setupUsername').value,
        password: document.getElementById('setupPassword').value
      })
    });
    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      msg.className = 'msg err';
      msg.textContent = `Server error mentah (status ${res.status}): ${rawText.slice(0, 300)}`;
      return;
    }
    if (!res.ok) {
      msg.className = 'msg err';
      msg.textContent = data.error || `Gagal (status ${res.status}), server tidak kirim pesan error`;
      return;
    }
    msg.className = 'msg ok';
    msg.textContent = 'Admin berhasil dibuat. Silakan login.';
    setTimeout(() => location.reload(), 1000);
  } catch (err) {
    msg.className = 'msg err';
    msg.textContent = `Gagal koneksi ke server: ${err.message}`;
  }
});

// ===== Login =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('loginMsg');
  msg.textContent = '';
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: document.getElementById('loginUsername').value,
      password: document.getElementById('loginPassword').value
    })
  });
  const data = await res.json();
  if (!res.ok) {
    msg.className = 'msg err';
    msg.textContent = data.error;
    return;
  }
  location.reload();
});

// ===== Kategori =====
let categoriesCache = [];

async function loadCategories() {
  const res = await fetch('/api/categories');
  const data = await res.json();
  categoriesCache = data.items || [];

  const list = document.getElementById('categoryList');
  list.innerHTML = categoriesCache.length
    ? ''
    : '<div class="video-meta">Belum ada kategori.</div>';

  categoriesCache.forEach((c) => {
    const row = document.createElement('div');
    row.className = 'admin-row';
    row.innerHTML = `
      <div class="info"><div class="t">${escapeHtml(c.name)}</div></div>
      <button class="btn btn-ghost" data-id="${c.id}">Hapus</button>
    `;
    row.querySelector('button').addEventListener('click', () => deleteCategory(c.id));
    list.appendChild(row);
  });

  const select = document.getElementById('videoCategory');
  select.innerHTML = '<option value="">- Tanpa kategori -</option>';
  categoriesCache.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

document.getElementById('addCategoryBtn').addEventListener('click', async () => {
  const input = document.getElementById('newCategoryName');
  const name = input.value.trim();
  if (!name) return;
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (res.ok) {
    input.value = '';
    loadCategories();
  } else {
    const data = await res.json();
    alert(data.error);
  }
});

async function deleteCategory(id) {
  if (!confirm('Hapus kategori ini? Video di dalamnya tidak akan terhapus, hanya jadi tanpa kategori.')) return;
  await fetch(`/api/categories/${id}`, { method: 'DELETE' });
  loadCategories();
  loadVideos();
}

// ===== Video =====
const videoForm = document.getElementById('videoForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');

videoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('videoMsg');
  msg.textContent = '';

  const body = {
    id: document.getElementById('videoId').value || undefined,
    title: document.getElementById('videoTitle').value,
    poster_url: document.getElementById('videoPoster').value,
    embed_url: document.getElementById('videoEmbed').value,
    category_id: document.getElementById('videoCategory').value || null
  };

  const res = await fetch('/api/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();

  if (!res.ok) {
    msg.className = 'msg err';
    msg.textContent = data.error;
    return;
  }

  msg.className = 'msg ok';
  msg.textContent = data.message;
  resetForm();
  loadVideos();
});

function resetForm() {
  videoForm.reset();
  document.getElementById('videoId').value = '';
  document.getElementById('formHeading').textContent = 'Upload Video Baru';
  document.getElementById('videoSubmitBtn').textContent = 'Publikasikan';
  cancelEditBtn.style.display = 'none';
}

cancelEditBtn.addEventListener('click', resetForm);

async function loadVideos() {
  const res = await fetch('/api/admin/videos');
  const data = await res.json();
  const list = document.getElementById('videoList');

  list.innerHTML = (data.items || []).length
    ? ''
    : '<div class="video-meta">Belum ada video.</div>';

  (data.items || []).forEach((v) => {
    const row = document.createElement('div');
    row.className = 'admin-row';
    row.innerHTML = `
      <img src="${v.poster_url}" alt="">
      <div class="info">
        <div class="t">${escapeHtml(v.title)}</div>
        <div class="s">${v.categories ? escapeHtml(v.categories.name) : 'Tanpa kategori'} · ${v.views || 0} views</div>
      </div>
      <button class="btn btn-ghost" data-action="edit">Edit</button>
      <button class="btn btn-ghost" data-action="delete">Hapus</button>
    `;
    row.querySelector('[data-action="edit"]').addEventListener('click', () => editVideo(v));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteVideo(v.id));
    list.appendChild(row);
  });
}

function editVideo(v) {
  document.getElementById('videoId').value = v.id;
  document.getElementById('videoTitle').value = v.title;
  document.getElementById('videoPoster').value = v.poster_url;
  document.getElementById('videoEmbed').value = v.embed_url;
  document.getElementById('videoCategory').value = v.category_id || '';
  document.getElementById('formHeading').textContent = 'Edit Video';
  document.getElementById('videoSubmitBtn').textContent = 'Simpan Perubahan';
  cancelEditBtn.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteVideo(id) {
  if (!confirm('Hapus video ini secara permanen?')) return;
  await fetch(`/api/videos/${id}`, { method: 'DELETE' });
  loadVideos();
}

boot();
