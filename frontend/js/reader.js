/* ============================================
   MangaVerse — Dynamic Reader Engine
   ============================================ */

import { downloadChapter, getOfflineChapter, deleteOfflineChapter } from './offline-db.js';

export function initReader() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const chapter = parseInt(params.get('chapter')) || 1;

  if (!slug) {
    window.location.href = 'index.html';
    return;
  }

  loadReaderData(slug, chapter);
}

async function loadReaderData(slug, currentChapter) {
  try {
    // Get manga list metadata
    const res = await fetch(`/api/v1/manga/${slug}`);
    if (!res.ok) throw new Error('Manga not found');
    const manga = await res.json();

    document.getElementById('readerSeriesLink').innerText = manga.title;
    document.getElementById('readerSeriesLink').href = `seri-detay.html?slug=${slug}`;
    document.querySelectorAll('[data-chapter-num]').forEach(el => {
      el.innerText = `Bölüm ${currentChapter}`;
    });
    document.title = `${manga.title} — Bölüm ${currentChapter} — MangaVerse`;

    // Populate chapter select dropdown
    const selectMenu = document.getElementById('chapterSelectMenu');
    if (selectMenu) {
      selectMenu.innerHTML = Array.from({ length: manga.chapters }, (_, i) => i + 1)
        .map(ch => `<option value="${ch}" ${ch === currentChapter ? 'selected' : ''}>Bölüm ${ch}</option>`)
        .join('');

      selectMenu.addEventListener('change', () => {
        const val = selectMenu.value;
        window.location.href = `bolum-oku.html?slug=${slug}&chapter=${val}`;
      });
    }

    // Configure chapter navigation buttons
    const prevBtn = document.getElementById('chapterPrev');
    const nextBtn = document.getElementById('chapterNext');

    if (prevBtn) {
      if (currentChapter > 1) {
        prevBtn.addEventListener('click', () => {
          window.location.href = `bolum-oku.html?slug=${slug}&chapter=${currentChapter - 1}`;
        });
      } else {
        prevBtn.style.opacity = '0.3';
        prevBtn.style.pointerEvents = 'none';
      }
    }

    if (nextBtn) {
      if (currentChapter < manga.chapters) {
        nextBtn.addEventListener('click', () => {
          window.location.href = `bolum-oku.html?slug=${slug}&chapter=${currentChapter + 1}`;
        });
      } else {
        nextBtn.style.opacity = '0.3';
        nextBtn.style.pointerEvents = 'none';
      }
    }

    // Check if downloaded offline
    const offlineData = await getOfflineChapter(slug, currentChapter);
    let images = [];

    if (offlineData) {
      window.showToast('Çevrimdışı okuma modu aktif.', 'info');
      images = offlineData.pages;
    } else {
      // Load mock manga page images if not offline
      const pagesCount = 12; // Standard pages per chapter
      images = generateMockReaderPages(slug, currentChapter, pagesCount);
    }
    
    // Setup Download Logic
    const downloadBtn = document.getElementById('downloadChapterBtn');
    if (downloadBtn) {
      if (offlineData) {
        downloadBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke="var(--color-success)"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        downloadBtn.title = "Bölüm Cihazda İndirilmiş";
        downloadBtn.addEventListener('click', async () => {
          if(confirm('Bu bölümü cihazından silmek istediğine emin misin?')) {
            await deleteOfflineChapter(slug, currentChapter);
            window.showToast('Bölüm cihazdan silindi.', 'info');
            setTimeout(() => window.location.reload(), 1000);
          }
        });
      } else {
        downloadBtn.addEventListener('click', async () => {
          downloadBtn.style.animation = 'pulse 1s infinite';
          window.showToast('Bölüm indiriliyor... Lütfen bekleyin.', 'info');
          try {
            await downloadChapter(slug, currentChapter, manga.title, manga.cover, images, (progress) => {
              // Can update a progress bar here
            });
            window.showToast('Bölüm başarıyla indirildi!', 'success');
            setTimeout(() => window.location.reload(), 1000);
          } catch (e) {
            window.showToast('İndirme başarısız oldu.', 'danger');
            downloadBtn.style.animation = '';
          }
        });
      }
    }
    
    // Setup reading mode & tracking
    setupReadingModes(images, slug, currentChapter, manga.chapters);
    
    // Save initial progress
    saveProgress(slug, currentChapter, 1);

    // Setup Reader Lists Dropdown
    setupReaderListsDropdown(slug);

    // Init Live Presence
    startPresencePolling(slug, currentChapter);

  } catch (err) {
    console.error('Error loading reader:', err);
    window.showToast('Bölüm yüklenemedi', 'danger');
  }
}

