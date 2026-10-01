/* ============================================
   MangaVerse — User Authentication Sync
   ============================================ */

export async function syncUserAuth() {
  try {
    const response = await fetch('/api/v1/auth/me');
    const data = await response.json();

    // Hydrate sidebar user panel (if present)
    const sidebarAuth = document.getElementById('sidebarUserPanel');
    if (sidebarAuth) {
      if (data.loggedIn) {
        sidebarAuth.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:var(--space-2);">
            <a href="profil.html" class="sidebar-nav-link" style="padding:var(--space-2);">
              <div class="sidebar-nav-icon">
                <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">${data.user.username.slice(0, 2).toUpperCase()}</div>
              </div>
              <span class="sidebar-nav-text">${data.user.username}</span>
            </a>
            <button id="logoutBtn" class="sidebar-nav-link" style="cursor:pointer;border:none;background:none;color:var(--color-danger);font-size:var(--text-sm);text-align:left;">
              <div class="sidebar-nav-icon" style="font-size:16px;">🚪</div>
              <span class="sidebar-nav-text">Çıkış Yap</span>
            </button>
          </div>
        `;
        document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
      } else {
        sidebarAuth.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:var(--space-2);">
            <a href="giris.html" class="sidebar-nav-link">
              <div class="sidebar-nav-icon">🔑</div>
              <span class="sidebar-nav-text">Giriş Yap</span>
            </a>
            <a href="giris.html?tab=register" class="sidebar-nav-link" style="color:var(--color-primary-light);">
              <div class="sidebar-nav-icon">✨</div>
              <span class="sidebar-nav-text">Kayıt Ol</span>
            </a>
          </div>
        `;
      }
    }

    // Hydrate topbar auth area
    initTopbarAuth(data);

    return data.loggedIn ? data.user : null;
  } catch (err) {
    console.error('Auth sync failed:', err);
    // Show guest state in topbar on error
    initTopbarAuth({ loggedIn: false });
    return null;
  }
}

export function initTopbarAuth(data) {
  const area = document.getElementById('topbarAuthArea');
  if (!area) return;

  if (data && data.loggedIn && data.user) {
    const initials = data.user.username.slice(0, 2).toUpperCase();
    area.innerHTML = `
      <div class="topbar-auth-user">
        <button class="topbar-icon-btn" id="topbarLibraryBtn" title="Kitaplığım" onclick="window.location='profil.html?tab=library'">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        </button>
        <button class="topbar-user-btn" id="topbarUserBtn">
          <div class="topbar-user-avatar">${initials}</div>
          <span class="topbar-user-name">${data.user.username}</span>
          <svg class="topbar-user-caret" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="topbar-user-dropdown" id="topbarUserDropdown">
          <div class="topbar-dropdown-header">
            <div class="topbar-dropdown-username">${data.user.username}</div>
            <div class="topbar-dropdown-role">Manga Okuyucusu</div>
          </div>
          <a href="profil.html" class="topbar-dropdown-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            Profilim
          </a>
          <a href="profil.html?tab=library" class="topbar-dropdown-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            Kitaplığım
          </a>
          <div class="topbar-dropdown-divider"></div>
          <button class="topbar-dropdown-item danger" id="topbarLogoutBtn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Çıkış Yap
          </button>
        </div>
      </div>
    `;

    // Dropdown toggle
    const userBtn = document.getElementById('topbarUserBtn');
    const dropdown = document.getElementById('topbarUserDropdown');
    if (userBtn && dropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle('open');
        userBtn.classList.toggle('open', isOpen);
      });
      document.addEventListener('click', () => {
        dropdown.classList.remove('open');
        userBtn.classList.remove('open');
      });
    }

    document.getElementById('topbarLogoutBtn')?.addEventListener('click', doLogout);

  } else {
    area.innerHTML = `
      <div class="topbar-auth-guest">
        <a href="giris.html" class="btn btn-ghost btn-sm">Giriş Yap</a>
        <a href="giris.html?tab=register" class="btn btn-primary btn-sm">Kayıt Ol</a>
      </div>
    `;
  }
}

async function doLogout() {
  try {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    window.showToast?.('🚪 Çıkış yapıldı', 'info');
    setTimeout(() => window.location.reload(), 800);
  } catch (err) {
    window.showToast?.('Bağlantı hatası', 'danger');
  }
}



// Form Handlers for giris.html
export function initAuthForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (!loginForm && !registerForm) return;

  // Toggle Forms via Tabs
  const loginTab = document.getElementById('tabLogin');
  const registerTab = document.getElementById('tabRegister');
  const loginArea = document.getElementById('loginFormArea');
  const registerArea = document.getElementById('registerFormArea');

  const switchTab = (tab) => {
    if (tab === 'register') {
      loginTab.classList.remove('active');
      registerTab.classList.add('active');
      loginArea.style.display = 'none';
      registerArea.style.display = 'block';
    } else {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      loginArea.style.display = 'block';
      registerArea.style.display = 'none';
    }
  };

  loginTab.addEventListener('click', () => switchTab('login'));
  registerTab.addEventListener('click', () => switchTab('register'));

  // Read URL query tab
  const params = new URLSearchParams(window.location.search);
  if (params.get('tab') === 'register') {
    switchTab('register');
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameOrEmail = document.getElementById('loginUser').value.trim();
      const password = document.getElementById('loginPass').value;

      try {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernameOrEmail, password })
        });
        const result = await response.json();
        if (response.ok) {
          window.showToast('✅ Giriş başarılı, yönlendiriliyorsunuz...', 'success');
          setTimeout(() => window.location.href = 'index.html', 1000);
        } else {
          window.showToast(result.error || 'Giriş yapılamadı', 'danger');
        }
      } catch (err) {
        window.showToast('Sunucu bağlantı hatası', 'danger');
      }
    });
  }

  // Handle Register
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('regUser').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPass').value;

      try {
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const result = await response.json();
        if (response.ok) {
          window.showToast('🎉 Kayıt başarılı! Giriş yapılıyor...', 'success');
          setTimeout(() => window.location.href = 'index.html', 1000);
        } else {
          window.showToast(result.error || 'Kayıt olunamadı', 'danger');
        }
      } catch (err) {
        window.showToast('Sunucu bağlantı hatası', 'danger');
      }
    });
  }
}
