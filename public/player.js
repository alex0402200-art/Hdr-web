const videoId = new URLSearchParams(location.search).get('id');
const playerFrame = document.getElementById('playerFrame');
const videoTitleEl = document.getElementById('videoTitle');
const videoMetaEl = document.getElementById('videoMeta');
const relatedGrid = document.getElementById('relatedGrid');
const seeAllLink = document.getElementById('seeAllLink');
const RELATED_LIMIT = 6;

async function loadVideo() {
  if (!videoId) {
    videoTitleEl.textContent = 'Video tidak ditemukan';
    return;
  }

  const res = await fetch(`/api/videos/${videoId}`);
  if (!res.ok) {
    videoTitleEl.textContent = 'Video tidak ditemukan';
    return;
  }
  const video = await res.json();

  document.title = `${video.title} - HDR Film`;
  videoTitleEl.textContent = video.title;

  const categoryText = video.categories ? video.categories.name : '';
  videoMetaEl.innerHTML = `
    <span>${categoryText}</span>
    <span class="view-count">&#128065; ${video.views || 0} views</span>
    <button id="shareBtn" class="share-btn">&#128279; Share</button>
  `;

  document.getElementById('shareBtn').addEventListener('click', () => shareVideo(video.title));

  playerFrame.innerHTML = `<iframe src="${video.embed_url}" allowfullscreen allow="autoplay; fullscreen"></iframe>`;

  if (seeAllLink) {
    seeAllLink.href = video.category_id ? `/?category=${video.category_id}` : '/';
  }

  if (video.category_id) {
    loadRelated(video.category_id, video.id);
  } else {
    loadLatest(video.id);
  }
}

async function shareVideo(title) {
  const shareUrl = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title, url: shareUrl });
    } catch (e) {
      // user batal share, biarin aja
    }
  } else {
    await navigator.clipboard.writeText(shareUrl);
    alert('Link disalin!');
  }
}

async function loadRelated(categoryId, excludeId) {
  const res = await fetch(`/api/videos?category=${categoryId}&limit=${RELATED_LIMIT + 1}`);
  const data = await res.json();
  const items = (data.items || []).filter((v) => v.id !== excludeId).slice(0, RELATED_LIMIT);

  if (items.length === 0) {
    loadLatest(excludeId);
    return;
  }

  relatedGrid.innerHTML = '';
  items.forEach((v) => relatedGrid.appendChild(posterCard(v)));
}

async function loadLatest(excludeId) {
  const res = await fetch(`/api/videos?limit=${RELATED_LIMIT + 1}`);
  const data = await res.json();
  const items = (data.items || []).filter((v) => v.id !== excludeId).slice(0, RELATED_LIMIT);

  relatedGrid.innerHTML = '';
  if (items.length === 0) {
    relatedGrid.innerHTML = '<div class="empty-state">Belum ada video lain.</div>';
    return;
  }
  items.forEach((v) => relatedGrid.appendChild(posterCard(v)));
}

async function loadPlayerCategories() {
  const wrap = document.getElementById('playerCategoryPills');
  if (!wrap) return;
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    const items = data.items || [];
    wrap.innerHTML = '';
    items.forEach((c, i) => {
      const a = document.createElement('a');
      a.href = `/?category=${c.id}`;
      a.className = `player-cat-pill ${i % 2 === 0 ? 'pink' : 'blue'}`;
      a.textContent = c.name;
      wrap.appendChild(a);
    });
  } catch (e) {
    // diamkan, kategori cuma pemanis
  }
}

async function loadFooterSocial() {
  try {
    const res = await fetch('/api/settings/banner');
    const data = await res.json();
    const fb = document.getElementById('footerFacebook');
    const tg = document.getElementById('footerTelegram');
    if (fb && data.facebook) fb.href = data.facebook;
    if (tg && data.telegram) tg.href = data.telegram;
  } catch (e) {
    // diamkan, sosmed cuma pemanis
  }
}

loadVideo();
loadPlayerCategories();
loadFooterSocial();

const searchToggleBtn = document.getElementById('searchToggleBtn');
const playerSearchForm = document.getElementById('playerSearchForm');
const playerSearchInput = document.getElementById('playerSearchInput');

if (searchToggleBtn) {
  searchToggleBtn.addEventListener('click', () => {
    playerSearchForm.classList.toggle('open');
    if (playerSearchForm.classList.contains('open')) playerSearchInput.focus();
  });
}

if (playerSearchForm) {
  playerSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = playerSearchInput.value.trim();
    if (q) window.location.href = `/?search=${encodeURIComponent(q)}`;
  });
        }
                
