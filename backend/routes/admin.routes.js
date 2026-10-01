import express from 'express';
import { db } from '../database.js';

const router = express.Router();

// Middleware to protect admin routes
const isAdmin = (req, res, next) => {
  const session = req.cookies && req.cookies.user_session;
  if (!session) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  try {
    const sessionUser = JSON.parse(session);
    const user = db.findUser(sessionUser.username);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Oturum hatası' });
  }
};

router.use(isAdmin);

// --- Settings Management ---
router.post('/settings', (req, res) => {
  const currentSettings = db.getSettings();
  const newSettings = { ...currentSettings, ...req.body };
  db.saveSettings(newSettings);
  return res.json({ success: true, settings: newSettings });
});

// --- Manga Management ---
router.post('/manga', (req, res) => {
  const { title, slug, author, cover, genres, statusLabel, chapters, rating, description } = req.body;
  if (!title || !slug) return res.status(400).json({ error: 'Title ve slug zorunludur' });
  
  const manga = {
    title,
    slug,
    author: author || 'Bilinmiyor',
    cover: cover || '',
    genres: genres ? genres.split(',').map(g => g.trim()) : [],
    status: statusLabel === 'Tamamlandı' ? 'completed' : 'ongoing',
    statusLabel: statusLabel || 'Devam Ediyor',
    chapters: parseInt(chapters) || 0,
    lastChapter: parseInt(chapters) || 0,
    rating: parseFloat(rating) || 0,
    description: description || '',
    views: 0,
    follows: 0,
    year: new Date().getFullYear(),
    isNew: true,
    trending: false
  };

  const saved = db.addManga(manga);
  return res.json({ success: true, manga: saved });
});

router.put('/manga/:id', (req, res) => {
  const updated = db.updateManga(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Manga bulunamadı' });
  return res.json({ success: true, manga: updated });
});

router.delete('/manga/:id', (req, res) => {
  const success = db.deleteManga(req.params.id);
  return res.json({ success });
});

export default router;
