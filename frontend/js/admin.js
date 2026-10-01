// ============================================
// ADMIN DASHBOARD LOGIC
// ============================================

async function initAdminApp() {
  // 1. Verify Admin Status
  try {
    const res = await fetch('/api/v1/auth/me');
    const data = await res.json();
    if (!data.loggedIn || data.user.role !== 'admin') {
      alert('Yönetici yetkiniz bulunmuyor. Anasayfaya yönlendiriliyorsunuz.');
      window.location.href = 'index.html';
      return;
    }
  } catch (err) {
    window.location.href = 'index.html';
  }

  // 2. Tab Navigation
  const navItems = document.querySelectorAll('.admin-nav-item[data-tab]');
  const tabs = document.querySelectorAll('.admin-tab');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      
      tabs.forEach(t => t.classList.remove('active'));
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });

  // 3. Load Dashboard Data
  loadDashboardStats();
  loadMangaTable();

  // 4. Drag & Drop Upload
  setupDragDrop();

  // 5. Add Manga Form Toggle
  document.getElementById('btnShowAddMangaForm').addEventListener('click', () => {
    document.getElementById('addMangaFormWrapper').style.display = 'block';
    document.getElementById('adminMangaTableContainer').style.display = 'none';
  });
  document.getElementById('btnCancelAddManga').addEventListener('click', () => {
    document.getElementById('addMangaFormWrapper').style.display = 'none';
    document.getElementById('adminMangaTableContainer').style.display = 'block';
  });

  // 6. Add Manga Form
  setupAddMangaForm();

  // 7. Load Users & Comments on tab switch
  document.querySelector('.admin-nav-item[data-tab="users"]').addEventListener('click', loadUsers);
  document.querySelector('.admin-nav-item[data-tab="comments"]').addEventListener('click', loadComments);

  // 8. Setup Settings & Menus
  setupSettingsForm();
  setupMenusForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminApp);
} else {
  initAdminApp();
}

async function loadDashboardStats() {
  try {
    const resM = await fetch('/api/v1/manga');
    const mangas = await resM.json();
    
    const resU = await fetch('/api/v1/admin/users');
    const users = await resU.json();
    
    const resC = await fetch('/api/v1/admin/comments');
    const comments = await resC.json();

    const statsGrid = document.querySelector('.stats-grid');
    if(statsGrid) {
      statsGrid.innerHTML = `
        <div class="stat-card">
          <h3>Toplam Manga</h3>
          <div class="stat-value">${mangas.length}</div>
        </div>
        <div class="stat-card">
          <h3>Okuyucu Sayısı</h3>
          <div class="stat-value">${users.length}</div>
        </div>
        <div class="stat-card">
          <h3>Toplam Yorum</h3>
          <div class="stat-value">${comments.length}</div>
        </div>
      `;
    }
  } catch(e) {
    console.error(e);
  }
}

