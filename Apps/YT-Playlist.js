// @name        YT Playlist
// @icon        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#ff0000"/><path d="M9.5 7.5v9l7-4.5z" fill="#fff"/></svg>
// @description YouTube playlist with inline video playback

(function () {
  // ── Storage ────────────────────────────────────────────────
  const store = typeof FlashDash !== 'undefined' ? FlashDash.storage : null;
  function loadPlaylist() {
    try { return JSON.parse(store?.getItem('yt_pl') || '[]'); }
    catch { return []; }
  }
  function persist() { store?.setItem('yt_pl', JSON.stringify(playlist)); }

  // ── State ──────────────────────────────────────────────────
  let playlist     = loadPlaylist();
  let currentIndex = -1;

  // ── Helpers ────────────────────────────────────────────────
  function extractVideoId(raw) {
    const s = raw.trim();
    let m;
    if ((m = s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)))  return m[1];
    if ((m = s.match(/[?&]v=([A-Za-z0-9_-]{11})/)))       return m[1];
    if ((m = s.match(/shorts\/([A-Za-z0-9_-]{11})/)))      return m[1];
    if ((m = s.match(/embed\/([A-Za-z0-9_-]{11})/)))       return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(s))                    return s;
    return null;
  }

  async function fetchVideoInfo(videoId) {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`
      );
      if (!response.ok) return {};
      const data = await response.json();
      return { title: data.title || '', channel: data.author_name || '' };
    } catch {
      return {};
    }
  }

  function buildEmbedUrl(videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  }

  function buildThumbnailUrl(videoId) {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Styles ─────────────────────────────────────────────────
  document.head.insertAdjacentHTML('beforeend', `<style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #0a0a0a;
      color: #e8e8e8;
      font-family: 'Segoe UI', system-ui, Arial, sans-serif;
      overflow: hidden;
    }

    /* ── Top bar ── */
    .topbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: #111;
      border-bottom: 1px solid #222;
      flex-shrink: 0;
    }

    .yt-logo {
      background: #ff0000;
      border-radius: 5px;
      width: 28px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .yt-logo svg { display: block; }

    .url-input {
      flex: 1;
      background: #1a1a1a;
      border: 1px solid #2e2e2e;
      border-radius: 20px;
      color: #e8e8e8;
      font-family: inherit;
      font-size: 12px;
      padding: 7px 14px;
      outline: none;
      user-select: text;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .url-input:focus { border-color: #ff0000; box-shadow: 0 0 0 3px rgba(255,0,0,0.15); }
    .url-input::placeholder { color: #484848; }
    .url-input.shake { animation: shake 0.3s; border-color: #aa2222 !important; }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25%, 75%  { transform: translateX(-4px); }
      50%       { transform: translateX(4px); }
    }

    .add-btn {
      background: #ff0000;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 7px 18px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      letter-spacing: 0.4px;
      transition: background 0.12s, transform 0.1s;
      flex-shrink: 0;
    }
    .add-btn:hover  { background: #e50000; }
    .add-btn:active { transform: scale(0.95); }

    /* ── Main layout ── */
    .main {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 260px;
      flex-shrink: 0;
      background: #0e0e0e;
      border-right: 1px solid #1e1e1e;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid #1a1a1a;
      flex-shrink: 0;
    }

    .sidebar-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #555;
    }

    .sidebar-count {
      font-size: 10px;
      color: #3a3a3a;
    }

    .playlist-list {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #2a2a2a transparent;
    }
    .playlist-list::-webkit-scrollbar       { width: 3px; }
    .playlist-list::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

    /* Empty state */
    .empty-state {
      padding: 40px 16px;
      text-align: center;
      color: #3a3a3a;
    }
    .empty-state-icon {
      font-size: 32px;
      margin-bottom: 10px;
      opacity: 0.4;
    }
    .empty-state-text {
      font-size: 11px;
      line-height: 1.6;
    }

    /* Playlist item */
    .playlist-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      cursor: pointer;
      border-left: 3px solid transparent;
      transition: background 0.1s, border-color 0.1s;
      position: relative;
    }
    .playlist-item:hover { background: #161616; }
    .playlist-item.active {
      background: rgba(255,0,0,0.06);
      border-left-color: #ff0000;
    }

    .item-index {
      font-size: 10px;
      color: #3a3a3a;
      width: 18px;
      text-align: center;
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }
    .playlist-item.active .item-index { color: #ff4444; }

    .item-thumb {
      width: 76px;
      height: 44px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
      background: #1c1c1c;
      display: block;
    }

    .item-info {
      flex: 1;
      min-width: 0;
    }

    .item-title {
      font-size: 11px;
      font-weight: 500;
      color: #888;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .playlist-item:hover .item-title { color: #bbb; }
    .playlist-item.active .item-title { color: #eee; font-weight: 600; }
    .item-title.loading { color: #3a3a3a; font-style: italic; }

    .item-channel {
      font-size: 10px;
      color: #444;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-delete {
      opacity: 0;
      background: none;
      border: none;
      color: #555;
      font-size: 14px;
      cursor: pointer;
      padding: 3px 5px;
      border-radius: 4px;
      line-height: 1;
      flex-shrink: 0;
      transition: opacity 0.1s, color 0.1s;
    }
    .playlist-item:hover .item-delete { opacity: 1; }
    .item-delete:hover { color: #ff5555; }

    /* ── Player area ── */
    .player-area {
      flex: 1;
      background: #000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .player-frame {
      flex: 1;
      width: 100%;
      border: none;
      display: block;
    }

    /* Placeholder when nothing is playing */
    .player-placeholder {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      color: #2a2a2a;
      text-align: center;
      padding: 20px;
    }

    .placeholder-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #111;
      border: 1px solid #1e1e1e;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .placeholder-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .placeholder-sub {
      font-size: 12px;
      color: #262626;
    }

    /* Now-playing bar at bottom of player */
    .now-playing-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 14px;
      background: #0d0d0d;
      border-top: 1px solid #1a1a1a;
      min-height: 44px;
      flex-shrink: 0;
    }

    .now-playing-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #ff4444;
      flex-shrink: 0;
    }

    .now-playing-title {
      font-size: 12px;
      color: #888;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-btns {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .nav-btn {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      color: #666;
      border-radius: 5px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.1s, color 0.1s;
    }
    .nav-btn:hover { background: #222; color: #ccc; }
    .nav-btn:disabled { opacity: 0.25; cursor: default; }
  </style>`);

  // ── HTML ───────────────────────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `
    <div class="topbar">
      <div class="yt-logo">
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path d="M5.5 2.5v5l5-2.5z" fill="#fff"/>
        </svg>
      </div>
      <input class="url-input" id="urlInput" type="text"
        placeholder="Paste YouTube URL or video ID…" autocomplete="off" spellcheck="false" />
      <button class="add-btn" id="addBtn">Add</button>
    </div>

    <div class="main">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">Queue</span>
          <span class="sidebar-count" id="countLabel">0 videos</span>
        </div>
        <div class="playlist-list" id="playlistList"></div>
      </aside>

      <div class="player-area" id="playerArea">
        <div class="player-placeholder" id="placeholder">
          <div class="placeholder-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7z" fill="#333"/>
            </svg>
          </div>
          <div class="placeholder-title">Nothing playing</div>
          <div class="placeholder-sub">Add a video and click it to start watching</div>
        </div>
        <div class="now-playing-bar" id="nowPlayingBar" style="display:none">
          <span class="now-playing-label">▶ Now playing</span>
          <span class="now-playing-title" id="nowPlayingTitle">—</span>
          <div class="nav-btns">
            <button class="nav-btn" id="prevBtn" title="Previous">&#8592;</button>
            <button class="nav-btn" id="nextBtn" title="Next">&#8594;</button>
          </div>
        </div>
      </div>
    </div>
  `);

  // ── DOM refs ───────────────────────────────────────────────
  const urlInput      = document.getElementById('urlInput');
  const addBtn        = document.getElementById('addBtn');
  const playlistList  = document.getElementById('playlistList');
  const countLabel    = document.getElementById('countLabel');
  const playerArea    = document.getElementById('playerArea');
  const placeholder   = document.getElementById('placeholder');
  const nowPlayingBar = document.getElementById('nowPlayingBar');
  const nowPlayingTitle = document.getElementById('nowPlayingTitle');
  const prevBtn       = document.getElementById('prevBtn');
  const nextBtn       = document.getElementById('nextBtn');

  // ── Render ─────────────────────────────────────────────────
  function renderSidebar() {
    countLabel.textContent = `${playlist.length} video${playlist.length !== 1 ? 's' : ''}`;

    if (playlist.length === 0) {
      playlistList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎬</div>
          <div class="empty-state-text">Your queue is empty.<br>Paste a YouTube URL above.</div>
        </div>`;
      return;
    }

    playlistList.innerHTML = playlist.map((item, index) => `
      <div class="playlist-item ${index === currentIndex ? 'active' : ''}"
           data-index="${index}">
        <span class="item-index">${index + 1}</span>
        <img class="item-thumb"
             src="${buildThumbnailUrl(item.id)}"
             alt="" loading="lazy"
             onerror="this.style.opacity='0.2'"/>
        <div class="item-info">
          <div class="item-title ${item.title ? '' : 'loading'}">
            ${item.title ? escapeHtml(item.title) : 'Loading…'}
          </div>
          ${item.channel ? `<div class="item-channel">${escapeHtml(item.channel)}</div>` : ''}
        </div>
        <button class="item-delete" data-delete="${index}" title="Remove">✕</button>
      </div>
    `).join('');
  }

  function loadVideoInPlayer(index) {
    currentIndex = index;

    const existingFrame = playerArea.querySelector('.player-frame');
    if (existingFrame) existingFrame.remove();

    const item = playlist[index];

    const frame = document.createElement('iframe');
    frame.className    = 'player-frame';
    frame.src          = buildEmbedUrl(item.id);
    frame.allow        = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    frame.allowFullscreen = true;
    frame.referrerPolicy  = 'no-referrer';

    placeholder.style.display = 'none';
    playerArea.insertBefore(frame, nowPlayingBar);

    nowPlayingBar.style.display = 'flex';
    nowPlayingTitle.textContent = item.title || item.id;

    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= playlist.length - 1;

    renderSidebar();
  }

  function stopPlayer() {
    const existingFrame = playerArea.querySelector('.player-frame');
    if (existingFrame) existingFrame.remove();
    placeholder.style.display = 'flex';
    nowPlayingBar.style.display = 'none';
    currentIndex = -1;
    renderSidebar();
  }

  // ── Add video ──────────────────────────────────────────────
  async function addVideo() {
    const videoId = extractVideoId(urlInput.value);
    if (!videoId) {
      urlInput.classList.add('shake');
      setTimeout(() => urlInput.classList.remove('shake'), 400);
      return;
    }

    urlInput.value = '';

    const newItem = { id: videoId, title: '', channel: '' };
    playlist.push(newItem);
    persist();
    renderSidebar();

    const info = await fetchVideoInfo(videoId);
    newItem.title   = info.title   || videoId;
    newItem.channel = info.channel || '';
    persist();
    renderSidebar();

    // Auto-play if this is the first video
    if (playlist.length === 1) {
      loadVideoInPlayer(0);
    }
  }

  // ── Event listeners ────────────────────────────────────────
  addBtn.addEventListener('click', addVideo);

  urlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') addVideo();
  });

  playlistList.addEventListener('click', (event) => {
    const deleteBtn = event.target.closest('[data-delete]');
    if (deleteBtn) {
      const deleteIndex = parseInt(deleteBtn.dataset.delete, 10);
      playlist.splice(deleteIndex, 1);
      persist();

      if (currentIndex === deleteIndex) {
        stopPlayer();
      } else if (currentIndex > deleteIndex) {
        currentIndex--;
        renderSidebar();
      } else {
        renderSidebar();
      }
      return;
    }

    const playlistItem = event.target.closest('.playlist-item');
    if (playlistItem) {
      const clickedIndex = parseInt(playlistItem.dataset.index, 10);
      loadVideoInPlayer(clickedIndex);
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) loadVideoInPlayer(currentIndex - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < playlist.length - 1) loadVideoInPlayer(currentIndex + 1);
  });

  // ── Init ───────────────────────────────────────────────────
  renderSidebar();
})();
