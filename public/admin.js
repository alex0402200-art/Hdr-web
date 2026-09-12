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
    switchView('upload');
  } else {
    loginCard.style.display = 'block';
  }
}

// ===== Setup admin pertama =====
document.getElementById('setupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('setupMsg');
  msg.textContent = '';
  const res = await fetch('/api/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: document.getElementById('setupToken').value,
      username: document.getElementById('setupUsername').value,
      password: document.getElementById('setupPassword').value
    })
  });
  const data = await res.json();
  if (!res.ok) {
    msg.className = 'msg err';
    msg.textContent = data.error || `Gagal (status ${res.status}), server tidak kirim pesan error`;
    return;
  }
  msg.className = 'msg ok';
  msg.textContent = 'Admin berhasil dibuat. Silakan login.';
  setTimeout(() => location.reload(), 1000);
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

// ===== Hamburger menu & view switching =====
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');

menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  sideMenu.classList.toggle('open');
});

document.addEventListener('click', () => sideMenu.classList.remove('open'));

document.querySelectorAll('.side-menu-link').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(link.dataset.view);
  });
});

function switchView(name) {
  document.getElementById('viewUpload').style.display = name === 'upload' ? 'block' : 'none';
  document.getElementById('viewMyVideo').style.display = name === 'myVideo' ? 'block' : 'none';
  document.getElementById('viewEditBanner').style.display = name === 'editBanner' ? 'block' : 'none';
  sideMenu.classList.remove('open');
  categoryPopup.style.display = 'none';

  if (name === 'myVideo') loadVideos();
  if (name === 'editBanner') loadBannerSettings();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Kategori =====
let categoriesCache = [];
const categoryBtn = document.getElementById('categoryBtn');
const categoryBtnLabel = document.getElementById('categoryBtnLabel');
const categoryPopup = document.getElementById('categoryPopup');
const categoryPopupList = document.getElementById('categoryPopupList');
const videoCategoryInput = document.getElementById('videoCategory');

async function loadCategories() {
  const res = await fetch('/api/categories');
  const data = await res.json();
  categoriesCache = data.items || [];
  renderCategoryPopup();
}

function renderCategoryPopup() {
  categoryPopupList.innerHTML = '';
  categoriesCache.forEach((c) => {
    const row = document.createElement('div');
    row.className = 'category-popup-item';
    row.innerHTML = `
      <span class="cat-name" data-id="${c.id}" data-name="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
      <button type="button" class="cat-delete" data-id="${c.id}">&#128465;</button>
    `;
    row.querySelector('.cat-name').addEventListener('click', () => selectCategory(c.id, c.name));
    row.querySelector('.cat-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCategory(c.id);
    });
    categoryPopupList.appendChild(row);
  });
}

function selectCategory(id, name) {
  videoCategoryInput.value = id;
  categoryBtnLabel.textContent = name ? name.toUpperCase() : 'PILIH KATEGORI';
  categoryPopup.style.display = 'none';
}

categoryBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  categoryPopup.style.display = categoryPopup.style.display === 'none' ? 'block' : 'none';
});

categoryPopup.addEventListener('click', (e) => e.stopPropagation());

document.querySelector('.category-popup .no-cat').addEventListener('click', () => selectCategory('', ''));

document.getElementById('newCategoryName').addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  await addCategory();
});

document.querySelector('.category-popup .cat-icon').addEventListener('click', addCategory);

async function addCategory() {
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
}

async function deleteCategory(id) {
  if (!confirm('Hapus kategori ini? Video di dalamnya tidak akan terhapus, hanya jadi tanpa kategori.')) return;
  await fetch(`/api/categories/${id}`, { method: 'DELETE' });
  if (videoCategoryInput.value === id) selectCategory('', '');
  loadCategories();
}

// ===== Upload poster dari galeri =====
document.getElementById('posterUploadBtn').addEventListener('click', () => {
  document.getElementById('posterFile').click();
});

document.getElementById('posterFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const msg = document.getElementById('posterUploadMsg');
  msg.className = 'msg';
  msg.textContent = 'Mengupload...';

  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/upload-poster', { method: 'POST', body: formData });
    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      msg.className = 'msg err';
      msg.textContent = `Upload gagal (status ${res.status}): ${rawText.slice(0, 200)}`;
      return;
    }
    if (!res.ok) {
      msg.className = 'msg err';
      msg.textContent = data.error || 'Upload gagal';
      return;
    }
    document.getElementById('videoPoster').value = data.url;
    msg.className = 'msg ok';
    msg.textContent = 'Poster berhasil diupload';
  } catch (err) {
    msg.className = 'msg err';
    msg.textContent = `Gagal koneksi: ${err.message}`;
  }
});

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
    category_id: videoCategoryInput.value || null
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
});

function resetForm() {
  videoForm.reset();
  document.getElementById('videoId').value = '';
  selectCategory('', '');
  document.getElementById('videoSubmitBtn').textContent = 'UNGGAH';
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
        <div class="s">${v.categories ? escapeHtml(v.categories.name) : 'Tanpa kategori'} &middot; ${v.views || 0} views</div>
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
  selectCategory(v.category_id || '', v.categories ? v.categories.name : '');
  document.getElementById('videoSubmitBtn').textContent = 'SIMPAN PERUBAHAN';
  cancelEditBtn.style.display = 'inline-block';
  switchView('upload');
}

async function deleteVideo(id) {
  if (!confirm('Hapus video ini secara permanen?')) return;
  await fetch(`/api/videos/${id}`, { method: 'DELETE' });
  loadVideos();
}

// ===== Edit Banner =====
const bannerForm = document.getElementById('bannerForm');

async function loadBannerSettings() {
  const msg = document.getElementById('bannerMsg');
  msg.textContent = '';
  try {
    const res = await fetch('/api/settings/banner');
    const data = await res.json();
    document.getElementById('bannerEnabled').value = data.enabled ? 'true' : 'false';
    document.getElementById('bannerText').value = data.text || '';
    document.getElementById('bannerLink').value = data.link || '';
  } catch (e) {
    msg.className = 'msg err';
    msg.textContent = 'Gagal memuat data banner';
  }
}

bannerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('bannerMsg');
  msg.textContent = '';

  const body = {
    enabled: document.getElementById('bannerEnabled').value === 'true',
    text: document.getElementById('bannerText').value,
    link: document.getElementById('bannerLink').value,
    image_url: ''
  };

  const res = await fetch('/api/settings/banner', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const data = await res.json();
    msg.className = 'msg err';
    msg.textContent = data.error || 'Gagal menyimpan banner';
    return;
  }

  msg.className = 'msg ok';
  msg.textContent = 'Banner berhasil disimpan';
});

boot();
    