// Poll backend to track and get active readers for this chapter
let presenceInterval = null;
async function startPresencePolling(slug, chapter) {
  const badge = document.getElementById('liveReadersBadge');
  const countSpan = document.getElementById('liveReadersCount');
  
  const poll = async () => {
    try {
      const res = await fetch(`/api/v1/presence/${slug}/${chapter}`, { method: 'POST' });
      const data = await res.json();
      if (data.viewers > 1) { // Only show if someone else is reading
        badge.style.display = 'flex';
        countSpan.innerText = `${data.viewers} Okuyucu`;
      } else {
        badge.style.display = 'none';
      }
    } catch (e) {
      // Ignore presence error
    }
  };
  
  poll(); // Initial call
  if (presenceInterval) clearInterval(presenceInterval);
  presenceInterval = setInterval(poll, 10000); // Poll every 10 seconds
}

// Generate premium mock pages using curated manga artwork
function generateMockReaderPages(slug, chapter, count) {
  // Use a variety of manga image sets to make it look premium
  const sampleImages = [
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80'
  ];

  return Array.from({ length: count }, (_, i) => {
    // Seeded random choosing based on slug + chapter + page index
    const seed = slug.charCodeAt(0) + chapter + i;
    const imgUrl = sampleImages[seed % sampleImages.length];
    return imgUrl;
  });
}

