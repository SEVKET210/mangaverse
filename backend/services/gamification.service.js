export class GamificationService {
  static getTitle(xp) {
    if (xp >= 5000) return 'Ulusal Avcı';
    if (xp >= 2000) return 'Sınıf S';
    if (xp >= 1000) return 'Gölge Avcısı';
    if (xp >= 500) return 'Kıdemli Okuyucu';
    if (xp >= 100) return 'Manga Kurdu';
    return 'Çaylak Okuyucu';
  }

  static getLevel(xp) {
    // Basic logarithmic scaling for levels
    return Math.floor(Math.sqrt(xp / 10)) + 1;
  }

  static getNextLevelXP(level) {
    return Math.pow(level, 2) * 10;
  }
}
