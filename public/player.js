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

  const categoryText = video.categories ? video.categories.name : '';
  videoMetaEl.innerHTML = `
    <span>${categoryText}</span>
    <span class="view-count">&#128065; ${video.views || 0} views</span>
    <button id="shareBtn" class="share-btn">&#128279; Share</button>
  `;

  document.getElementById('shareBtn').addEventListener('click', () => shareVideo(video.title));

  playerFrame.innerHTML = `<iframe src="${video.embed_url}" allowfullscreen allow="autoplay; fullscreen"></iframe>`;

  if (video.category_id) {
    loadRelated(video.category_id, video.id);
  } else {
    relatedGrid.innerHTML = '<div class="empty-state">Video ini belum punya kategori.</div>';
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
