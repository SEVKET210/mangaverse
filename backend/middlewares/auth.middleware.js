import { db } from '../database.js';

export const requireAuth = (req, res, next) => {
  const session = req.cookies.user_session;
  if (!session) {
    return res.status(401).json({ error: 'Bu işlem için giriş yapmalısınız.' });
  }

  try {
    const sessionUser = JSON.parse(session);
    const user = db.findUser(sessionUser.username);
    if (!user) {
      return res.status(401).json({ error: 'Geçersiz oturum.' });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Oturum verisi bozuk.' });
  }
};

export const optionalAuth = (req, res, next) => {
  const session = req.cookies.user_session;
  if (session) {
    try {
      const sessionUser = JSON.parse(session);
      const user = db.findUser(sessionUser.username);
      if (user) {
        req.user = user;
      }
    } catch (e) {
      // Ignore corrupt optional session
    }
  }
  next();
};