async function loadMangaTable() {
  const tbody = document.getElementById('adminMangaTbody');
  try {
    const res = await fetch('/api/v1/manga');
    const mangas = await res.json();
    
    if(mangas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Hiç seri bulunmuyor.</td></tr>';
      return;
    }

    tbody.innerHTML = mangas.reverse().map(m => `
      <tr>
        <td><img src="${m.cover}" alt="${m.title}"></td>
        <td><strong>${m.title}</strong><br><span style="font-size:0.8rem;color:var(--color-text-muted);">${m.slug}</span></td>
        <td>${m.chapters}</td>
        <td><span class="badge badge-primary" style="font-size:10px;">${m.status}</span></td>
        <td style="text-align:right;">
          <button class="admin-action-btn delete" onclick="deleteManga('${m.slug}')" title="Sil">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    console.error(e);
  }
}

window.deleteManga = async (slug) => {
  if(!confirm('Bu seriyi kalıcı olarak silmek istediğinize emin misiniz?')) return;
  try {
    const res = await fetch(`/api/v1/admin/manga/${slug}`, { method: 'DELETE' });
    if(res.ok) {
      showToast('Seri silindi.', 'success');
      loadMangaTable();
      loadDashboardStats();
    }
  } catch(e) {
    showToast('Hata oluştu.', 'danger');
  }
};

// Global scope to hold parsed base64 files
let uploadedChapterPages = [];

function setupDragDrop() {
  const dropZone = document.getElementById('dragDropZone');
  const fileInput = document.getElementById('mFiles');
  const previewZone = document.getElementById('previewZone');

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedChapterPages.push(e.target.result);
          
          const img = document.createElement('img');
          img.src = e.target.result;
          img.classList.add('preview-item');
          previewZone.appendChild(img);
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function setupAddMangaForm() {
  const form = document.getElementById('addMangaForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('mTitle').value;
    const author = document.getElementById('mAuthor').value;
    const artist = document.getElementById('mArtist').value;
    const cover = document.getElementById('mCover').value;
    const synopsis = document.getElementById('mSynopsis').value;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const payload = {
      title,
      slug,
      author,
      artist,
      cover,
      synopsis,
      statusLabel: "Devam Ediyor",
      year: new Date().getFullYear(),
      genres: ["Bilinmiyor"],
      tags: [],
      // For simplicity in the mock, if pages were uploaded, we count it as chapter 1
      chapters: uploadedChapterPages.length > 0 ? 1 : 0,
      lastChapter: uploadedChapterPages.length > 0 ? 1 : 0,
      views: "0",
      rating: "0.0",
      isNew: true,
      isTrending: false,
      isFeatured: false
    };

    try {
      const res = await fetch('/api/v1/admin/manga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showToast('Seri başarıyla oluşturuldu!', 'success');
        form.reset();
        document.getElementById('previewZone').innerHTML = '';
        uploadedChapterPages = [];
        loadMangaTable();
        loadDashboardStats();
        // Switch back to table view
        document.getElementById('btnCancelAddManga').click();
      } else {
        showToast(data.error || 'Bir hata oluştu.', 'danger');
      }
    } catch (err) {
      showToast('Sunucu hatası.', 'danger');
    }
  });
}

function showToast(msg, type='info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<div class="toast-icon">${type === 'success' ? '✅' : '⚠️'}</div><div class="toast-content">${msg}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// USERS & COMMENTS
// ============================================

async function loadUsers() {
  const tbody = document.getElementById('adminUsersTbody');
  try {
    const res = await fetch('/api/v1/admin/users');
    const users = await res.json();
    
    if(users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Kullanıcı bulunamadı.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <strong>${u.username}</strong>
          ${u.isBanned ? '<span class="badge badge-danger" style="margin-left:4px; font-size:10px;">Banlı</span>' : ''}
          ${u.muteUntil && new Date(u.muteUntil) > new Date() ? `<span class="badge badge-warning" style="margin-left:4px; font-size:10px;" title="Susturuldu: ${new Date(u.muteUntil).toLocaleString('tr-TR')}">Susturuldu</span>` : ''}
        </td>
        <td>${u.email}</td>
        <td>
          <select class="admin-select" onchange="changeUserRole('${u.id}', this.value)" ${u.isBanned ? 'disabled' : ''}>
            <option value="user" ${u.role === 'user' ? 'selected' : ''}>Kullanıcı</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Yönetici</option>
          </select>
        </td>
        <td>${u.xp || 0} XP</td>
        <td style="text-align:right;">
          ${u.isBanned 
            ? `<button class="admin-action-btn edit" onclick="toggleBan('${u.id}', false)" title="Banı Kaldır">Geri Al</button>`
            : `<button class="admin-action-btn delete" onclick="toggleBan('${u.id}', true)" title="Süresiz Banla">Ban</button>`
          }
          <button class="admin-action-btn edit" onclick="promptMute('${u.id}')" title="Sustur/Susturmayı Kaldır">Mute</button>
          <button class="admin-action-btn delete" onclick="deleteUser('${u.id}')" title="Hesabı Sil">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    console.error(e);
  }
}

window.changeUserRole = async (id, newRole) => {
  try {
    const res = await fetch(`/api/v1/admin/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    if(res.ok) showToast('Yetki güncellendi.', 'success');
    else showToast('Yetki güncellenemedi.', 'danger');
  } catch(e) {
    showToast('Hata.', 'danger');
  }
};

window.toggleBan = async (id, status) => {
  if (status && !confirm('Bu kullanıcıyı kalıcı olarak sistemden uzaklaştırmak (Ban) istediğinize emin misiniz?')) return;
  try {
    const res = await fetch(`/api/v1/admin/users/${id}/ban`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if(res.ok) {
      showToast(status ? 'Kullanıcı banlandı.' : 'Kullanıcının banı kaldırıldı.', 'success');
      loadUsers();
    }
  } catch(e) {
    showToast('Hata.', 'danger');
  }
};

window.promptMute = async (id) => {
  const hours = prompt('Kaç saat susturulsun? (Susturmayı kaldırmak için 0 yazın)');
  if (hours === null) return;
  try {
    const res = await fetch(`/api/v1/admin/users/${id}/mute`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: parseInt(hours) || 0 })
    });
    if(res.ok) {
      showToast('Kullanıcı susturulma durumu güncellendi.', 'success');
      loadUsers();
    }
  } catch(e) {
    showToast('Hata.', 'danger');
  }
};

