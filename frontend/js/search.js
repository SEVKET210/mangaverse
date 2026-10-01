/* ============================================
   MangaVerse — Search & Hover Prefetching Engine
   ============================================ */

// Memory Cache for Manga Details Prefetching
window.mangaPrefetchCache = new Map();

export function initSearch() {
  initDesktopSearch();
  initMobileSearchOverlay();
  initPrefetchHoverListeners();
}

// Prefetch Manga Detail Helper
export async function prefetchManga(slug) {
  if (!slug || window.mangaPrefetchCache.has(slug)) return;

  // Add a placeholder to prevent duplicate requests
  window.mangaPrefetchCache.set(slug, 'loading');

  try {
    const response = await fetch(`/api/v1/manga/${slug}`);
    if (response.ok) {
      const data = await response.json();
      window.mangaPrefetchCache.set(slug, data);
      console.log(`⚡ Prefetched details for: ${slug}`);
    } else {
      window.mangaPrefetchCache.delete(slug);
    }
  } catch (err) {
    window.mangaPrefetchCache.delete(slug);
  }
}

// Attach hover prefetching to dynamically rendered elements
export function attachPrefetchHover(elements) {
  elements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      const slug = el.dataset.slug || new URL(el.href).searchParams.get('slug');
      if (slug) prefetchManga(slug);
    }, { once: true }); // Prefetch once per session hover
  });
}

function initPrefetchHoverListeners() {
  // Listen for mouseover on page elements that point to details page
  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.manga-card, .trend-card, .rec-card, .search-result-item, .continue-card');
    if (card && card.href) {
      try {
        const url = new URL(card.href);
        const slug = url.searchParams.get('slug');
        if (slug) prefetchManga(slug);
      } catch (err) {}
    }
  });
}

// ---- Desktop Live Search ----
function initDesktopSearch() {
  // Support topbar search (new) or sidebar search (legacy fallback)
  const input = document.getElementById('topbarSearchInput') || document.getElementById('sidebarSearchInput');
  const resultsDropdown = document.getElementById('topbarSearchResults') || document.getElementById('sidebarSearchResults');
  if (!input || !resultsDropdown) return;

  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const query = input.value.trim();
      if (query.length < 2) {
        resultsDropdown.innerHTML = '';
        resultsDropdown.classList.remove('visible');
        return;
      }

      try {
        const res = await fetch(`/api/v1/manga?q=${encodeURIComponent(query)}`);
        const matches = await res.json();
        renderResults(query.toLowerCase(), matches, resultsDropdown);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 250);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) {
      resultsDropdown.classList.add('visible');
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !resultsDropdown.contains(e.target)) {
      resultsDropdown.classList.remove('visible');
    }
  });

  // Keyboard navigation support
  input.addEventListener('keydown', (e) => {
    const items = resultsDropdown.querySelectorAll('.search-result-item');
    if (items.length === 0) return;

    const current = resultsDropdown.querySelector('.search-result-item.focused');
    let idx = Array.from(items).indexOf(current);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      current?.classList.remove('focused');
      idx = (idx + 1) % items.length;
      items[idx].classList.add('focused');
      items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      current?.classList.remove('focused');
      idx = (idx - 1 + items.length) % items.length;
      items[idx].classList.add('focused');
      items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const focused = resultsDropdown.querySelector('.search-result-item.focused');

      if (focused) {
        focused.click();
      } else {
        window.location.href = `katalog.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    } else if (e.key === 'Escape') {
      resultsDropdown.classList.remove('visible');
      input.blur();
    }
  });
}

// ---- Mobile Search Fullscreen Overlay ----
function initMobileSearchOverlay() {
  const searchBtn = document.getElementById('mobileNavSearch');
  
  // Create overlay markup
  let overlay = document.getElementById('mobileSearchOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'mobileSearchOverlay';
    overlay.className = 'mobile-search-overlay';
    overlay.innerHTML = `
      <div class="mobile-search-header">
        <button id="closeMobileSearch" class="reader-back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <input type="text" id="mobileSearchInput" class="form-input" placeholder="Manga, yazar, tür ara..." autocomplete="off">
      </div>
      <div class="mobile-search-results" id="mobileSearchResults"></div>
    `;
    document.body.appendChild(overlay);
  }

  const input = document.getElementById('mobileSearchInput');
  const results = document.getElementById('mobileSearchResults');
  const closeBtn = document.getElementById('closeMobileSearch');

  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.classList.add('active');
      setTimeout(() => input.focus(), 150);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
      input.value = '';
      results.innerHTML = '';
    });
  }

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const query = input.value.trim();
      if (query.length < 2) {
        results.innerHTML = '';
        return;
      }
      try {
        const res = await fetch(`/api/v1/manga?q=${encodeURIComponent(query)}`);
        const matches = await res.json();
        renderResults(query.toLowerCase(), matches, results, true);
      } catch (err) {
        console.error('Mobile search error:', err);
      }
    }, 250);
  });
}

// Render Results Grid
function renderResults(query, matches, container, isMobile = false) {
  const list = matches.slice(0, 6);
  if (list.length === 0) {
    container.innerHTML = `
      <div style="padding:var(--space-4); text-align:center; color:var(--color-text-muted); font-size:var(--text-sm)">
        Sonuç bulunamadı
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(m => `
    <a href="seri-detay.html?slug=${m.slug}" class="search-result-item" data-slug="${m.slug}">
      <img src="${m.cover}" alt="${m.title}" class="search-result-cover" onerror="this.src='https://cdn.myanimelist.net/images/manga/3/222295.jpg'" loading="lazy" decoding="async">
      <div style="flex:1; min-width:0;">
        <div class="search-result-title">${highlight(m.title, query)}</div>
        <div class="search-result-meta">${m.author} · ⭐ ${m.rating}</div>
      </div>
      <span class="badge ${m.status === 'completed' ? 'badge-completed' : 'badge-ongoing'}">${m.statusLabel}</span>
    </a>
  `).join('');

  // Add all-results link
  container.innerHTML += `
    <a href="katalog.html?q=${encodeURIComponent(query)}" class="search-result-item" style="border-top:1px solid var(--color-border); justify-content:center; color:var(--color-primary-light);">
      <span style="font-size:var(--text-xs); font-weight:var(--font-semi); text-transform:uppercase;">"${query}" için tüm sonuçları gör</span>
    </a>
  `;

  if (!isMobile) {
    container.classList.add('visible');
  }
}

// Simple text highlighter for match queries
function highlight(text, query) {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return text.slice(0, idx) +
    `<mark style="background:var(--color-primary-glow); color:var(--color-primary-light); border-radius:2px; padding:0 2px;">${text.slice(idx, idx + query.length)}</mark>` +
    text.slice(idx + query.length);
}
