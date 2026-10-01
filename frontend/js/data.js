/* ============================================
   MangaVerse — Frontend Mock Data & Helpers
   ============================================ */

export const GENRES = [
  { id: 'aksiyon',       name: 'Aksiyon',       icon: '⚔️',  color: '#EF4444' },
  { id: 'romantizm',     name: 'Romantizm',     icon: '💖',  color: '#EC4899' },
  { id: 'fantezi',       name: 'Fantezi',       icon: '✨',  color: '#8B5CF6' },
  { id: 'isekai',        name: 'Isekai',        icon: '🌀',  color: '#6366F1' },
  { id: 'murim',         name: 'Murim',         icon: '🥋',  color: '#F59E0B' },
  { id: 'reenkarnasyon', name: 'Reenkarnasyon', icon: '♻️',  color: '#10B981' },
  { id: 'korku',         name: 'Korku',         icon: '👻',  color: '#374151' },
  { id: 'komedi',        name: 'Komedi',        icon: '😂',  color: '#FBBF24' },
  { id: 'dram',          name: 'Dram',          icon: '🎭',  color: '#6366F1' },
  { id: 'macera',        name: 'Macera',        icon: '🗺️',  color: '#3B82F6' },
  { id: 'spor',          name: 'Spor',          icon: '⚽',  color: '#10B981' },
  { id: 'bilim-kurgu',   name: 'Bilim Kurgu',   icon: '🚀',  color: '#06B6D4' },
  { id: 'oyun',          name: 'Oyun',          icon: '🎮',  color: '#A855F7' },
  { id: 'psikolojik',    name: 'Psikolojik',    icon: '🧠',  color: '#78716C' },
  { id: 'zindan',        name: 'Zindan',        icon: '🏰',  color: '#92400E' },
  { id: 'super-kahraman',name: 'Süper Kahraman',icon: '🦸',  color: '#DC2626' },
  { id: 'gerilim',       name: 'Gerilim',       icon: '⚡',  color: '#F59E0B' },
  { id: 'tarihi',        name: 'Tarihi',        icon: '📜',  color: '#78716C' },
];

export const HERO_SLIDES = [
  {
    id: 1,
    title: 'Solo Leveling',
    author: 'Chugong & DUBU',
    description: 'Dünyanın en zayıf avcısı Sung Jin-Woo, gizemli bir zindan sistemi ile karşılaşır ve tek başına seviye atlamaya başlar. Ölümün eşiğinden dönen Jin-Woo, efsanevi bir güce ulaşmak için zorlu bir yolculuğa çıkar.',
    coverGradient: 'linear-gradient(135deg, #120324 0%, #291556 50%, #050308 100%)',
    status: 'Tamamlandı',
    genres: ['Aksiyon', 'Fantezi'],
    chapters: 201,
    rating: 9.5,
    slug: 'solo-leveling',
    firstChapter: 1,
    lastChapter: 201,
    cover: 'https://cdn.myanimelist.net/images/manga/3/222295.jpg'
  },
  {
    id: 2,
    title: 'Attack on Titan',
    author: 'Hajime Isayama',
    description: 'İslamlığın devasa duvarlar arkasında yaşadığı bir dünyada, Eren Yeager devlere karşı savaşmaya yemin eder. Gerçeğin peşinden koşan bu epik yolculuk, insanlığın sırlarını gün yüzüne çıkaracaktır.',
    coverGradient: 'linear-gradient(135deg, #1f0505 0%, #6b0c0c 50%, #050303 100%)',
    status: 'Tamamlandı',
    genres: ['Aksiyon', 'Dram'],
    chapters: 139,
    rating: 9.8,
    slug: 'attack-on-titan',
    firstChapter: 1,
    lastChapter: 139,
    cover: 'https://cdn.myanimelist.net/images/manga/2/37846.jpg'
  },
  {
    id: 3,
    title: 'One Piece',
    author: 'Eiichiro Oda',
    description: 'Korsan kral olmak isteyen Luffy ve nakamalarının macerası! Efsanevi hazineye ulaşmak için büyük denizlerde zorlu bir yolculuk başlıyor.',
    coverGradient: 'linear-gradient(135deg, #020f1f 0%, #07356b 50%, #010408 100%)',
    status: 'Devam Ediyor',
    genres: ['Aksiyon', 'Macera'],
    chapters: 1110,
    rating: 9.9,
    slug: 'one-piece',
    firstChapter: 1,
    lastChapter: 1110,
    cover: 'https://cdn.myanimelist.net/images/manga/2/253146.jpg'
  }
];

export const ANNOUNCEMENTS = [
  { id: 1, title: '🎉 MangaVerse 3.0 Yayında!', time: '5 dakika önce', category: 'Sistem' },
  { id: 2, title: '⚙️ Yeni Sol Menü Tasarımı Aktif Edildi', time: '1 saat önce', category: 'Tasarım' },
  { id: 3, title: '🚀 Hızlı Hover Önbellekleme Altyapısı Aktif', time: '3 saat önce', category: 'Performans' },
  { id: 4, title: '📱 Mobil Alt Bar & Çekmece Desteği Eklendi', time: '5 saat önce', category: 'Mobil' },
  { id: 5, title: '💎 Reklamsız Premium Okuma Modu Açıldı', time: '1 gün önce', category: 'Özellik' }
];

export const ACHIEVEMENTS = [
  { id: 1, name: 'İlk Okuma', icon: '📖', desc: 'İlk manga bölümünü oku', unlocked: true },
  { id: 2, name: 'Manga Kurdu', icon: '🐛', desc: '10 seri tamamla', unlocked: true },
  { id: 3, name: 'Koleksiyoner', icon: '🗂️', desc: '50 seri favorilere ekle', unlocked: false },
  { id: 4, name: 'Maratoncu', icon: '🏃', desc: '100 bölüm oku', unlocked: false },
  { id: 5, name: 'Gece Kuşu', icon: '🦉', desc: 'Gece yarısı okuma', unlocked: false },
  { id: 6, name: 'Eleştirmen', icon: '⭐', desc: '20 seri puanla', unlocked: false }
];

// Helper functions
export function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export function getStatusClass(status) {
  const map = { completed: 'badge-completed', ongoing: 'badge-ongoing', hiatus: 'badge-hiatus' };
  return map[status] || 'badge-ghost';
}

export function getGenreName(id) {
  const names = {
    aksiyon:'Aksiyon', romantizm:'Romantizm', fantezi:'Fantezi', isekai:'Isekai',
    murim:'Murim', reenkarnasyon:'Reenkarnasyon', korku:'Korku', komedi:'Komedi',
    dram:'Dram', macera:'Macera', spor:'Spor', 'bilim-kurgu':'Bilim Kurgu',
    oyun:'Oyun', psikolojik:'Psikolojik', zindan:'Zindan',
    'super-kahraman':'Süper Kahraman', gerilim:'Gerilim', tarihi:'Tarihi'
  };
  return names[id] || id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ');
}
