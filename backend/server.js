import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import { db, hashPassword } from './database.js';
import mangaRoutes from './routes/manga.routes.js';
import adminRoutes from './routes/admin.routes.js';
import guildRoutes from './routes/guild.routes.js';
import { GamificationService } from './services/gamification.service.js';
import RecommendationEngine from './services/recommendation.service.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// ENTERPRISE MIDDLEWARES
// ============================================
// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // For local dev, allow inline scripts
}));

// CORS
app.use(cors({
  origin: '*', // Adjust for production
  credentials: true
}));

// GZIP / Brotli Compression
app.use(compression({
  level: 6,
  threshold: 0,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Body & Cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================
app.use('/api', (req, res, next) => {
  if (!req.url.startsWith('/v1/')) {
    req.url = '/v1' + req.url;
  }
  next();
});

app.use('/api/v1/manga', mangaRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/guilds', guildRoutes);

app.get('/api/v1/settings', (req, res) => {
  return res.json(db.getSettings());
});

// Helper for Session
const getSessionUser = (req) => {
  const session = req.cookies.user_session;
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
};

// Legacy Auth Routes (To be modularized in Phase 3.2 if needed)
app.post('/api/v1/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Tüm alanları doldurmak zorunludur' });
  const existing = db.findUser(username) || db.findUser(email);
  if (existing) return res.status(400).json({ error: 'Kullanıcı adı veya e-posta zaten kullanımda' });
  const user = db.createUser({ username, email, password });
  res.cookie('user_session', JSON.stringify({ id: user.id, username: user.username }), { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });
  return res.json({ success: true, user: { username: user.username, email: user.email } });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) return res.status(400).json({ error: 'Kullanıcı adı/E-posta ve şifre gereklidir' });
  const user = db.findUser(usernameOrEmail);
  if (!user || user.password !== hashPassword(password)) return res.status(400).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
  
  if (user.isBanned) return res.status(403).json({ error: 'Hesabınız kalıcı olarak yasaklanmıştır.' });
  
  res.cookie('user_session', JSON.stringify({ id: user.id, username: user.username }), { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });
  return res.json({ success: true, user: { username: user.username, email: user.email } });
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.clearCookie('user_session');
  return res.json({ success: true });
});

app.get('/api/v1/auth/me', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.json({ loggedIn: false });
  const user = db.findUser(sessionUser.username);
  if (!user) return res.json({ loggedIn: false });
  
  const xp = user.xp || 0;
  return res.json({
    loggedIn: true,
    user: { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role,
      isBanned: user.isBanned,
      muteUntil: user.muteUntil,
      library: user.library || [], 
      favorites: user.favorites || [], 
      reading_lists: user.reading_lists || { reading: [], completed: [], dropped: [], plan_to_read: [] },
      avatar: user.avatar || '',
      cover_image: user.cover_image || '',
      achievements: user.achievements || [], 
      joined: user.joined,
      xp: xp,
      level: GamificationService.getLevel(xp),
      title: GamificationService.getTitle(xp),
      nextLevelXp: GamificationService.getNextLevelXP(GamificationService.getLevel(xp)),
      guildId: user.guildId,
      stats: {
        commentCount: db.getComments().filter(c => c.username === user.username).length,
        readCount: db.getUserProgress(user.username).length
      }
    }
  });
});


// ============================================
// LIBRARY & LISTS ENDPOINTS
// ============================================
app.post('/api/v1/library/toggle', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  
  const slug = req.body.slug;
  const listName = req.body.listName || req.body.listType;
  
  if (!slug || !listName) return res.status(400).json({ error: 'Geçersiz parametreler' });
  
  const users = db.getUsers();
  const uIdx = users.findIndex(u => u.username === sessionUser.username);
  if (uIdx === -1) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  
  const user = users[uIdx];
  user.library = user.library || [];
  user.favorites = user.favorites || [];
  user.reading_lists = user.reading_lists || { reading: [], completed: [], dropped: [], plan_to_read: [] };
  
  let active = false;
  
  if (listName === 'library') {
    if (user.library.includes(slug)) {
      user.library = user.library.filter(s => s !== slug);
    } else {
      user.library.push(slug);
      active = true;
    }
  } else if (listName === 'favorites') {
    if (user.favorites.includes(slug)) {
      user.favorites = user.favorites.filter(s => s !== slug);
    } else {
      user.favorites.push(slug);
      active = true;
    }
  } else if (['reading', 'completed', 'dropped', 'plan_to_read'].includes(listName)) {
    const list = user.reading_lists[listName];
    if (list.includes(slug)) {
      user.reading_lists[listName] = list.filter(s => s !== slug);
    } else {
      user.reading_lists[listName].push(slug);
      active = true;
      // Option: Remove from other reading lists if added to one (exclusive lists)
      ['reading', 'completed', 'dropped', 'plan_to_read'].forEach(other => {
        if (other !== listName) {
          user.reading_lists[other] = user.reading_lists[other].filter(s => s !== slug);
        }
      });
    }
  } else {
    return res.status(400).json({ error: 'Geçersiz liste adı' });
  }
  
  db.saveUsers(users);
  return res.json({ success: true, active });
});

