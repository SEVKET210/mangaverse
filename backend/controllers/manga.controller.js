import { MangaService } from '../services/manga.service.js';
import { CacheService } from '../utils/cache.js';
import RecommendationEngine from '../services/recommendation.service.js';
import { db } from '../database.js';

export class MangaController {
  static getList(req, res) {
    try {
      // LRU Cache Implementation for extreme performance
      const cacheKey = `manga_list_${JSON.stringify(req.query)}`;
      const cachedResponse = CacheService.get(cacheKey);

      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      const list = MangaService.getAll(req.query);
      
      CacheService.set(cacheKey, list, 1000 * 60 * 2); // 2 minutes cache for list

      return res.json(list);
    } catch (error) {
      return res.status(500).json({ error: 'Sunucu hatası: Liste getirilemedi.' });
    }
  }

  static getSingle(req, res) {
    try {
      const cacheKey = `manga_single_${req.params.slug}`;
      const cachedResponse = CacheService.get(cacheKey);

      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      const manga = MangaService.getBySlug(req.params.slug);
      
      if (!manga) {
        return res.status(404).json({ error: 'Manga bulunamadı' });
      }

      CacheService.set(cacheKey, manga, 1000 * 60 * 10); // 10 minutes cache for details

      return res.json(manga);
    } catch (error) {
      return res.status(500).json({ error: 'Sunucu hatası: Detay getirilemedi.' });
    }
  }

  static getRandom(req, res) {
    try {
      const mangas = MangaService.getAll({});
      if (!mangas || mangas.length === 0) {
        return res.status(404).json({ error: 'Manga bulunamadı' });
      }
      const randomManga = mangas[Math.floor(Math.random() * mangas.length)];
      return res.json({ slug: randomManga.slug });
    } catch (error) {
      return res.status(500).json({ error: 'Sunucu hatası: Rastgele manga getirilemedi.' });
    }
  }
  static getRecommended(req, res) {
    try {
      const allManga = MangaService.getAll();
      const sessionCookie = req.cookies && req.cookies.user_session;
      let userObj = null;
      if (sessionCookie) {
        try {
          const sessionUser = JSON.parse(sessionCookie);
          userObj = db.findUser(sessionUser.username);
        } catch (e) {}
      }
      const recommendations = RecommendationEngine.getRecommendations(userObj, allManga);
      return res.json(recommendations);
    } catch (error) {
      return res.status(500).json({ error: 'Öneriler getirilemedi.' });
    }
  }
}
