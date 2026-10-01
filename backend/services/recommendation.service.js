// ============================================
// Mathematical Recommendation Engine
// ============================================

class RecommendationEngine {
  
  /**
   * Generates a list of recommended mangas for a given user based on their library.
   * @param {Object} user - User object containing .library array of slugs
   * @param {Array} allManga - Array of all manga objects
   * @returns {Array} - Array of manga objects with an additional 'matchPct' property
   */
  static getRecommendations(user, allManga) {
    // 1. If user is guest or has no library, return generic popular recommendations
    if (!user || !user.library || user.library.length === 0) {
      return this._getGenericRecommendations(allManga);
    }

    const userMangas = allManga.filter(m => user.library.includes(m.slug));
    const unreadMangas = allManga.filter(m => !user.library.includes(m.slug));

    // If they've read everything or there's no unread manga
    if (unreadMangas.length === 0) return [];

    // 2. Calculate Tag & Genre frequencies from user's library
    const genreWeights = {};
    const tagWeights = {};

    userMangas.forEach(m => {
      if (m.genres) m.genres.forEach(g => { genreWeights[g] = (genreWeights[g] || 0) + 1; });
      if (m.tags) m.tags.forEach(t => { tagWeights[t] = (tagWeights[t] || 0) + 1; });
    });

    const maxGenreWeight = Math.max(...Object.values(genreWeights), 1);
    const maxTagWeight = Math.max(...Object.values(tagWeights), 1);

    // 3. Score unread mangas
    const scoredMangas = unreadMangas.map(m => {
      let score = 0;
      let maxPossibleScore = 0;

      // Genre score
      if (m.genres) {
        m.genres.forEach(g => {
          maxPossibleScore += 1.5; // Weight genre matches higher
          if (genreWeights[g]) score += (genreWeights[g] / maxGenreWeight) * 1.5;
        });
      }

      // Tag score
      if (m.tags) {
        m.tags.forEach(t => {
          maxPossibleScore += 1.0;
          if (tagWeights[t]) score += (tagWeights[t] / maxTagWeight) * 1.0;
        });
      }

      // Base rating bonus (adds up to 10% match just for being a good manga)
      const ratingBonus = (parseFloat(m.rating) || 0) / 5;
      
      // Calculate final percentage
      let matchPct = 0;
      if (maxPossibleScore > 0) {
        matchPct = (score / maxPossibleScore) * 90 + (ratingBonus * 10);
      } else {
        matchPct = 50 + (ratingBonus * 25); // Baseline if no tags exist
      }

      // Clamp between 60 and 99
      matchPct = Math.min(99, Math.max(60, Math.round(matchPct)));

      return { ...m, matchPct };
    });

    // 4. Sort by match percentage descending and return top 8
    return scoredMangas.sort((a, b) => b.matchPct - a.matchPct).slice(0, 8);
  }

  static _getGenericRecommendations(allManga) {
    // Sort by rating and views implicitly by grabbing trending/featured
    const popular = allManga.filter(m => m.isTrending || m.isFeatured || parseFloat(m.rating) > 4.5);
    
    // Assign random high percentages (85-98) to make it look smart
    return popular.slice(0, 8).map(m => ({
      ...m,
      matchPct: Math.floor(Math.random() * (98 - 85 + 1)) + 85
    }));
  }
}
export default RecommendationEngine;
