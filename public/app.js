const content = document.getElementById('content');
const categoryRail = document.getElementById('categoryRail');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

let categories = [];
let activeCategory = '';
let activeQuery = '';

const playIcon = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;

const CATEGORY_ICONS = {
  film: '\u{1F3AC}',
  series: '\u{1F4FA}',
  drama: '\u{1F3AD}',
  action: '\u2694\uFE0F',
  laga: '\u2694\uFE0F',
  horor: '\u{1F480}',
  horror: '\u{1F480}',
  komedi: '\u{1F602}',
  animasi: '\u{1F9F8}',
  romantis: '\u2764\uFE0F',
};

function iconForCategory(name) {
  const key = (name || '').toLowerCase().trim();
  return CATEGORY_ICONS[key] || '\u{1F3AC}';
}

function formatViews(n) {
  n = Number(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

async function shareVideo(video) {
  const url = `${window.location.origin}/player.html?id=${video.id}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: video.title, url });
    } catch (e) {
      // user membatalkan share, diamkan
    }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link disalin ke clipboard');
    } catch (e) {
      // clipboard tidak didukung, diamkan
    }
  }
}

function posterCard(video) {
  const a = document.createElement('a');
  a.href = `/player.html?id=${video.id}`;
  a.className = 'poster-card';
  a.innerHTML = `
    <div class="poster-wrap">
      <span class="badge-hd">HD</span>
      <img src="${video.poster_url}" alt="${escapeHtml(video.title)}" loading="lazy">
      <div class="play-badge">${playIcon}</div>
    </div>
    <div class="video-title">${escapeHtml(video.title)}</div>
    <div class="poster-actions">
      <span class="views">\u{1F441}\uFE0F ${formatViews(video.views)}</span>
      <button type="button" class="share-btn" data-share>\u{1F517} Bagikan</button>
    </div>
  `;
  a.querySelector('[data-share]').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    shareVideo(video);
  });
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
    pill.textContent = `${iconForCategory(c.name)} ${c.name}`;
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

async function fetchVideos(params) {
  const res = await fetch(`/api/videos?${params}`);
  const data = await res.json();
  return data.items || [];
}

async function loadVideos() {
  if (!activeCategory && !activeQuery) {
    return renderHomeSections();
  }
  return renderFlatGrid();
}

async function renderFlatGrid() {
  content.innerHTML = '<div class="empty-state">Memuat...</div>';
  const params = new URLSearchParams({ limit: '48' });
  if (activeCategory) params.set('category', activeCategory);
  if (activeQuery) params.set('q', activeQuery);

  const items = await fetchVideos(params);

  content.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = activeQuery
    ? `Hasil pencarian: "${activeQuery}"`
    : categories.find((c) => c.id === activeCategory)?.name || 'Video';
  content.appendChild(title);

  if (items.length === 0) {
    content.innerHTML += '<div class="empty-state">Belum ada video di sini.</div>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'grid';
  items.forEach((v) => grid.appendChild(posterCard(v)));
  content.appendChild(grid);
}

async function renderHomeSections() {
  content.innerHTML = '<div class="empty-state">Memuat...</div>';

  const sections = [];

  // section pertama: film terbaru (tanpa filter kategori)
  const terbaru = await fetchVideos(new URLSearchParams({ limit: '3' }));
  if (terbaru.length > 0) {
    sections.push({ icon: '\u{1F525}', name: 'Vidio Terbaru', catId: '', items: terbaru });
  }

  // section berikutnya: satu per kategori yang punya video
  for (const c of categories) {
    const items = await fetchVideos(new URLSearchParams({ category: c.id, limit: '3' }));
    if (items.length > 0) {
      sections.push({ icon: iconForCategory(c.name), name: c.name, catId: c.id, items });
    }
  }

  content.innerHTML = '';

  if (sections.length === 0) {
    content.innerHTML = '<div class="empty-state">Belum ada video di sini.</div>';
    return;
  }

  sections.forEach((sec) => {
    const section = document.createElement('div');
    section.className = 'cat-section';

    const head = document.createElement('div');
    head.className = 'cat-section-head';
    head.innerHTML = `
      <h2>${sec.icon} ${escapeHtml(sec.name)}</h2>
      <a href="?category=${sec.catId}" class="see-all" data-cat="${sec.catId}">Lihat Semua &#8594;</a>
    `;
    section.appendChild(head);

    const grid = document.createElement('div');
    grid.className = 'grid-3col';
    sec.items.forEach((v) => grid.appendChild(posterCard(v)));
    section.appendChild(grid);

    content.appendChild(section);
  });

  // klik "Lihat Semua" langsung filter tanpa reload halaman
  content.querySelectorAll('.see-all').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const catId = link.dataset.cat;
      const pill = [...categoryRail.children].find((p) => p.dataset.id === catId);
      if (pill) setCategory(catId, pill);
    });
  });
}

async function loadBanner() {
  try {
    const res = await fetch('/api/settings/banner');
    if (!res.ok) return;
    const banner = await res.json();

    const bannerTextEl = document.getElementById('bannerText');
    const bannerImageLink = document.getElementById('bannerImageLink');
    const bannerImage = document.getElementById('bannerImage');
    const socialTelegram = document.getElementById('socialTelegram');
    const socialFacebook = document.getElementById('socialFacebook');

    if (banner.enabled && banner.text && bannerTextEl) {
      bannerTextEl.textContent = banner.text;
      bannerTextEl.style.display = 'block';
    }

    if (banner.enabled && banner.image_url && bannerImageLink && bannerImage) {
      bannerImage.src = banner.image_url;
      bannerImageLink.href = banner.link || '#';
      bannerImageLink.style.display = 'block';
    }

    if (socialTelegram && banner.telegram) socialTelegram.href = banner.telegram;
    if (socialFacebook && banner.facebook) socialFacebook.href = banner.facebook;
  } catch (e) {
    // diamkan kalau gagal, banner cuma pemanis, jangan sampai ganggu halaman utama
  }
}

if (content) {
  (async function init() {
    await loadCategories();
    const urlParams = new URLSearchParams(window.location.search);
    const catFromUrl = urlParams.get('category');
    const searchFromUrl = urlParams.get('search');
    if (catFromUrl) {
      activeCategory = catFromUrl;
      const pill = [...categoryRail.children].find((p) => p.dataset.id === catFromUrl);
      if (pill) {
        [...categoryRail.children].forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
      }
    }
    if (searchFromUrl) {
      activeQuery = searchFromUrl;
      if (searchInput) searchInput.value = searchFromUrl;
    }
    await loadVideos();
    await loadBanner();
  })();
}

      