window.deleteUser = async (id) => {
  if(!confirm('Bu kullanıcının hesabını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
  try {
    const res = await fetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' });
    if(res.ok) {
      showToast('Kullanıcı silindi.', 'success');
      loadUsers();
      loadDashboardStats();
    }
  } catch(e) {
    showToast('Hata.', 'danger');
  }
};

async function loadComments() {
  const container = document.getElementById('adminCommentsList');
  try {
    const res = await fetch('/api/v1/admin/comments');
    const comments = await res.json();
    
    if(comments.length === 0) {
      container.innerHTML = '<p style="color:var(--color-text-muted);">Henüz hiç yorum yapılmamış.</p>';
      return;
    }

    container.innerHTML = comments.reverse().map(c => `
      <div class="admin-comment-item">
        <div class="admin-comment-content">
          <div class="admin-comment-meta">
            <strong>${c.username}</strong> — <span style="color:var(--color-primary);">${c.slug}</span> (Bölüm ${c.chapter})
          </div>
          <div class="admin-comment-text">
            ${c.text}
          </div>
        </div>
        <button class="admin-action-btn delete" onclick="deleteComment('${c.id}')" title="Yorumu Sil">
           <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `).join('');
  } catch(e) {
    console.error(e);
  }
}

window.deleteComment = async (id) => {
  if(!confirm('Bu yorumu kalıcı olarak silmek istiyor musunuz?')) return;
  try {
    const res = await fetch(`/api/v1/admin/comments/${id}`, { method: 'DELETE' });
    if(res.ok) {
      showToast('Yorum silindi.', 'success');
      loadComments();
      loadDashboardStats();
    }
  } catch(e) {
    showToast('Hata.', 'danger');
  }
};

// ============================================
// SITE SETTINGS & MENUS LOGIC
// ============================================
let currentSettings = {};

async function loadCurrentSettings() {
  try {
    const res = await fetch('/api/v1/settings');
    currentSettings = await res.json();
    
    // Fill Settings Form
    if (currentSettings.theme) {
      document.getElementById('setPrimaryColor').value = currentSettings.theme.colorPrimary || '#8b5cf6';
      document.getElementById('setPrimaryColorText').value = currentSettings.theme.colorPrimary || '#8b5cf6';
      document.getElementById('setFontFamily').value = currentSettings.theme.fontFamily || "'Outfit', sans-serif";
    }

    if (currentSettings.announcement) {
      document.getElementById('annText').value = currentSettings.announcement.text || '';
      document.getElementById('annType').value = currentSettings.announcement.type || 'info';
      document.getElementById('annActive').checked = currentSettings.announcement.active || false;
    }

    renderAdminMenus();
  } catch (e) {
    console.error(e);
  }
}

function setupSettingsForm() {
  // Sync color picker and text input
  const colorPicker = document.getElementById('setPrimaryColor');
  const colorText = document.getElementById('setPrimaryColorText');
  colorPicker.addEventListener('input', (e) => colorText.value = e.target.value);
  colorText.addEventListener('input', (e) => colorPicker.value = e.target.value);

  const annForm = document.getElementById('announcementForm');
  if (annForm) {
    annForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        announcement: {
          text: document.getElementById('annText').value.trim(),
          type: document.getElementById('annType').value,
          active: document.getElementById('annActive').checked
        }
      };
      try {
        const res = await fetch('/api/v1/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast('Duyuru başarıyla güncellendi.', 'success');
        } else {
          showToast('Duyuru güncellenemedi.', 'danger');
        }
      } catch(err) {
        showToast('Sunucu hatası.', 'danger');
      }
    });
  }

  document.getElementById('siteSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const primary = colorPicker.value;
    const font = document.getElementById('setFontFamily').value;
    
    const themeUpdate = {
      theme: {
        colorPrimary: primary,
        colorPrimaryHover: primary, // Simplified
        colorPrimaryGlow: primary + '33', // 20% opacity hex
        fontFamily: font
      }
    };

    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeUpdate)
      });
      if (res.ok) {
        showToast('Site ayarları güncellendi! Kalıcı değişiklikler site geneline uygulandı.', 'success');
        // Apply instantly for preview
        document.documentElement.style.setProperty('--color-primary', primary);
        document.documentElement.style.setProperty('--font-family', font);
      } else {
        showToast('Güncelleme hatası.', 'danger');
      }
    } catch(err) {
      showToast('Sunucu hatası.', 'danger');
    }
  });
}