function setupReadingModes(images, slug, initialChapter, totalChapters) {
  const contentArea = document.getElementById('readerContent');
  if (!contentArea) return;

  let currentMode = localStorage.getItem('mv_reader_mode') || 'vertical';
  let currentPageIndex = 0; // 0-indexed
  let currentlyLoadedImages = [...images];
  let latestChapterLoaded = initialChapter;
  let isLoadingNext = false;

  const renderPages = () => {
    contentArea.innerHTML = '';
    contentArea.className = `reader-content reader-${currentMode}`;

    if (currentMode === 'vertical') {
      // Hide page click controls
      document.getElementById('prevPageZone').style.display = 'none';
      document.getElementById('nextPageZone').style.display = 'none';
      document.getElementById('pagePrev').style.display = 'none';
      document.getElementById('pageNext').style.display = 'none';

      // Function to append images to the DOM
      const appendImagesToDOM = (imgs, chapterNum) => {
        const html = imgs.map((img, idx) => `
          <div style="position:relative; width:100%; text-align:center;" data-chapter="${chapterNum}" data-page="${idx+1}">
            <img src="${img}" alt="Bölüm ${chapterNum} Sayfa ${idx + 1}" loading="lazy" style="margin-bottom:12px; width:100%;" decoding="async">
            <span style="position:absolute; bottom:20px; right:20px; background:rgba(0,0,0,0.6); padding:4px 8px; border-radius:4px; font-size:10px;">${idx + 1}/${imgs.length}</span>
          </div>
        `).join('');
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        while(wrapper.firstChild) contentArea.appendChild(wrapper.firstChild);
      };

      appendImagesToDOM(currentlyLoadedImages, latestChapterLoaded);

      // Track scroll positions for active page tracker and Ambilight
      window.onscroll = () => {
        const divs = contentArea.querySelectorAll('div[data-page]');
        let currentViewIdx = 0;
        let currentViewChapter = initialChapter;
        
        divs.forEach((div, idx) => {
          const rect = div.getBoundingClientRect();
          if (rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2) {
            currentViewIdx = parseInt(div.getAttribute('data-page')) - 1;
            currentViewChapter = parseInt(div.getAttribute('data-chapter'));
          }
        });
        
        updateProgressBar(currentViewIdx, currentlyLoadedImages.length); // length is inaccurate for infinite, but sufficient for visual progress
        
        // Update URL and save progress without refreshing
        if (currentViewChapter !== initialChapter) {
          const newUrl = window.location.pathname + `?slug=${slug}&chapter=${currentViewChapter}`;
          window.history.replaceState({}, '', newUrl);
          
          document.querySelectorAll('[data-chapter-num]').forEach(el => {
            el.innerText = `Bölüm ${currentViewChapter}`;
          });
          document.title = `Bölüm ${currentViewChapter} — MangaVerse`;
        }
        
        saveProgress(slug, currentViewChapter, currentViewIdx + 1);

        // Infinite Scroll Check
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
          loadNextChapterInfinite();
        }
      };
      
      const loadNextChapterInfinite = async () => {
        if (isLoadingNext || latestChapterLoaded >= totalChapters) return;
        isLoadingNext = true;
        latestChapterLoaded++;
        
        // Add separator
        const separator = document.createElement('div');
        separator.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--color-primary); font-weight:bold; font-size:1.5rem;">Bölüm ${latestChapterLoaded} Yükleniyor...</div>`;
        contentArea.appendChild(separator);

        try {
          // In a real app we'd fetch the actual chapter images from an API.
          // Since we use mock generated images, we just generate them.
          const pagesCount = 12;
          const newImages = generateMockReaderPages(slug, latestChapterLoaded, pagesCount);
          
          // Small timeout to simulate network request and show the sleek separator
          setTimeout(() => {
            separator.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--color-text-muted); font-weight:bold; font-size:1.2rem;">— Bölüm ${latestChapterLoaded} —</div>`;
            appendImagesToDOM(newImages, latestChapterLoaded);
            isLoadingNext = false;
          }, 800);
          
        } catch (e) {
          isLoadingNext = false;
        }
      };

      updateProgressBar(0, currentlyLoadedImages.length);

    } else {
      // Paged Mode (Single Page)
      document.getElementById('prevPageZone').style.display = 'block';
      document.getElementById('nextPageZone').style.display = 'block';
      document.getElementById('pagePrev').style.display = 'flex';
      document.getElementById('pageNext').style.display = 'flex';

      const showPage = (idx) => {
        currentPageIndex = Math.max(0, Math.min(idx, images.length - 1));
        contentArea.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%;">
            <img src="${images[currentPageIndex]}" alt="Sayfa ${currentPageIndex + 1}" style="max-height:82vh; border-radius:var(--radius-md);" loading="lazy" decoding="async">
          </div>
        `;
        updateProgressBar(currentPageIndex, images.length);
        saveProgress(slug, latestChapterLoaded, currentPageIndex + 1);
      };

      showPage(currentPageIndex);

      // Event handlers for page zones
      document.getElementById('prevPageZone').onclick = () => showPage(currentPageIndex - 1);
      document.getElementById('nextPageZone').onclick = () => {
        if (currentPageIndex === images.length - 1) {
          // Last page, go to next chapter or show prompt
          window.showToast('Sonraki bölüme geçiliyor...', 'info');
          document.getElementById('chapterNext')?.click();
        } else {
          showPage(currentPageIndex + 1);
        }
      };

      document.getElementById('pagePrev').onclick = () => showPage(currentPageIndex - 1);
      document.getElementById('pageNext').onclick = () => {
        if (currentPageIndex === images.length - 1) {
          document.getElementById('chapterNext')?.click();
        } else {
          showPage(currentPageIndex + 1);
        }
      };

      // Keyboard support
      window.onkeydown = (e) => {
        if (e.key === 'ArrowRight') {
          document.getElementById('pageNext').click();
        } else if (e.key === 'ArrowLeft') {
          document.getElementById('pagePrev').click();
        } else if (e.key.toLowerCase() === 'f') {
          toggleFullscreen();
        }
      };
    }
  };

  // Keyboard layout listeners
  document.getElementById('fullscreenBtn')?.addEventListener('click', toggleFullscreen);

  // Night Mode Toggle (Inverts body theme)
  const nightToggle = document.getElementById('nightModeToggle');
  if (nightToggle) {
    nightToggle.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('mv_theme', next);
    });
  }

  // Bind Mode buttons
  const modeBtns = document.querySelectorAll('[data-reader-mode]');
  modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.readerMode === currentMode);
    btn.onclick = () => {
      currentMode = btn.dataset.readerMode;
      localStorage.setItem('mv_reader_mode', currentMode);
      modeBtns.forEach(b => b.classList.toggle('active', b.dataset.readerMode === currentMode));
      renderPages();
    };
  });

  renderPages();
}

function updateProgressBar(idx, total) {
  document.querySelectorAll('[data-current-page]').forEach(el => el.innerText = idx + 1);
  document.querySelectorAll('[data-total-pages]').forEach(el => el.innerText = total);
  
  const pct = ((idx + 1) / total) * 100;
  const fill = document.getElementById('readerProgressFill');
  const thumb = document.getElementById('readerProgressThumb');

  if (fill) fill.style.width = `${pct}%`;
  if (thumb) thumb.style.left = `${pct}%`;

  // Ambilight Background Update
  const ambilightBg = document.getElementById('ambilightBg');
  if (ambilightBg) {
    const contentArea = document.getElementById('readerContent');
    if (contentArea) {
      const imgs = contentArea.querySelectorAll('img');
      if (imgs[idx] && imgs[idx].src) {
        ambilightBg.style.backgroundImage = `url(${imgs[idx].src})`;
      }
    }
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Fullscreen error: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

// Save reading progress in background (Local + Server API)
async function saveProgress(slug, chapter, page) {
  // Save local
  const progressMap = JSON.parse(localStorage.getItem('mv_reading_progress') || '{}');
  progressMap[slug] = { chapter, page, timestamp: Date.now() };
  localStorage.setItem('mv_reading_progress', JSON.stringify(progressMap));

  // Save server api in background
  try {
    await fetch('/api/v1/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, chapter, page })
    });
  } catch (err) {}
}

async function setupReaderListsDropdown(slug) {
  const btn = document.getElementById('readerListBtn');
  const menu = document.getElementById('readerListMenu');
  if (!btn || !menu) return;

  // Toggle Menu
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
  });

  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.style.display = 'none';
    }
  });

  // Fetch current user lists
  if (!window.currentUser || !window.currentUser.loggedIn) {
    menu.innerHTML = `<a href="giris.html" class="btn btn-ghost btn-sm" style="color:var(--color-primary-light);">Listeler için giriş yap</a>`;
    return;
  }

  const user = window.currentUser.user;
  const lists = [
    { id: 'reading', label: '📖 Okunuyor', active: user.reading_lists?.reading?.includes(slug) },
    { id: 'plan_to_read', label: '📅 Okunacaklar', active: user.reading_lists?.plan_to_read?.includes(slug) },
    { id: 'completed', label: '✅ Tamamlandı', active: user.reading_lists?.completed?.includes(slug) },
    { id: 'dropped', label: '⛔ Bırakıldı', active: user.reading_lists?.dropped?.includes(slug) },
    { id: 'favorites', label: '⭐ Favoriler', active: user.favorites?.includes(slug) }
  ];

  const renderItems = () => {
    menu.innerHTML = lists.map(list => `
      <button class="btn btn-sm ${list.active ? 'btn-primary' : 'btn-ghost'}" style="justify-content:flex-start;" data-list-id="${list.id}">
        ${list.label}
      </button>
    `).join('');

    menu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', async () => {
        const listId = btn.dataset.listId;
        try {
          const res = await fetch('/api/v1/library/toggle', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ slug, listName: listId })
          });
          const data = await res.json();
          if (data.success) {
            window.showToast(`${listId} listesi güncellendi!`, 'success');
            // Optimistic UI update
            const target = lists.find(l => l.id === listId);
            target.active = data.active;
            // Also if exclusive list, deactivate others
            if (data.active && ['reading', 'plan_to_read', 'completed', 'dropped'].includes(listId)) {
               lists.forEach(l => {
                 if(l.id !== listId && ['reading', 'plan_to_read', 'completed', 'dropped'].includes(l.id)) {
                   l.active = false;
                 }
               });
            }
            renderItems(); // re-render inner HTML
          } else {
            window.showToast(data.error || 'Hata oluştu', 'danger');
          }
        } catch(err) {
          window.showToast('Sunucu hatası', 'danger');
        }
      });
    });
  };

  renderItems();
}
