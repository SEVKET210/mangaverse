/* ============================================
   MangaVerse — Sidebar, Bottom Nav & Drawer Logic
   (Hover-triggered collapsible sidebar)
   ============================================ */

export function initSidebar() {
  initCategoriesAccordion();
  initMobileDrawer();
  highlightActiveNav();
  initDesktopHoverTooltips();
}

// ---- Categories Accordion ----
function initCategoriesAccordion() {
  const trigger = document.getElementById('sidebarCatTrigger');
  const content = document.getElementById('sidebarCatContent');
  if (!trigger || !content) return;

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', !isExpanded);
    content.classList.toggle('collapsed', isExpanded);
    const caret = trigger.querySelector('.caret-icon');
    if (caret) {
      caret.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  });
}

// ---- Mobile Slide-out Drawer ----
function initMobileDrawer() {
  const moreBtn   = document.getElementById('mobileNavMore');
  const sidebar   = document.getElementById('appSidebar');
  const menuBtn   = document.getElementById('mobileMenuBtn');  // Topbar hamburger

  if (!sidebar) return;

  // Create overlay if absent
  let overlay = document.getElementById('sidebarOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  function openDrawer() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Bottom nav "Daha Fazla" button
  if (moreBtn) {
    moreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
  }

  // Topbar hamburger on mobile
  if (menuBtn) {
    menuBtn.addEventListener('click', () => openDrawer());
  }

  // Close on overlay click
  overlay.addEventListener('click', closeDrawer);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // Swipe left to close (mobile gesture)
  let touchStartX = 0;
  sidebar.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  sidebar.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (diff > 80) closeDrawer();
  }, { passive: true });
}

// ---- Desktop: Show tooltips when sidebar is collapsed ----
function initDesktopHoverTooltips() {
  if (window.innerWidth < 1025) return;

  // Tooltips on nav links when collapsed (icon-only mode)
  const navLinks = document.querySelectorAll('.sidebar-nav-link');
  navLinks.forEach(link => {
    const textEl = link.querySelector('.sidebar-nav-text');
    if (!textEl) return;
    const label = textEl.textContent.trim();

    link.setAttribute('title', label);   // Native browser tooltip fallback
  });
}

// ---- Active Nav Highlighting ----
function highlightActiveNav() {
  const currentPath  = window.location.pathname;
  const currentQuery = window.location.search;

  function isActive(href) {
    if (!href) return false;
    if (href === 'index.html' && (currentPath === '/' || currentPath.endsWith('index.html'))) return true;
    if (href !== 'index.html' && (
      currentPath.includes(href.replace('.html', '')) ||
      (currentQuery && href.includes(currentQuery))
    )) return true;
    return false;
  }

  document.querySelectorAll('.sidebar-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', isActive(href));
  });

  document.querySelectorAll('.mobile-bottom-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', isActive(href));
  });
}
