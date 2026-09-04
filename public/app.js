const content = document.getElementById('content');
const categoryRail = document.getElementById('categoryRail');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

let categories = [];
let activeCategory = '';
let activeQuery = '';

const playIcon = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;

function posterCard(video) {
  const a = document.createElement('a');
  a.href = `/player.html?id=${video.id}`;
  a.className = 'poster-card';
  a.innerHTML = `
    <div class="poster-wrap">
      <img src="${video.poster_url}" alt="${escapeHtml(video.title)}" loading="lazy">
      <div class="play-badge">${playIcon}</div>
    </div>
    <div class="video-title">${escapeHtml(video.title)}</div>
    <div class="video-meta">${video.categories ? escapeHtml(video.categories.name) : ''}</div>
  `;
  return a;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

async function loadCategories() {
  const res = await fetch('/api/categories');
  const data = await res.json();
  categories = data.items || [];
  for (const c of categories) {
    const pill = document.createElement('div');
    pill.className = 'cat-pill';
    pill.textContent = c.name;
    pill.dataset.id = c.id;
    pill.addEventListener('click', () => setCategory(c.id, pill));
    categoryRail.appendChild(pill);
  }
}

function setCategory(id, el) {
  activeCategory = id;
  [...categoryRail.children].forEach((p) => p.classList.remove('active'));
  el.classList.add('active');
  loadVideos();
}

if (categoryRail) {
  categoryRail.addEventListener('click', (e) => {
    if (e.target.dataset.id === '') setCategory('', e.target);
  });
}

if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    activeQuery = searchInput.value.trim();
    loadVideos();
  });
}

async function loadVideos() {
  content.innerHTML = '<div class="empty-state">Memuat...</div>';
  const params = new URLSearchParams({ limit: '48' });
  if (activeCategory) params.set('category', activeCategory);
  if (activeQuery) params.set('q', activeQuery);

  const res = await fetch(`/api/videos?${params}`);
  const data = await res.json();

  content.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = activeQuery
    ? `Hasil pencarian: "${activeQuery}"`
    : activeCategory
      ? categories.find((c) => c.id === activeCategory)?.name || 'Video'
      : 'Terbaru';
  content.appendChild(title);

  if (!data.items || data.items.length === 0) {
    content.innerHTML += '<div class="empty-state">Belum ada video di sini.</div>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'grid';
  data.items.forEach((v) => grid.appendChild(posterCard(v)));
  content.appendChild(grid);
}

if (content) {
  (async function init() {
    await loadCategories();
    const urlParams = new URLSearchParams(window.location.search);
    const catFromUrl = urlParams.get('category');
    if (catFromUrl) {
      activeCategory = catFromUrl;
      const pill = [...categoryRail.children].find((p) => p.dataset.id === catFromUrl);
      if (pill) {
        [...categoryRail.children].forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
      }
    }
    await loadVideos();
  })();
}
