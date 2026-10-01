/* ============================================
   MangaVerse — Main Javascript Router & Hydrator
   ============================================ */

import { GENRES, HERO_SLIDES, formatNumber, getStatusClass, getGenreName } from './data.js';
import { initSidebar } from './sidebar.js';
import { initSearch, attachPrefetchHover } from './search.js';
import { syncUserAuth, initAuthForms } from './auth.js';
import { initReader } from './reader.js';
import { initAnimations } from './animations.js';
import { getAllDownloadedChapters, deleteOfflineChapter } from './offline-db.js';

// Global User Info
window.currentUser = null;

// Dynamic router on page load
async function initMainApp() {
  // 1. Fetch and Apply Dynamic Site Settings
  await loadSiteSettings();

  // 2. Initialise Core Navigation & Search
  initSidebar();
  initSearch();
  initTheme();
  initToastSystem();
  initAnimations();
  initRandomMangaBtn();
  
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('[PWA] Service Worker registered!', reg);
    }).catch(err => {
      console.error('[PWA] Service Worker failed', err);
    });
  }

  // Sync user state and save to window
  window.currentUser = await syncUserAuth();

  // 2. Page Router
  const path = window.location.pathname;
  
  if (path.endsWith('index.html') || path === '/') {
    initHomepage();
  } else if (path.includes('katalog.html')) {
    initCatalogPage();
  } else if (path.includes('seri-detay.html')) {
    initSeriesDetailPage();
  } else if (path.includes('bolum-oku.html')) {
    initReader();
  } else if (path.includes('giris.html')) {
    initAuthForms();
  } else if (path.includes('profil.html')) {
    initProfilePage();
  }

  console.log('🎌 MangaVerse initialized successfully!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMainApp);
} else {
  initMainApp();
}

// ---- Site Settings Loader ----
async function loadSiteSettings() {
  try {
    const res = await fetch('/api/v1/settings');
    const settings = await res.json();
    window.siteSettings = settings;

    // Apply CSS Variables
    if (settings.theme) {
      const root = document.documentElement;
      if (settings.theme.colorPrimary) root.style.setProperty('--color-primary', settings.theme.colorPrimary);
      if (settings.theme.colorPrimaryHover) root.style.setProperty('--color-primary-light', settings.theme.colorPrimaryHover);
      if (settings.theme.colorPrimaryGlow) root.style.setProperty('--color-primary-glow', settings.theme.colorPrimaryGlow);
      if (settings.theme.fontFamily) root.style.setProperty('--font-family', settings.theme.fontFamily);
    }

    // Render Dynamic Menus
    renderDynamicMenus(settings);

    // Render Announcement Banner
    if (settings.announcement && settings.announcement.active && settings.announcement.text) {
      let existing = document.getElementById('global-announcement');
      if (!existing) {
        existing = document.createElement('div');
        existing.id = 'global-announcement';
        existing.style.padding = '10px 20px';
        existing.style.textAlign = 'center';
        existing.style.fontSize = '13px';
        existing.style.fontWeight = 'bold';
        existing.style.color = '#fff';
        existing.style.position = 'relative';
        existing.style.zIndex = '1001';
        document.body.prepend(existing);
      }
      
      let bg = 'var(--color-primary)';
      if (settings.announcement.type === 'success') bg = 'var(--color-success)';
      if (settings.announcement.type === 'warning') bg = '#f59e0b'; // Tailwind amber
      if (settings.announcement.type === 'danger') bg = 'var(--color-danger)';
      
      existing.style.background = bg;
      existing.innerText = settings.announcement.text;
    } else {
      const existing = document.getElementById('global-announcement');
      if (existing) existing.remove();
    }
  } catch (e) {
    console.error('Failed to load site settings:', e);
  }
}

const iconsMap = {
  home: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  catalog: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  trending: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  star: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  new: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  search: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  library: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  favorites: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
  history: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  menu: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  link: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path></svg>'
};

function renderDynamicMenus(settings) {
  // Render Sidebar Explore Section
  const sidebarNav = document.querySelector('.sidebar-section:first-of-type .sidebar-nav');
  if (sidebarNav && settings.sidebarLinks) {
    const currentUrl = window.location.pathname + window.location.search;
    sidebarNav.innerHTML = settings.sidebarLinks.map(link => {
      const isActive = currentUrl.includes(link.url) || (link.url === 'index.html' && (currentUrl === '/' || currentUrl.includes('index.html')));
      const iconSvg = iconsMap[link.icon] || iconsMap['link'];
      return `
        <a href="${link.url}" class="sidebar-nav-link ${isActive ? 'active' : ''}">
          <div class="sidebar-nav-icon">${iconSvg}</div>
          <span class="sidebar-nav-text">${link.title}</span>
        </a>
      `;
    }).join('');
  }

  // Render Mobile Bottom Nav
  const mobileNav = document.querySelector('.mobile-bottom-nav');
  if (mobileNav && settings.bottomLinks) {
    const currentUrl = window.location.pathname + window.location.search;
    mobileNav.innerHTML = settings.bottomLinks.map(link => {
      const isActive = currentUrl.includes(link.url) || (link.url === 'index.html' && (currentUrl === '/' || currentUrl.includes('index.html')));
      const iconSvg = iconsMap[link.icon] || iconsMap['link'];
      const idAttr = link.customId ? `id="${link.customId}"` : '';
      return `
        <a href="${link.url}" ${idAttr} class="mobile-bottom-link ${isActive ? 'active' : ''}">
          ${iconSvg}
          <span>${link.title}</span>
        </a>
      `;
    }).join('');
  }
}

// ---- Theme Control ----
function initTheme() {
  const current = localStorage.getItem('mv_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', current);

  const btns = document.querySelectorAll('[data-theme-toggle]');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('mv_theme', next);
      window.showToast(next === 'dark' ? '🌙 Koyu tema aktif' : '☀️ Açık tema aktif', 'info');
    });
  });
}

function initRandomMangaBtn() {
  const btn = document.getElementById('btnRandomManga');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/v1/manga/random');
      if (res.ok) {
        const data = await res.json();
        // Redirect to reader since we don't have details page yet
        window.location.href = `bolum-oku.html?slug=${data.slug}&chapter=1`;
      } else {
        window.showToast('Rastgele manga bulunamadı', 'danger');
      }
    } catch(err) {
      window.showToast('Sunucu hatası', 'danger');
    }
  });
}

