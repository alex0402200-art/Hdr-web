const videoId = new URLSearchParams(location.search).get('id');
const playerFrame = document.getElementById('playerFrame');
const videoTitleEl = document.getElementById('videoTitle');
const videoMetaEl = document.getElementById('videoMeta');
const relatedGrid = document.getElementById('relatedGrid');

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
  videoMetaEl.textContent = video.categories ? video.categories.name : '';

  playerFrame.innerHTML = `<iframe src="${video.embed_url}" allowfullscreen allow="autoplay; fullscreen"></iframe>`;

  if (video.category_id) {
    loadRelated(video.category_id, video.id);
  } else {
    relatedGrid.innerHTML = '<div class="empty-state">Video ini belum punya kategori.</div>';
  }
}

async function loadRelated(categoryId, excludeId) {
  const res = await fetch(`/api/videos?category=${categoryId}&limit=13`);
  const data = await res.json();
  const items = (data.items || []).filter((v) => v.id !== excludeId);

  relatedGrid.innerHTML = '';
  if (items.length === 0) {
    relatedGrid.innerHTML = '<div class="empty-state">Belum ada video lain di kategori ini.</div>';
    return;
  }
  items.forEach((v) => relatedGrid.appendChild(posterCard(v)));
}

loadVideo();
