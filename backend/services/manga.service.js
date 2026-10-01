import { db } from '../database.js';

export class MangaService {
  static getAll(query = {}) {
    let list = db.getManga();
    const { genre, status, q, sort } = query;

    if (q) {
      const term = q.toLowerCase();
      list = list.filter(m => m.title.toLowerCase().includes(term) || (m.altTitle && m.altTitle.toLowerCase().includes(term)) || m.author.toLowerCase().includes(term));
    }

    if (genre) {
      list = list.filter(m => m.genres.includes(genre));
    }

    if (status) {
      list = list.filter(m => m.status === status);
    }

    // High performance sorting
    if (sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'updated' || sort === 'new') {
      list.sort((a, b) => b.id - a.id);
    } else if (sort === 'az') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => b.views - a.views);
    }

    return list;
  }

  static getBySlug(slug) {
    return db.getManga().find(m => m.slug === slug);
  }
}