function setupMenusForm() {
  document.querySelector('.admin-nav-item[data-tab="settings"]').addEventListener('click', loadCurrentSettings);
  document.querySelector('.admin-nav-item[data-tab="menus"]').addEventListener('click', loadCurrentSettings);

  document.getElementById('btnAddSidebarLink').addEventListener('click', () => {
    currentSettings.sidebarLinks = currentSettings.sidebarLinks || [];
    currentSettings.sidebarLinks.push({ id: Date.now().toString(), title: 'Yeni Link', url: '#', icon: 'link' });
    renderAdminMenus();
  });

  document.getElementById('btnAddBottomLink').addEventListener('click', () => {
    currentSettings.bottomLinks = currentSettings.bottomLinks || [];
    currentSettings.bottomLinks.push({ id: Date.now().toString(), title: 'Yeni Link', url: '#', icon: 'link' });
    renderAdminMenus();
  });

  document.getElementById('btnSaveMenus').addEventListener('click', async () => {
    // Collect from inputs
    const sidebars = [];
    document.querySelectorAll('.admin-sidebar-item-row').forEach(row => {
      sidebars.push({
        id: row.dataset.id,
        title: row.querySelector('.menu-title').value,
        url: row.querySelector('.menu-url').value,
        icon: row.querySelector('.menu-icon').value
      });
    });

    const bottoms = [];
    document.querySelectorAll('.admin-bottom-item-row').forEach(row => {
      bottoms.push({
        id: row.dataset.id,
        title: row.querySelector('.menu-title').value,
        url: row.querySelector('.menu-url').value,
        icon: row.querySelector('.menu-icon').value
      });
    });

    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sidebarLinks: sidebars, bottomLinks: bottoms })
      });
      if (res.ok) {
        showToast('Menüler güncellendi! Sitenin menüleri kalıcı olarak değişti.', 'success');
        loadCurrentSettings();
      } else {
        showToast('Güncelleme hatası.', 'danger');
      }
    } catch(err) {
      showToast('Sunucu hatası.', 'danger');
    }
  });
}

function renderAdminMenus() {
  const sbContainer = document.getElementById('adminSidebarLinks');
  if (sbContainer && currentSettings.sidebarLinks) {
    sbContainer.innerHTML = currentSettings.sidebarLinks.map(link => `
      <div class="admin-sidebar-item-row" data-id="${link.id}" style="display:flex; gap:10px; background:rgba(255,255,255,0.05); padding:10px; border-radius:5px;">
        <input type="text" class="admin-input menu-title" value="${link.title}" placeholder="Başlık" style="flex:1;">
        <input type="text" class="admin-input menu-url" value="${link.url}" placeholder="URL" style="flex:1;">
        <select class="admin-input menu-icon" style="width:100px;">
          <option value="home" ${link.icon==='home'?'selected':''}>Home</option>
          <option value="catalog" ${link.icon==='catalog'?'selected':''}>Catalog</option>
          <option value="star" ${link.icon==='star'?'selected':''}>Star</option>
          <option value="new" ${link.icon==='new'?'selected':''}>New</option>
          <option value="link" ${link.icon==='link'?'selected':''}>Link</option>
        </select>
        <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>
      </div>
    `).join('');
  }

  const btContainer = document.getElementById('adminBottomLinks');
  if (btContainer && currentSettings.bottomLinks) {
    btContainer.innerHTML = currentSettings.bottomLinks.map(link => `
      <div class="admin-bottom-item-row" data-id="${link.id}" style="display:flex; gap:10px; background:rgba(255,255,255,0.05); padding:10px; border-radius:5px;">
        <input type="text" class="admin-input menu-title" value="${link.title}" placeholder="Başlık" style="flex:1;">
        <input type="text" class="admin-input menu-url" value="${link.url}" placeholder="URL" style="flex:1;">
        <select class="admin-input menu-icon" style="width:100px;">
          <option value="home" ${link.icon==='home'?'selected':''}>Home</option>
          <option value="catalog" ${link.icon==='catalog'?'selected':''}>Catalog</option>
          <option value="search" ${link.icon==='search'?'selected':''}>Search</option>
          <option value="library" ${link.icon==='library'?'selected':''}>Library</option>
          <option value="menu" ${link.icon==='menu'?'selected':''}>Menu</option>
          <option value="link" ${link.icon==='link'?'selected':''}>Link</option>
        </select>
        <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>
      </div>
    `).join('');
  }
}