// ---- Toast Alert System ----
function initToastSystem() {
  window.showToast = (msg, type = 'info', duration = 3000) => {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', danger: '❌', warning: '⚠️', info: 'ℹ️' };

    toast.innerHTML = `
      <span style="font-size:1.1rem; flex-shrink:0;">${icons[type] || '💬'}</span>
      <span style="flex:1; font-size:var(--text-sm); font-weight:var(--font-medium);">${msg}</span>
      <button onclick="this.parentElement.remove()" style="color:var(--color-text-muted); cursor:pointer; font-weight:bold; margin-left:var(--space-2);">✕</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.2s ease reverse forwards';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  };
}

// ============================================
// HOMEPAGE LOADER
// ============================================
async function initHomepage() {
  // Render Hero Slides
  renderHeroSlider();

  // Load updates, AI lists and releases from Server API (Performance)
  try {
    const res = await fetch('/api/v1/manga');
    const mangaList = await res.json();

    renderRecentUpdates(mangaList);
    renderRecommendations(mangaList);
    renderContinueReading(mangaList);
    renderRecommended();
    renderNewReleases(mangaList);
    renderTopTrendGrid(mangaList);
    renderGenreGrid();
  } catch (err) {
    console.error('Failed loading homepage grids:', err);
  }

  // Init Global Chat
  initGlobalChat();
}

// ============================================
// GLOBAL CHAT WIDGET
// ============================================
let chatInterval = null;

function initGlobalChat() {
  const toggleBtn = document.getElementById('mvCommToggleBtn');
  const chatWindow = document.getElementById('mvCommWindow');
  const closeBtn = document.getElementById('mvCommCloseBtn');
  const chatForm = document.getElementById('mvCommForm');
  const chatInput = document.getElementById('mvCommInput');
  const chatMessages = document.getElementById('mvCommMessages');

  if (!toggleBtn || !chatWindow) return;

  toggleBtn.addEventListener('click', () => {
    chatWindow.style.display = 'flex';
    toggleBtn.style.display = 'none';
    loadMessages(chatMessages);
    if (!chatInterval) chatInterval = setInterval(() => loadMessages(chatMessages), 3000);
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.style.display = 'none';
    toggleBtn.style.display = 'flex';
    if (chatInterval) {
      clearInterval(chatInterval);
      chatInterval = null;
    }
  });

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    
    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (res.ok) {
        chatInput.value = '';
        loadMessages(chatMessages);
      } else {
        window.showToast(data.error || 'Mesaj gönderilemedi', 'warning');
      }
    } catch (err) {
      window.showToast('Giriş yapmanız gerekiyor', 'warning');
    }
  });
}

async function loadMessages(container) {
  try {
    const res = await fetch('/api/v1/chat');
    const messages = await res.json();
    
    const wasScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 10;
    
    container.innerHTML = messages.map(m => `
      <div class="chat-message">
        ${m.guildName ? `<span class="chat-msg-guild">[${m.guildName}]</span>` : ''}
        <span class="chat-msg-user ${m.role === 'admin' ? 'admin' : ''}">${m.username}:</span>
        <span style="color:#e2e8f0;">${m.text}</span>
      </div>
    `).join('');
    
    if (wasScrolledToBottom) {
      container.scrollTop = container.scrollHeight;
    }
  } catch (err) {}
}

function renderHeroSlider() {
  const wrapper = document.getElementById('heroSwiperWrapper');
  if (!wrapper) return;

  wrapper.innerHTML = HERO_SLIDES.map((slide, idx) => `
    <div class="swiper-slide hero-slide" style="background: ${slide.coverGradient}; ${idx === 0 ? 'display:block;' : 'display:none;'}">
      <div class="container hero-slide-inner">
        <div class="hero-slide-info">
          <div class="hero-slide-genres">
            ${slide.genres.map(g => `<span class="badge badge-primary">${g}</span>`).join('')}
          </div>
          <h2 class="hero-slide-title">${slide.title}</h2>
          <div class="hero-slide-meta" style="display:flex; gap:var(--space-4); margin-bottom:var(--space-3); color:var(--color-text-secondary); font-size:var(--text-sm);">
            <span>⭐ ${slide.rating} / 10</span>
            <span>📖 ${slide.chapters} Bölüm</span>
            <span>👤 ${slide.author}</span>
          </div>
          <p class="hero-slide-desc" style="color:var(--color-text-secondary); margin-bottom:var(--space-6); font-size:var(--text-sm); line-height:var(--leading-normal); max-width:550px;">
            ${slide.description}
          </p>
          <div style="display:flex; gap:var(--space-3);">
            <a href="bolum-oku.html?slug=${slide.slug}&chapter=1" class="btn btn-primary btn-lg">Şimdi Oku</a>
            <a href="seri-detay.html?slug=${slide.slug}" class="btn btn-ghost btn-lg">Seri Detayı</a>
          </div>
        </div>
        <div class="hero-slide-cover" style="flex-shrink:0; display:flex; align-items:center; justify-content:center;">
          <img src="${slide.cover}" alt="${slide.title}" style="width:200px; aspect-ratio:2/3; object-fit:cover; border-radius:var(--radius-lg); box-shadow:var(--shadow-lg);" loading="lazy" decoding="async">
        </div>
      </div>
    </div>
  `).join('');

  // Simple carousel interval logic for performance
  let activeIndex = 0;
  const slides = wrapper.querySelectorAll('.hero-slide');
  if (slides.length <= 1) return;

  setInterval(() => {
    slides[activeIndex].style.display = 'none';
    activeIndex = (activeIndex + 1) % slides.length;
    slides[activeIndex].style.display = 'block';
  }, 6000);
}

async function renderContinueReading(mangaList) {
  const section = document.getElementById('continueSection');
  const grid = document.getElementById('continueGrid');
  if (!section || !grid || !window.currentUser) return;

  try {
    const res = await fetch('/api/v1/progress/recent');
    const data = await res.json();
    
    if (data.recent) {
      section.style.display = 'block';
      const r = data.recent;
      grid.innerHTML = `
        <div style="position:absolute; inset:0; z-index:0;">
          <img src="${r.cover}" style="width:100%; height:100%; object-fit:cover; filter:blur(20px) brightness(0.3); transform:scale(1.1);">
          <div style="position:absolute; inset:0; background:linear-gradient(90deg, rgba(15,15,20,1) 0%, rgba(15,15,20,0.8) 50%, transparent 100%);"></div>
        </div>
        <div style="position:relative; z-index:1; padding:var(--space-6) var(--space-8); display:flex; align-items:center; gap:var(--space-6); min-height:180px;">
          <img src="${r.cover}" style="width:100px; height:140px; border-radius:var(--radius-md); object-fit:cover; box-shadow:var(--shadow-lg);">
          <div style="flex:1;">
            <span style="display:inline-block; font-size:0.75rem; font-weight:700; color:var(--color-primary); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Kaldığın Yerden Devam Et</span>
            <h3 style="font-size:1.5rem; font-weight:800; margin-bottom:8px;">${r.mangaTitle}</h3>
            <p style="color:var(--color-text-secondary); font-size:0.9rem; margin-bottom:16px;">Bölüm ${r.chapter} ${r.page ? '(Sayfa ' + r.page + ')' : ''}</p>
            <a href="bolum-oku.html?slug=${r.slug}&chapter=${r.chapter}" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:8px;">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Okumaya Devam Et
            </a>
          </div>
        </div>
      `;
    } else {
      section.style.display = 'none';
    }
  } catch (e) {
    console.error('Failed to render continue reading:', e);
  }
}

function renderRecentUpdates(list) {
  const container = document.getElementById('recentUpdatesGrid');
  if (!container) return;

  const updates = list.slice(0, 8);
  container.innerHTML = updates.map(m => `
    <div class="manga-card" data-slug="${m.slug}">
      <div class="manga-card-cover">
        <img src="${m.cover}" alt="${m.title}" loading="lazy" onerror="this.src='https://cdn.myanimelist.net/images/manga/3/222295.jpg'" decoding="async">
        <div class="manga-card-cover-overlay"></div>
        <span class="manga-card-status badge ${getStatusClass(m.status)}">${m.statusLabel}</span>
      </div>
      <div class="manga-card-body">
        <h3 class="manga-card-title">${m.title}</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
          <span class="manga-card-chapter">Bölüm ${m.lastChapter}</span>
          <span style="font-size:10px; color:var(--color-text-muted);">Güncellendi</span>
        </div>
        <div class="manga-card-rating" style="margin-top:var(--space-2);">★ ${m.rating}</div>
      </div>
    </div>
  `).join('');
}

function renderRecommendations(list) {
  const container = document.getElementById('recGrid');
  if (!container) return;

  const reasons = [
    'Aksiyon sevenler beğendi',
    'Okuma geçmişine uygun',
    'AI haftalık önerisi',
    'Yüksek dereceli seri'
  ];

  const recs = list.slice(4, 8);
  container.innerHTML = recs.map((m, idx) => `
    <a href="seri-detay.html?slug=${m.slug}" class="rec-card" data-slug="${m.slug}">
      <div class="rec-card-cover">
        <img src="${m.cover}" alt="${m.title}" loading="lazy" decoding="async">
      </div>
      <div class="rec-card-info">
        <h4 class="rec-card-title">${m.title}</h4>
        <span class="rec-card-why">✨ ${reasons[idx % reasons.length]}</span>
        <p class="rec-card-desc">${m.description}</p>
      </div>
    </a>
  `).join('');
}


async function renderRecommended() {
  const container = document.getElementById('recommendedGrid');
  const section = document.getElementById('recommendedSection');
  if (!container || !section) return;

  try {
    const res = await fetch('/api/v1/manga/recommended');
    const data = await res.json();
    
    if (!data || data.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    
    container.innerHTML = data.slice(0, 6).map(m => `
      <a href="seri-detay.html?slug=${m.slug}" class="manga-card" data-slug="${m.slug}">
        <div class="manga-card-cover">
          ${m.matchPct ? `<div class="match-badge">Sana %${m.matchPct} Uygun</div>` : ''}
          <img src="${m.cover}" alt="${m.title}" loading="lazy" decoding="async">
          <div class="manga-card-overlay">
            <h3 class="manga-card-title">${m.title}</h3>
            <div class="manga-card-meta">
              <span>Bölüm ${m.chapters}</span>
              <span>⭐ ${m.rating}</span>
            </div>
          </div>
        </div>
      </a>
    `).join('');
  } catch (err) {
    section.style.display = 'none';
  }
}

function renderNewReleases(list) {
  const container = document.getElementById('newReleasesGrid');
  if (!container) return;

  const releases = list.filter(m => m.isNew).slice(0, 8);
  container.innerHTML = releases.map(m => `
    <div class="manga-card" data-slug="${m.slug}">
      <div class="manga-card-cover">
        <img src="${m.cover}" alt="${m.title}" loading="lazy" decoding="async">
        <div class="manga-card-cover-overlay"></div>
        <span class="manga-card-status badge badge-new">YENİ</span>
      </div>
      <div class="manga-card-body">
        <h3 class="manga-card-title">${m.title}</h3>
        <span class="manga-card-chapter">Bölüm ${m.lastChapter}</span>
        <div class="manga-card-rating">★ ${m.rating}</div>
      </div>
    </div>
  `).join('');
}

function renderTopTrendGrid(list) {
  const container = document.getElementById('trendGrid');
  if (!container) return;

  const trending = list.filter(m => m.trending).slice(0, 10);
  container.innerHTML = trending.map((m, i) => `
    <a href="seri-detay.html?slug=${m.slug}" class="trend-card" data-slug="${m.slug}">
      <div class="trend-card-rank">
        <span class="rank-badge ${i < 3 ? `rank-badge-${i+1}` : 'rank-badge-n'}">${i + 1}</span>
      </div>
      <div class="trend-card-cover">
        <img src="${m.cover}" alt="${m.title}" loading="lazy" decoding="async">
      </div>
      <div class="trend-card-info">
        <h4 class="trend-card-title">${m.title}</h4>
        <div class="trend-card-meta">
          <span>📖 ${m.chapters} Bl.</span>
          <span>⭐ ${m.rating}</span>
        </div>
      </div>
      <div class="trend-card-right">
        <span class="badge ${getStatusClass(m.status)}">${m.statusLabel}</span>
      </div>
    </a>
  `).join('');
}

function renderGenreGrid() {
  const container = document.getElementById('genreGrid');
  if (!container) return;

  container.innerHTML = GENRES.slice(0, 12).map(g => `
    <a href="katalog.html?genre=${g.id}" class="genre-card" style="
      display:flex;
      align-items:center;
      gap:var(--space-3);
      background:var(--color-card);
      border:1px solid var(--color-border);
      border-left: 3px solid ${g.color};
      padding:var(--space-3) var(--space-4);
      border-radius:var(--radius-md);
      transition:all 0.22s ease;
      text-decoration:none;
      overflow:hidden;
    ">
      <div style="
        width:36px; height:36px; min-width:36px;
        border-radius:var(--radius-sm);
        background:${g.color}20;
        display:flex; align-items:center; justify-content:center;
        font-size:1.1rem;
        flex-shrink:0;
      ">${g.icon}</div>
      <span style="
        font-size:var(--text-sm);
        font-weight:var(--font-semi);
        color:var(--color-text);
        flex:1;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      ">${g.name}</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--color-text-muted);flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
    </a>
  `).join('');

  // Hover effect
  container.querySelectorAll('.genre-card').forEach(c => {
    c.addEventListener('mouseenter', () => {
      c.style.transform = 'translateY(-2px)';
      c.style.borderColor = c.style.borderLeftColor || 'rgba(139,92,246,0.4)';
      c.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
    });
    c.addEventListener('mouseleave', () => {
      c.style.transform = 'translateY(0)';
      c.style.borderColor = '';
      c.style.boxShadow = '';
    });
  });
}


// ============================================
// CATALOG PAGE LOADER
// ============================================
function initCatalogPage() {
  const genreSelect = document.getElementById('filterGenre');
  const statusSelect = document.getElementById('filterStatus');
  const sortContainer = document.getElementById('sortBtns');
  const resultsGrid = document.getElementById('catalogGrid');
  const countEl = document.getElementById('resultCount');
  
  if (!resultsGrid) return;

  let filterGenre = new URLSearchParams(window.location.search).get('genre') || '';
  let filterStatus = new URLSearchParams(window.location.search).get('status') || '';
  let activeSort = new URLSearchParams(window.location.search).get('sort') || 'popular';
  let searchQuery = new URLSearchParams(window.location.search).get('q') || '';

  // ---- Update page title/breadcrumb based on URL params ----
  const heroTitle = document.getElementById('catalogHeroTitle');
  const heroSub   = document.getElementById('catalogHeroSub');
  const breadcrumbCurrent = document.getElementById('catalogBreadcrumb');

  // Genre info lookup
  const genreInfo = GENRES.find(g => g.id === filterGenre);

  // Sort label lookup
  const sortLabels = {
    trending: { label: '🔥 Trendler', sub: 'Bu hafta en çok okunan seriler' },
    popular:  { label: '📈 Popüler',   sub: 'Tüm zamanların en çok okunanları' },
    rating:   { label: '⭐ En Yüksek Puan', sub: 'Okuyucuların en çok beğendikleri' },
    new:      { label: '🆕 Yeni Eklenenler', sub: 'Platforma yeni eklenen seriler' },
    updated:  { label: '🕐 Son Güncellemeler', sub: 'En son güncellenen seriler' },
  };

  if (genreInfo && heroTitle) {
    // Genre page — feels like a dedicated destination
    const title = `${genreInfo.icon} ${genreInfo.name} Seriler`;
    if (heroTitle) heroTitle.textContent = title;
    if (heroSub)   heroSub.textContent = `${genreInfo.name} türündeki tüm manga, webtoon ve manhwa serileri`;
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = genreInfo.name;
    document.title = `${genreInfo.name} Seriler — MangaVerse`;
  } else if (sortLabels[activeSort] && heroTitle) {
    if (heroTitle) heroTitle.textContent = sortLabels[activeSort].label;
    if (heroSub)   heroSub.textContent   = sortLabels[activeSort].sub;
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = sortLabels[activeSort].label.replace(/[^a-zA-ZığüşöçİĞÜŞÖÇ ]/g, '').trim();
    document.title = `${sortLabels[activeSort].label} — MangaVerse`;
  } else {
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Katalog';
  }

  // Highlight active sidebar genre link
  if (filterGenre) {
    document.querySelectorAll('.sidebar-cat-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      link.classList.toggle('active', href.includes(`genre=${filterGenre}`));
      if (href.includes(`genre=${filterGenre}`)) {
        link.style.color = 'var(--color-primary-light)';
        link.style.background = 'var(--color-primary-glow)';
        link.style.borderRadius = 'var(--radius-sm)';
      }
    });
  }

  // Select current genre/sort in dropdowns
  if (genreSelect && filterGenre) genreSelect.value = filterGenre;
  if (sortContainer) {
    const btns = sortContainer.querySelectorAll('.filter-sort-btn');
    btns.forEach(btn => btn.classList.toggle('active', btn.dataset.sort === activeSort));
  }

  // Hydrate genre dropdown if only has default option
  if (genreSelect && genreSelect.options.length <= 1) {
    genreSelect.innerHTML = '<option value="">Tüm Türler</option>' + GENRES.map(g => `<option value="${g.id}">${g.icon} ${g.name}</option>`).join('');
    genreSelect.value = filterGenre;
  }

  const fetchCatalogData = async () => {
    try {
      resultsGrid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:var(--space-12); color:var(--color-text-muted);">
          <div style="font-size:2rem; margin-bottom:var(--space-3); animation:spin 1s linear infinite; display:inline-block;">⟳</div>
          <div>Yükleniyor...</div>
        </div>
      `;

      let queryStr = `/api/v1/manga?sort=${activeSort}`;
      if (filterGenre) queryStr += `&genre=${filterGenre}`;
      if (filterStatus) queryStr += `&status=${filterStatus}`;
      if (searchQuery) queryStr += `&q=${encodeURIComponent(searchQuery)}`;

      const response = await fetch(queryStr);
      const matches = await response.json();

      if (countEl) countEl.innerText = `${matches.length} seri bulundu`;
      
      if (matches.length === 0) {
        resultsGrid.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding:var(--space-12); color:var(--color-text-muted);">
            <div style="font-size:3rem;margin-bottom:var(--space-4);">🔍</div>
            Aradığınız kriterlere uygun seri bulunamadı.
          </div>
        `;
        return;
      }

      resultsGrid.innerHTML = matches.map(m => `
        <a href="seri-detay.html?slug=${m.slug}" class="manga-card" data-slug="${m.slug}">
          <div class="manga-card-cover">
            <img src="${m.cover}" alt="${m.title}" loading="lazy" decoding="async">
            <div class="manga-card-cover-overlay"></div>
            <span class="manga-card-status badge ${getStatusClass(m.status)}">${m.statusLabel}</span>
          </div>
          <div class="manga-card-body">
            <h3 class="manga-card-title">${m.title}</h3>
            <span class="manga-card-chapter">Bölüm ${m.lastChapter}</span>
            <div class="manga-card-rating">★ ${m.rating}</div>
          </div>
        </a>
      `).join('');

      attachPrefetchHover(resultsGrid.querySelectorAll('.manga-card'));



    } catch (err) {
      resultsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--color-danger)">İçerik yüklenemedi.</div>';
    }
  };

  // Bind change handlers
  genreSelect?.addEventListener('change', () => {
    filterGenre = genreSelect.value;
    fetchCatalogData();
  });
  statusSelect?.addEventListener('change', () => {
    filterStatus = statusSelect.value;
    fetchCatalogData();
  });

  // Bind sort buttons
  if (sortContainer) {
    const btns = sortContainer.querySelectorAll('.filter-sort-btn');
    btns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sort === activeSort);
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSort = btn.dataset.sort;
        fetchCatalogData();
      });
    });
  }

  fetchCatalogData();
}

// ============================================
// SERIES DETAIL PAGE LOADER
// ============================================
async function initSeriesDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    window.location.href = 'index.html';
    return;
  }

  try {
    let manga;
    // Check hover prefetch cache first for instant loads!
    if (window.mangaPrefetchCache.has(slug) && window.mangaPrefetchCache.get(slug) !== 'loading') {
      manga = window.mangaPrefetchCache.get(slug);
      console.log(`🚀 Instant load series details from memory cache: ${slug}`);
    } else {
      const res = await fetch(`/api/v1/manga/${slug}`);
      if (!res.ok) throw new Error('Series not found');
      manga = await res.json();
    }

    // Populate metadata fields
    document.getElementById('seriesTitle').innerText = manga.title;
    document.getElementById('seriesAltTitle').innerText = manga.altTitle || '';
    document.getElementById('seriesAuthor').innerText = manga.author;
    document.getElementById('seriesArtist').innerText = manga.artist || 'Bilinmiyor';
    document.getElementById('seriesYear').innerText = manga.year;
    document.getElementById('seriesRating').innerText = manga.rating;
    document.getElementById('seriesViews').innerText = formatNumber(manga.views);
    document.getElementById('seriesFollows').innerText = formatNumber(manga.follows);
    document.getElementById('seriesDescription').innerText = manga.description;
    
    const coverImg = document.getElementById('seriesCoverImg');
    if (coverImg) coverImg.src = manga.cover;

    const bgCoverImg = document.getElementById('seriesBgCoverImg');
    if (bgCoverImg) bgCoverImg.src = manga.cover;

    // Genres badges
    const genreWrap = document.getElementById('seriesGenres');
    if (genreWrap) {
      genreWrap.innerHTML = manga.genres.map(g => `<a href="katalog.html?genre=${g}" class="badge badge-primary">${getGenreName(g)}</a>`).join('');
    }

    // Status badge
    const statusWrap = document.getElementById('seriesStatusWrap');
    if (statusWrap) {
      statusWrap.innerHTML = `<span class="badge ${getStatusClass(manga.status)}">${manga.statusLabel}</span>`;
    }

    // Populate Chapter List
    renderChapterList(manga);

    // Initialise Library buttons state
    initLibraryState(slug);

    // Initialise Chapter Comments (Default chapter 1)
    initCommentsSection(slug, 1);

  } catch (err) {
    console.error('Error loading details page:', err);
    window.showToast('Seri bilgileri alınamadı', 'danger');
  }
}

function renderChapterList(manga) {
  const container = document.getElementById('chapterListContainer');
  if (!container) return;

  // Retrieve read list progress maps
  const progressMap = JSON.parse(localStorage.getItem('mv_reading_progress') || '{}');
  const hasRead = progressMap[manga.slug];

  container.innerHTML = Array.from({ length: manga.chapters }, (_, idx) => {
    const chNum = manga.chapters - idx; // Newest first
    const isRead = hasRead && hasRead.chapter >= chNum;

    return `
      <a href="bolum-oku.html?slug=${manga.slug}&chapter=${chNum}" class="chapter-item ${isRead ? 'read' : ''}" style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-3) var(--space-4); border-bottom:1px solid var(--color-border); text-decoration:none; color:inherit;">
        <span class="chapter-num" style="color:var(--color-primary-light); font-weight:var(--font-bold); font-family:var(--font-mono)">Bölüm ${chNum}</span>
        <span class="chapter-title-text" style="flex:1; margin-left:var(--space-4); font-size:var(--text-sm);">${manga.title} Bölüm ${chNum} Oku</span>
        <div style="display:flex; align-items:center; gap:var(--space-2);">
          ${chNum === manga.chapters ? '<span class="badge badge-new">Yeni</span>' : ''}
          ${isRead ? '<span style="font-size:10px; color:var(--color-success)">✓ Okundu</span>' : ''}
        </div>
      </a>
    `;
  }).join('');
}

// User Shelf / Library bindings
async function initLibraryState(slug) {
  const addLibBtn = document.getElementById('addLibraryBtn');
  const addFavBtn = document.getElementById('addFavBtn');
  if (!addLibBtn || !addFavBtn) return;

  const res = await fetch('/api/v1/auth/me');
  const session = await res.ok ? await res.json() : { loggedIn: false };

  if (session.loggedIn) {
    // Sync UI states based on lists
    const inLib = session.user.library && session.user.library.includes(slug);
    const inFav = session.user.favorites && session.user.favorites.includes(slug);

    updateButtonState(addLibBtn, inLib, '📚 Kütüphanede', '📚 Kütüphaneye Ekle');
    updateButtonState(addFavBtn, inFav, '❤️ Favorilerde', '❤️ Favorile');
  }

  // Toggles bindings
  addLibBtn.onclick = async () => {
    const active = await toggleLibraryAPI(slug, 'library');
    if (active !== null) {
      updateButtonState(addLibBtn, active, '📚 Kütüphanede', '📚 Kütüphaneye Ekle');
      window.showToast(active ? '📚 Kütüphaneye eklendi' : 'Kütüphaneden çıkarıldı', 'success');
    }
  };

  addFavBtn.onclick = async () => {
    const active = await toggleLibraryAPI(slug, 'favorites');
    if (active !== null) {
      updateButtonState(addFavBtn, active, '❤️ Favorilerde', '❤️ Favorile');
      window.showToast(active ? '❤️ Favorilere eklendi' : 'Favorilerden çıkarıldı', 'success');
      
      // Request notification permission & Simulate Notification
      if (active && 'Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification('MangaVerse Bilgilendirme', {
                body: 'Harika! Bu seriye yeni bölüm eklendiğinde size anında bildirim göndereceğiz.',
                icon: '/images/icon-192.png',
                badge: '/images/icon-192.png',
                vibrate: [100, 50, 100]
              });
            });
          }
        });
      }
    }
  };
}

function updateButtonState(btn, active, activeText, inactiveText) {
  if (active) {
    btn.innerText = activeText;
    btn.classList.remove('btn-ghost');
    btn.classList.add('btn-primary');
  } else {
    btn.innerText = inactiveText;
    btn.classList.add('btn-ghost');
    btn.classList.remove('btn-primary');
  }
}

async function toggleLibraryAPI(slug, listType) {
  try {
    const res = await fetch('/api/v1/library/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, listType })
    });
    const data = await res.json();
    if (res.ok) return data.active;
    
    window.showToast(data.error || 'İşlem başarısız', 'warning');
    return null;
  } catch (err) {
    window.showToast('Lütfen önce giriş yapın!', 'warning');
    return null;
  }
}

// Chapter Comments hydrator
async function initCommentsSection(slug, chapter) {
  const container = document.getElementById('commentsContainer');
  const countEl = document.getElementById('commentCountText');
  const form = document.getElementById('commentForm');
  if (!container) return;

  // We need to inject a spoiler checkbox to the existing HTML if it doesn't have one
  if (form && !document.getElementById('isSpoilerCheck')) {
    const txtArea = document.getElementById('commentText');
    const spoilerLabel = document.createElement('label');
    spoilerLabel.style.display = 'flex';
    spoilerLabel.style.alignItems = 'center';
    spoilerLabel.style.gap = '8px';
    spoilerLabel.style.fontSize = '12px';
    spoilerLabel.style.color = 'var(--color-text-muted)';
    spoilerLabel.style.marginBottom = 'var(--space-2)';
    spoilerLabel.innerHTML = `<input type="checkbox" id="isSpoilerCheck"> Bu yorum sürprizbozan (spoiler) içerir`;
    txtArea.parentNode.insertBefore(spoilerLabel, txtArea.nextSibling);
  }

  const renderCommentThread = (allComments, parentId = null, depth = 0) => {
    const children = allComments.filter(c => c.parentId === parentId);
    if (children.length === 0) return '';
    
    return children.map(c => {
      const upvotes = c.upvotes?.length || 0;
      const downvotes = c.downvotes?.length || 0;
      const score = upvotes - downvotes;
      
      const spoilerStyle = c.isSpoiler ? 'filter: blur(5px); cursor: pointer; transition: filter 0.3s;' : '';
      const spoilerText = c.isSpoiler ? '<div style="font-size:10px; color:var(--color-warning); margin-bottom:4px;">🚨 Sürprizbozan! Görmek için tıklayın.</div>' : '';

      return `
        <div class="comment-card" style="padding:var(--space-3); border-left: ${depth > 0 ? '2px solid var(--color-border)' : '1px solid var(--color-border)'}; border-top: ${depth === 0 ? '1px solid var(--color-border)' : 'none'}; border-right: ${depth === 0 ? '1px solid var(--color-border)' : 'none'}; border-bottom: ${depth === 0 ? '1px solid var(--color-border)' : 'none'}; border-radius:${depth === 0 ? 'var(--radius-md)' : '0'}; background: ${depth === 0 ? 'var(--color-card)' : 'transparent'}; margin-bottom:${depth === 0 ? 'var(--space-3)' : '0'}; margin-left:${depth > 0 ? 'var(--space-4)' : '0'}; margin-top:${depth > 0 ? 'var(--space-2)' : '0'};">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2);">
            <div style="display:flex; align-items:center; gap:var(--space-2);">
              <span style="font-size:var(--text-sm); font-weight:var(--font-bold); color:var(--color-primary-light);">${c.username}</span>
              <span style="font-size:10px; color:var(--color-text-muted);">${new Date(c.timestamp).toLocaleDateString('tr-TR')}</span>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="vote-comment-btn" data-id="${c.id}" data-type="upvote" style="font-size:11px; display:flex; align-items:center; gap:4px; color:var(--color-text-secondary); cursor:pointer;">
                ▲ <span>${upvotes}</span>
              </button>
              <button class="vote-comment-btn" data-id="${c.id}" data-type="downvote" style="font-size:11px; display:flex; align-items:center; gap:4px; color:var(--color-text-secondary); cursor:pointer;">
                ▼ <span>${downvotes}</span>
              </button>
            </div>
          </div>
          ${spoilerText}
          <p class="comment-text" style="font-size:var(--text-sm); color:var(--color-text); line-height:var(--leading-normal); ${spoilerStyle}" ${c.isSpoiler ? 'onclick="this.style.filter=\\\'none\\\'"' : ''}>${c.text}</p>
          <div style="margin-top:var(--space-2);">
            <button class="reply-comment-btn" data-id="${c.id}" style="font-size:11px; color:var(--color-primary); cursor:pointer;">Cevapla</button>
            <div class="reply-form-container" id="reply-container-${c.id}" style="display:none; margin-top:var(--space-2); margin-bottom:var(--space-2);">
              <textarea id="reply-text-${c.id}" class="form-input" style="min-height:50px; font-size:12px;" placeholder="Cevabınızı yazın..."></textarea>
              <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px;">
                <button class="btn btn-ghost btn-sm cancel-reply-btn" data-id="${c.id}" style="font-size:10px; padding:4px 8px;">İptal</button>
                <button class="btn btn-primary btn-sm submit-reply-btn" data-id="${c.id}" style="font-size:10px; padding:4px 8px;">Gönder</button>
              </div>
            </div>
          </div>
          ${renderCommentThread(allComments, c.id, depth + 1)}
        </div>
      `;
    }).join('');
  };

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/v1/comments/${slug}/${chapter}`);
      const comments = await res.json();
      
      countEl.innerText = `${comments.length} Yorum`;

      if (comments.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:var(--space-6); color:var(--color-text-muted); font-size:var(--text-sm)">
            Henüz yorum yapılmamış. İlk yorumu sen yap!
          </div>
        `;
        return;
      }

      container.innerHTML = renderCommentThread(comments, null, 0);

      // Voting bindings
      container.querySelectorAll('.vote-comment-btn').forEach(btn => {
        btn.onclick = async () => {
          try {
            const res = await fetch(`/api/v1/comments/vote/${btn.dataset.id}`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ voteType: btn.dataset.type })
            });
            if (res.ok) {
              loadComments();
            } else {
              window.showToast('Oy vermek için giriş yapmalısınız', 'warning');
            }
          } catch (err) {}
        };
      });

      // Reply Bindings
      container.querySelectorAll('.reply-comment-btn').forEach(btn => {
        btn.onclick = () => {
          document.getElementById(`reply-container-${btn.dataset.id}`).style.display = 'block';
        };
      });
      container.querySelectorAll('.cancel-reply-btn').forEach(btn => {
        btn.onclick = () => {
          document.getElementById(`reply-container-${btn.dataset.id}`).style.display = 'none';
        };
      });
      container.querySelectorAll('.submit-reply-btn').forEach(btn => {
        btn.onclick = async () => {
          const txt = document.getElementById(`reply-text-${btn.dataset.id}`).value.trim();
          if (!txt) return;
          try {
            const res = await fetch(`/api/v1/comments/${slug}/${chapter}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: txt, parentId: btn.dataset.id, isSpoiler: false })
            });
            if (res.ok) {
              window.showToast('✅ Yanıt eklendi!', 'success');
              loadComments();
            } else {
              window.showToast('Yanıt gönderilemedi', 'warning');
            }
          } catch (e) {}
        };
      });

    } catch (err) {
      console.error(err);
    }
  };

  // Submit new Top-Level comment
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const txt = document.getElementById('commentText').value.trim();
      const spoilerCb = document.getElementById('isSpoilerCheck');
      const isSpoiler = spoilerCb ? spoilerCb.checked : false;
      if (!txt) return;

      try {
        const res = await fetch(`/api/v1/comments/${slug}/${chapter}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: txt, parentId: null, isSpoiler })
        });
        if (res.ok) {
          document.getElementById('commentText').value = '';
          if(spoilerCb) spoilerCb.checked = false;
          window.showToast('✅ Yorumunuz eklendi!', 'success');
          loadComments();
        } else {
          const err = await res.json();
          window.showToast(err.error || 'Yorum gönderilemedi', 'warning');
        }
      } catch (e) {
        window.showToast('Bağlantı hatası', 'danger');
      }
    };
  }

  loadComments();
}

// ============================================
// PROFILE PAGE LOADER
// ============================================
async function initProfilePage() {
  const nameEl = document.getElementById('profName');
  if (!nameEl) return;

  // Retrieve details
  const res = await fetch('/api/v1/auth/me');
  const session = await res.json();

  if (!session.loggedIn) {
    window.location.href = 'giris.html';
    return;
  }

  const user = session.user;
  document.getElementById('profName').innerText = user.username;
  document.getElementById('profMail').innerText = user.email;
  document.getElementById('profDate').innerText = `${new Date(user.joined).toLocaleDateString('tr-TR')} tarihinde katıldı`;
  document.getElementById('profAvatarInitials').innerText = user.username.slice(0,2).toUpperCase();

  // Gamification Updates
  if (user.title) document.getElementById('profTitleBadge').innerText = user.title;
  if (user.level) document.getElementById('profLevelBadge').innerText = `SV ${user.level}`;
  
  if (user.xp !== undefined && user.nextLevelXp) {
    document.getElementById('profXpLabel').innerText = `${user.xp} XP`;
    document.getElementById('profNextXpLabel').innerText = `Sonraki: ${user.nextLevelXp} XP`;
    
    // Calculate percentage for progress bar (between previous level XP and next level XP)
    const currentLevel = user.level || 1;
    const prevLevelXp = currentLevel > 1 ? Math.pow(currentLevel - 1, 2) * 10 : 0;
    const levelRange = user.nextLevelXp - prevLevelXp;
    const currentProgress = user.xp - prevLevelXp;
    const pct = Math.min(100, Math.max(0, (currentProgress / levelRange) * 100));
    
    setTimeout(() => {
      document.getElementById('profXpBar').style.width = `${pct}%`;
    }, 300);
  }

  // Populate dynamic profile tables (library cards)
  const tabLib = document.getElementById('tabProfileLibrary');
  const tabAch = document.getElementById('tabProfileAchievements');

  const renderProfileLibrary = async () => {
    try {
      const response = await fetch('/api/v1/manga');
      const allManga = await response.json();
      
      const renderGrid = (slugList) => {
        const filtered = allManga.filter(m => slugList.includes(m.slug));
        if (filtered.length === 0) {
          return `<div style="text-align:center; padding:var(--space-12); color:var(--color-text-muted);">Bu listede henüz manga bulunmuyor.</div>`;
        }
        return `
          <div class="manga-grid">
            ${filtered.map(m => `
              <a href="seri-detay.html?slug=${m.slug}" class="manga-card">
                <div class="manga-card-cover">
                  <img src="${m.cover}" alt="${m.title}" loading="lazy" decoding="async">
                  <div class="manga-card-cover-overlay"></div>
                </div>
                <div class="manga-card-body">
                  <h3 class="manga-card-title">${m.title}</h3>
                  <span class="manga-card-chapter">${m.chapters} Bölüm</span>
                  <span class="manga-card-rating">★ ${m.rating}</span>
                </div>
              </a>
            `).join('')}
          </div>
        `;
      };

      const lists = user.reading_lists || { reading: [], completed: [], dropped: [], plan_to_read: [] };
      
      tabLib.innerHTML = `
        <div class="sub-tabs" style="display:flex; gap:10px; margin-bottom:20px; overflow-x:auto;">
          <button class="btn btn-primary btn-sm sub-tab-btn active" data-list="reading">Okunuyor (${lists.reading?.length || 0})</button>
          <button class="btn btn-ghost btn-sm sub-tab-btn" data-list="plan_to_read">Okunacaklar (${lists.plan_to_read?.length || 0})</button>
          <button class="btn btn-ghost btn-sm sub-tab-btn" data-list="completed">Tamamlandı (${lists.completed?.length || 0})</button>
          <button class="btn btn-ghost btn-sm sub-tab-btn" data-list="dropped">Bırakıldı (${lists.dropped?.length || 0})</button>
          <button class="btn btn-ghost btn-sm sub-tab-btn" data-list="library">Tüm Kütüphane (${user.library?.length || 0})</button>
        </div>
        <div id="subTabContent">
          ${renderGrid(lists.reading || [])}
        </div>
      `;

      // Event listeners for sub tabs
      const btns = tabLib.querySelectorAll('.sub-tab-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          btns.forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-ghost'); });
          e.target.classList.remove('btn-ghost');
          e.target.classList.add('btn-primary');
          
          const targetList = e.target.dataset.list;
          const content = document.getElementById('subTabContent');
          if (targetList === 'library') content.innerHTML = renderGrid(user.library || []);
          else content.innerHTML = renderGrid(lists[targetList] || []);
        });
      });
    } catch (err) {}
  };

  // Achievements loader
  const renderAchievements = () => {
    const s = user.stats || { commentCount: 0, readCount: 0 };
    const libraryCount = user.library?.length || 0;
    const completedCount = user.reading_lists?.completed?.length || 0;

    const list = [
      { name: 'İlk Adım', icon: '📖', desc: 'İlk manga bölümünü oku', unlocked: s.readCount > 0 },
      { name: 'Manga Kurdu', icon: '🐛', desc: '10 seri tamamla', unlocked: completedCount >= 10 },
      { name: 'Koleksiyoner', icon: '🗂️', desc: '5 seri favorilere ekle', unlocked: libraryCount >= 5 },
      { name: 'Sosyal Kelebek', icon: '💬', desc: 'İlk yorumunu yap', unlocked: s.commentCount >= 1 },
      { name: 'Fikir Lideri', icon: '🎙️', desc: '50 yorum yap', unlocked: s.commentCount >= 50 }
    ];

    tabAch.innerHTML = `
      <div class="genre-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:var(--space-4);">
        ${list.map(a => `
          <div class="glass-panel ${a.unlocked ? '' : 'locked'}" style="padding:var(--space-4); text-align:center; display:flex; flex-direction:column; align-items:center; gap:var(--space-2); opacity: ${a.unlocked ? 1 : 0.45};">
            <span style="font-size:2.2rem; filter: ${a.unlocked ? 'none' : 'grayscale(1)'}">${a.icon}</span>
            <div style="font-size:var(--text-sm); font-weight:var(--font-bold); color:var(--color-text);">${a.name}</div>
            <div style="font-size:10px; color:var(--color-text-muted);">${a.desc}</div>
            <span class="badge ${a.unlocked ? 'badge-primary' : 'badge-ghost'}">${a.unlocked ? 'Açıldı' : 'Kilitli'}</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  // Offline downloads loader
  const renderOfflineDownloads = async () => {
    const tabOff = document.getElementById('tabProfileOffline');
    try {
      const list = await getAllDownloadedChapters();
      
      if (list.length === 0) {
        tabOff.innerHTML = `
          <div style="text-align:center; padding:var(--space-12); color:var(--color-text-muted);">
            Henüz çevrimdışı okumak için indirdiğiniz bir bölüm yok.
          </div>
        `;
        return;
      }

      tabOff.innerHTML = `
        <div style="margin-bottom: var(--space-4); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: var(--text-lg); color: var(--color-text);">İndirilen Bölümler (${list.length})</h3>
          <span style="font-size: var(--text-sm); color: var(--color-text-secondary);">Cihazda Okumaya Hazır</span>
        </div>
        <div class="manga-grid">
          ${list.map(ch => `
            <div class="manga-card" style="position:relative;">
              <a href="bolum-oku.html?slug=${ch.slug}&chapter=${ch.chapter}">
                <div class="manga-card-cover">
                  <img src="${ch.cover}" alt="${ch.title}">
                  <div class="manga-card-cover-overlay"></div>
                </div>
                <div class="manga-card-body">
                  <h3 class="manga-card-title">${ch.title}</h3>
                  <span class="manga-card-chapter">Bölüm ${ch.chapter}</span>
                  <span class="manga-card-rating" style="color:var(--color-success)">İndirildi (Çevrimdışı)</span>
                </div>
              </a>
              <button class="btn btn-ghost btn-sm" style="position:absolute; top:8px; right:8px; z-index:10; background:rgba(0,0,0,0.6);" onclick="window.removeOfflineChapter('${ch.slug}', ${ch.chapter})">Sil</button>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      tabOff.innerHTML = '<div style="text-align:center; color:var(--color-danger);">İndirilenler yüklenirken hata oluştu.</div>';
    }
  };



  let guildChatInterval = null;

  const renderGuildPanel = async () => {
    const guildNotJoined = document.getElementById('guildNotJoined');
    const guildJoined = document.getElementById('guildJoined');
    const guildList = document.getElementById('guildList');
    
    // Clear existing interval if any
    if (guildChatInterval) clearInterval(guildChatInterval);
    
    try {
      const resMe = await fetch('/api/v1/auth/me');
      const me = await resMe.json();
      
      if (!me.user.guildId) {
        guildNotJoined.style.display = 'block';
        guildJoined.style.display = 'none';
        
        const gRes = await fetch('/api/v1/guilds');
        const guilds = await gRes.json();
        
        guildList.innerHTML = guilds.map(g => `
          <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong>${g.name}</strong> <span style="font-size:0.8rem; color:var(--color-text-muted);">Lv.${g.level}</span>
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.joinGuild('${g.id}')">Katıl</button>
          </div>
        `).join('') || '<div style="color:var(--color-text-muted);">Henüz hiç lonca yok.</div>';
        
      } else {
        guildNotJoined.style.display = 'none';
        guildJoined.style.display = 'block';
        
        const gRes = await fetch('/api/v1/guilds/my');
        const myGuild = await gRes.json();
        
        if (myGuild) {
          document.getElementById('myGuildName').innerText = myGuild.name;
          document.getElementById('myGuildOwner').innerText = myGuild.owner;
          document.getElementById('myGuildMembersCount').innerText = myGuild.members.length;
          document.getElementById('myGuildLevel').innerText = `Lv. ${myGuild.level}`;
          document.getElementById('myGuildXP').innerText = `${myGuild.xp} Toplam XP`;
          
          document.getElementById('myGuildMembersList').innerHTML = myGuild.members.map(m => `
            <li style="background:var(--color-primary-dark); padding:5px 12px; border-radius:20px; font-size:0.9rem; margin-bottom:5px;">
              ${m} ${m === myGuild.owner ? '👑' : ''}
            </li>
          `).join('');

          // Setup leave button
          const btnLeave = document.getElementById('btnLeaveGuild');
          if(btnLeave) {
            btnLeave.onclick = async () => {
              if(!confirm('Loncadan ayrılmak istediğinize emin misiniz?')) return;
              try {
                const res = await fetch('/api/v1/guilds/leave', { method: 'POST' });
                if(res.ok) {
                  window.showToast('Loncadan ayrıldınız.', 'info');
                  renderGuildPanel();
                }
              } catch(e) {}
            };
          }

          // Setup chat
          const fetchMessages = async () => {
            try {
              const mRes = await fetch(`/api/v1/guilds/${myGuild.id}/messages`);
              if(!mRes.ok) return;
              const messages = await mRes.json();
              const chatBox = document.getElementById('guildChatMessages');
              if(!chatBox) return;
              
              const isAtBottom = chatBox.scrollHeight - chatBox.scrollTop <= chatBox.clientHeight + 50;
              
              chatBox.innerHTML = messages.map(msg => `
                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
                  <strong style="color:${msg.username === me.user.username ? 'var(--color-primary)' : 'var(--color-text)'};">${msg.username}</strong> 
                  <span style="font-size:0.7rem; color:var(--color-text-muted); float:right;">${new Date(msg.timestamp).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                  <div style="margin-top:5px; word-wrap:break-word;">${msg.text}</div>
                </div>
              `).join('');
              
              if(isAtBottom) chatBox.scrollTop = chatBox.scrollHeight;
            } catch(e) {}
          };
          
          // Initial fetch
          await fetchMessages();
          const chatBox = document.getElementById('guildChatMessages');
          if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;

          // Start polling every 3 seconds
          guildChatInterval = setInterval(fetchMessages, 3000);

          // Setup chat form
          const chatForm = document.getElementById('guildChatForm');
          if(chatForm) {
            chatForm.onsubmit = async (e) => {
              e.preventDefault();
              const input = document.getElementById('guildChatInput');
              const text = input.value.trim();
              if(!text) return;
              
              input.value = ''; // clear immediately
              try {
                const res = await fetch(`/api/v1/guilds/${myGuild.id}/messages`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ text })
                });
                const data = await res.json();
                if(res.ok) {
                  await fetchMessages(); // refresh instantly
                  const box = document.getElementById('guildChatMessages');
                  if(box) box.scrollTop = box.scrollHeight;
                } else {
                  window.showToast(data.error || 'Hata oluştu', 'danger');
                }
              } catch(err) {}
            };
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderStatistics = async () => {
    const tabStats = document.getElementById('tabProfileStats');
    if (!tabStats) return;

    try {
      const [resMe, resManga] = await Promise.all([
        fetch('/api/v1/auth/me'),
        fetch('/api/v1/manga')
      ]);
      const session = await resMe.json();
      const allManga = await resManga.json();

      if (!session.user) return;
      const me = session.user;

      // 1. Total Pages
      const totalPages = Math.floor((me.xp || 0) * 12.5);
      
      // Animate numbers
      let currentVal = 0;
      const step = Math.max(1, Math.floor(totalPages / 30));
      const counterEl = document.getElementById('statTotalPages');
      const timer = setInterval(() => {
        currentVal += step;
        if (currentVal >= totalPages) {
          currentVal = totalPages;
          clearInterval(timer);
        }
        if(counterEl) counterEl.innerText = currentVal.toLocaleString('tr-TR');
      }, 30);

      // 2. Genres
      const myMangas = allManga.filter(m => me.library.includes(m.slug));
      const genreCounts = {};
      myMangas.forEach(m => {
        if(m.genres) m.genres.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      });

      const maxGenreCount = Math.max(...Object.values(genreCounts), 1);
      const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5
      
      const barsContainer = document.getElementById('statGenreBars');
      if (barsContainer) {
        if (sortedGenres.length === 0) {
          barsContainer.innerHTML = '<span style="color:var(--color-text-muted);">Kütüphanenizde yeterli manga yok.</span>';
        } else {
          barsContainer.innerHTML = sortedGenres.map(([genre, count], idx) => {
            const pct = (count / maxGenreCount) * 100;
            return `
              <div class="stat-genre-row">
                <div class="stat-genre-label">${genre}</div>
                <div class="stat-bar-track">
                  <div class="stat-bar-fill" style="background:var(--color-primary); width:0%" data-target-width="${pct}%"></div>
                </div>
                <div style="font-size:0.8rem; font-weight:700; width:30px; text-align:right;">${count}</div>
              </div>
            `;
          }).join('');
          
          // Animate genre bars after a small delay
          setTimeout(() => {
            barsContainer.querySelectorAll('.stat-bar-fill').forEach(bar => {
              bar.style.width = bar.getAttribute('data-target-width');
            });
          }, 100);
        }
      }

      // 3. Time chart (Deterministic mock based on username)
      const timeChart = document.getElementById('statTimeChart');
      if (timeChart) {
        const seed = me.username.charCodeAt(0) + (me.xp || 1);
        // Generate 24 random-ish data points using sin wave + seed
        let html = '';
        const points = [];
        for(let i=0; i<24; i++) {
          const val = Math.abs(Math.sin(i * 0.4 + seed) * 100) + (Math.cos(i * 0.2) * 20);
          const finalVal = Math.min(100, Math.max(10, val));
          points.push(finalVal);
          html += `
            <div class="stat-time-bar" style="height:0%" data-target-height="${finalVal}%" title="${i}:00"></div>
          `;
        }
        timeChart.innerHTML = html;
        
        setTimeout(() => {
          timeChart.querySelectorAll('.stat-time-bar').forEach(bar => {
            bar.style.height = bar.getAttribute('data-target-height');
          });
        }, 300);

        // Assign characteristic based on peak time
        const maxTimeIdx = points.indexOf(Math.max(...points));
        let trait = "Standart Okuyucu";
        if (maxTimeIdx >= 0 && maxTimeIdx <= 5) trait = "Gece Kuşu 🦉";
        else if (maxTimeIdx >= 6 && maxTimeIdx <= 11) trait = "Sabah Çiyi 🌅";
        else if (maxTimeIdx >= 12 && maxTimeIdx <= 17) trait = "Öğle Güneşi ☀️";
        else trait = "Akşam Sefası 🌙";
        
        if(sortedGenres.length > 0 && sortedGenres[0][0] === "Aksiyon") trait = "Savaşçı ⚔️";
        
        const traitEl = document.getElementById('statTrait');
        if(traitEl) traitEl.innerText = trait;
      }

    } catch(err) {
      console.error('Stats error:', err);
    }
  };
  const tabItemLib = document.getElementById('tabItemLibrary');
  const tabItemAch = document.getElementById('tabItemAchievements');
  const tabItemOff = document.getElementById('tabItemOffline');
  const tabItemGuild = document.getElementById('tabItemGuild');
  const tabItemStats = document.getElementById('tabItemStats');
  
  const tabOff = document.getElementById('tabProfileOffline');
  const tabGuild = document.getElementById('tabProfileGuild');
  const tabStats = document.getElementById('tabProfileStats');

  // Reset all tabs helper
  const hideAllTabs = () => {
    [tabItemLib, tabItemAch, tabItemOff, tabItemGuild, tabItemStats].forEach(el => {
      if(el) el.classList.remove('active');
    });
    [tabLib, tabAch, tabOff, tabGuild, tabStats].forEach(el => {
      if(el) el.style.display = 'none';
    });
  };

  tabItemLib.onclick = () => {
    hideAllTabs();
    tabItemLib.classList.add('active');
    tabLib.style.display = 'block';
    renderProfileLibrary();
  };

  if(tabItemStats) {
    tabItemStats.onclick = () => {
      hideAllTabs();
      tabItemStats.classList.add('active');
      tabStats.style.display = 'block';
      renderStatistics();
    };
  }

  tabItemAch.onclick = () => {
    hideAllTabs();
    tabItemAch.classList.add('active');
    tabAch.style.display = 'block';
    tabOff.style.display = 'none';
    renderAchievements();
  };

  tabItemOff.onclick = () => {
    hideAllTabs();
    tabItemOff.classList.add('active');
    tabOff.style.display = 'block';
    renderOfflineDownloads();
  };

  if (tabItemGuild) {
    tabItemGuild.onclick = () => {
      hideAllTabs();
      tabItemGuild.classList.add('active');
      tabGuild.style.display = 'block';
      renderGuildPanel();
    };
  }
  
  const createGuildForm = document.getElementById('createGuildForm');
  if (createGuildForm) {
    createGuildForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('guildNameInput').value;
      try {
        const res = await fetch('/api/v1/guilds', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (res.ok) {
          window.showToast('Lonca kuruldu!', 'success');
          renderGuildPanel();
        } else {
          window.showToast(data.error || 'Hata oluştu', 'danger');
        }
      } catch (err) {}
    };
  }

  // Helper for inline delete button
  window.removeOfflineChapter = async (slug, chapter) => {
    if(confirm('Bu bölümü cihazından silmek istediğine emin misin?')) {
      await deleteOfflineChapter(slug, chapter);
      renderOfflineDownloads(); // refresh
      window.showToast('Bölüm başarıyla silindi.', 'info');
    }
  };

  window.joinGuild = async (id) => {
    try {
      const res = await fetch(`/api/v1/guilds/join/${id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        window.showToast('Loncaya katıldınız!', 'success');
        renderGuildPanel();
      } else {
        window.showToast(data.error || 'Hata oluştu', 'danger');
      }
    } catch (err) {}
  };

  // Trigger library first
  tabItemLib.click();
}