// ============================================
// LIVE PRESENCE SYSTEM
// ============================================
// Stores active readers: { "slug_chapter": { "username": timestamp } }
const activeReaders = {};

app.post('/api/v1/presence/:slug/:chapter', (req, res) => {
  const { slug, chapter } = req.params;
  const sessionUser = getSessionUser(req);
  const readerId = sessionUser ? sessionUser.username : `guest_${Math.random().toString(36).substr(2, 9)}`;
  
  const room = `${slug}_${chapter}`;
  if (!activeReaders[room]) activeReaders[room] = {};
  
  // Update timestamp for this reader
  activeReaders[room][readerId] = Date.now();
  
  // Cleanup stale readers (older than 30 seconds)
  let count = 0;
  const now = Date.now();
  for (const [id, time] of Object.entries(activeReaders[room])) {
    if (now - time > 30000) {
      delete activeReaders[room][id];
    } else {
      count++;
    }
  }
  
  return res.json({ viewers: count });
});




app.get('/api/v1/comments/:slug/:chapter', (req, res) => {
  const { slug, chapter } = req.params;
  return res.json(db.getCommentsForChapter(slug, chapter));
});

const BAD_WORDS = ['amk', 'aq', 'sik', 'siktir', 'orospu', 'piç', 'yarak', 'yarrak'];

app.post('/api/v1/comments/:slug/:chapter', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Yorum yapmak için giriş yapmalısınız' });
  
  const user = db.findUser(sessionUser.username);
  if (user.isBanned) return res.status(403).json({ error: 'Hesabınız yasaklı olduğu için yorum yapamazsınız' });
  if (user.muteUntil && new Date(user.muteUntil) > new Date()) return res.status(403).json({ error: `Hesabınız susturulmuş. Süre bitimi: ${new Date(user.muteUntil).toLocaleString('tr-TR')}` });

  const { slug, chapter } = req.params;
  let { text, parentId, isSpoiler } = req.body;
  if (!text || text.trim().length === 0) return res.status(400).json({ error: 'Yorum boş bırakılamaz' });
  
  const lowerText = text.toLowerCase();
  for (const bw of BAD_WORDS) {
    if (lowerText.includes(bw)) {
      return res.status(400).json({ error: 'Yorumunuz argo kelimeler içerdiği için reddedildi.' });
    }
  }
  
  const comment = db.addComment({ 
    slug, 
    chapter: parseInt(chapter) || 0, 
    username: sessionUser.username, 
    text: text.trim(),
    parentId: parentId || null,
    isSpoiler: isSpoiler || false
  });
  return res.json(comment);
});

app.post('/api/v1/comments/vote/:id', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  const { voteType } = req.body; // 'upvote' or 'downvote'
  if (!['upvote', 'downvote'].includes(voteType)) return res.status(400).json({ error: 'Geçersiz oy türü' });
  
  const updated = db.voteComment(req.params.id, sessionUser.username, voteType);
  if (!updated) return res.status(404).json({ error: 'Yorum bulunamadı' });
  return res.json(updated);
});

app.get('/api/v1/progress', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.json([]);
  return res.json(db.getUserProgress(sessionUser.username));
});

app.get('/api/v1/progress/recent', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' });
  
  const progressList = db.getUserProgress(sessionUser.username);
  if (!progressList || progressList.length === 0) {
    return res.json({ recent: null });
  }

  // Sort by timestamp descending
  progressList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const recent = progressList[0];
  
  // Attach manga details
  const allManga = db.getManga();
  const mangaDetails = allManga.find(m => m.slug === recent.slug);
  
  if (!mangaDetails) return res.json({ recent: null });

  return res.json({
    recent: {
      ...recent,
      mangaTitle: mangaDetails.title,
      cover: mangaDetails.cover
    }
  });
});

app.post('/api/v1/progress', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.json({ success: false });
  const { slug, chapter, page } = req.body;
  if (!slug || !chapter) return res.status(400).json({ error: 'Geçersiz parametreler' });
  const entry = db.updateProgress(sessionUser.username, slug, chapter, page);
  return res.json({ success: true, entry });
});


// ============================================
// CHAT & GUILD ENDPOINTS
// ============================================

app.get('/api/v1/chat', (req, res) => {
  res.json(db.getMessages());
});

app.post('/api/v1/chat', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  const user = db.findUser(sessionUser.username);
  const text = req.body.text;
  if (!text || text.trim() === '') return res.status(400).json({ error: 'Boş mesaj gönderilemez' });
  
  let guildName = null;
  if (user.guildId) {
    const guild = db.getGuild(user.guildId);
    if (guild) guildName = guild.name;
  }
  
  const msg = db.addMessage(user.username, text.trim(), user.role, guildName);
  res.json(msg);
});

app.get('/api/v1/guilds', (req, res) => {
  res.json(db.getGuilds());
});

