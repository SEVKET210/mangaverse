import express from 'express';
import { db } from '../database.js';

const router = express.Router();

const getSessionUser = (req) => {
  const session = req.cookies.user_session;
  if (!session) return null;
  try { return JSON.parse(session); } catch (e) { return null; }
};

// GET all guilds
router.get('/', (req, res) => {
  res.json(db.getGuilds());
});

// GET my guild details
router.get('/my', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  const user = db.findUser(sessionUser.username);
  if (!user || !user.guildId) return res.json(null);
  
  const guild = db.getGuild(user.guildId);
  return res.json(guild || null);
});

// POST create guild
router.post('/', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  const user = db.findUser(sessionUser.username);
  if (user.guildId) return res.status(400).json({ error: 'Zaten bir loncaya üyesiniz' });
  
  const { name } = req.body;
  if (!name || name.trim().length < 3) return res.status(400).json({ error: 'Lonca adı en az 3 karakter olmalıdır' });
  
  try {
    const newGuild = db.createGuild(name.trim(), user.username);
    return res.json(newGuild);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// POST join guild
router.post('/join/:id', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  const user = db.findUser(sessionUser.username);
  if (user.guildId) return res.status(400).json({ error: 'Zaten bir loncaya üyesiniz' });
  
  try {
    const guild = db.joinGuild(req.params.id, user.username);
    return res.json(guild);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// POST leave guild
router.post('/leave', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  
  db.leaveGuild(sessionUser.username);
  return res.json({ success: true });
});

// GET guild messages
router.get('/:id/messages', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  
  const guild = db.getGuild(req.params.id);
  if (!guild || !guild.members.includes(sessionUser.username)) {
    return res.status(403).json({ error: 'Yetkisiz erişim' });
  }
  
  const allMessages = db.getMessages();
  const guildMessages = allMessages.filter(m => m.guildName === guild.name);
  return res.json(guildMessages);
});

// POST send guild message
router.post('/:id/messages', (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Giriş yapmalısınız' });
  const user = db.findUser(sessionUser.username);
  if (user.isBanned || (user.muteUntil && new Date(user.muteUntil) > new Date())) {
    return res.status(403).json({ error: 'Susturulmuş hesap' });
  }
  
  const guild = db.getGuild(req.params.id);
  if (!guild || !guild.members.includes(user.username)) {
    return res.status(403).json({ error: 'Yetkisiz erişim' });
  }
  
  const { text } = req.body;
  if (!text || text.trim().length === 0) return res.status(400).json({ error: 'Mesaj boş' });
  
  const msg = db.addMessage(user.username, text.trim(), user.role, guild.name);
  return res.json(msg);
});

export default router;