app.post('/api/v1/guilds', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  
  const user = db.findUser(sessionUser.username);
  if (user.guildId) return res.status(400).json({ error: 'Zaten bir loncadasınız' });
  
  const name = req.body.name;
  if (!name || name.trim().length < 3) return res.status(400).json({ error: 'Lonca adı en az 3 karakter olmalı' });
  
  try {
    const guild = db.createGuild(name.trim(), user.username);
    res.json({ success: true, guild });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/v1/guilds/join/:id', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  
  const user = db.findUser(sessionUser.username);
  if (user.guildId) return res.status(400).json({ error: 'Zaten bir loncadasınız' });
  
  const guild = db.getGuild(req.params.id);
  if (!guild) return res.status(404).json({ error: 'Lonca bulunamadı' });
  
  const guilds = db.getGuilds();
  const gIdx = guilds.findIndex(g => g.id === req.params.id);
  guilds[gIdx].members.push(user.username);
  db.saveGuilds(guilds);
  
  const users = db.getUsers();
  const uIdx = users.findIndex(u => u.username === user.username);
  users[uIdx].guildId = guild.id;
  db.saveUsers(users);
  
  res.json({ success: true, guild: guilds[gIdx] });
});

// ============================================
// FRONTEND SERVING (STATIC & VIEWS)
// ============================================
const frontendPath = path.resolve(process.cwd(), 'frontend');

// Protect admin.html from unauthorized access at the server level
app.get('/admin.html', (req, res, next) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    return res.redirect('/giris.html');
  }
  const user = db.findUser(sessionUser.username);
  if (!user || user.role !== 'admin') {
    return res.redirect('/');
  }
  next();
});

app.use(express.static(frontendPath, {
  // Disable caching during development to prevent UI breakages
  maxAge: 0,
  setHeaders: (res, path, stat) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
}));

app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (['api', 'css', 'js', 'images', 'data'].includes(page)) return next();
  
  const filePath = path.resolve(frontendPath, `${page}.html`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// ============================================
// ADMIN API ENDPOINTS
// ============================================

// Middleware for admin routes
function requireAdmin(req, res, next) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  const user = db.findUser(sessionUser.username);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Yetkisiz erişim' });
  }
  next();
}

app.post('/api/v1/admin/manga', requireAdmin, (req, res) => {
  const allManga = db.getManga();
  const newManga = req.body;
  newManga.slug = newManga.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  newManga.rating = newManga.rating || "0.0";
  newManga.chapters = newManga.chapters || 0;
  
  if (allManga.find(m => m.slug === newManga.slug)) {
    return res.status(400).json({ error: 'Bu manga zaten var' });
  }
  
  const savedManga = db.addManga(newManga);
  return res.json({ success: true, manga: savedManga });
});

app.delete('/api/v1/admin/manga/:slug', requireAdmin, (req, res) => {
  db.deleteManga(req.params.slug);
  res.json({ success: true });
});

// Admin Users
app.get('/api/v1/admin/users', requireAdmin, (req, res) => {
  // Strip passwords
  const users = db.getUsers().map(u => ({
    id: u.id, username: u.username, email: u.email, role: u.role, xp: u.xp, joined: u.joined, guildId: u.guildId, isBanned: u.isBanned, muteUntil: u.muteUntil
  }));
  res.json(users);
});

app.delete('/api/v1/admin/users/:id', requireAdmin, (req, res) => {
  db.deleteUser(req.params.id);
  res.json({ success: true });
});

app.put('/api/v1/admin/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  const updated = db.updateUserRole(req.params.id, role);
  if(!updated) return res.status(404).json({error: 'Kullanıcı bulunamadı'});
  res.json({ success: true, user: { id: updated.id, role: updated.role } });
});

app.put('/api/v1/admin/users/:id/ban', requireAdmin, (req, res) => {
  const { status } = req.body;
  const updated = db.banUser(req.params.id, status);
  if(!updated) return res.status(404).json({error: 'Kullanıcı bulunamadı'});
  res.json({ success: true, isBanned: updated.isBanned });
});

app.put('/api/v1/admin/users/:id/mute', requireAdmin, (req, res) => {
  const { hours } = req.body;
  const updated = db.muteUser(req.params.id, parseInt(hours) || 0);
  if(!updated) return res.status(404).json({error: 'Kullanıcı bulunamadı'});
  res.json({ success: true, muteUntil: updated.muteUntil });
});

// Admin Comments
app.get('/api/v1/admin/comments', requireAdmin, (req, res) => {
  res.json(db.getComments());
});

app.delete('/api/v1/admin/comments/:id', requireAdmin, (req, res) => {
  db.deleteComment(req.params.id);
  res.json({ success: true });
});

// Fallback all routes to frontend index
app.get('*', (req, res) => {
  res.sendFile(path.resolve(frontendPath, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Enterprise MangaVerse API listening on: http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const ALT_PORT = 3001;
    app.listen(ALT_PORT, () => console.log(`🚀 Enterprise MangaVerse API fallback on: http://localhost:${ALT_PORT}`));
  } else {
    console.error('Server startup error:', err);
  }
});
