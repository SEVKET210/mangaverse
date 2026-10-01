/* ============================================
   MangaVerse — Lightweight JSON Database
   ============================================ */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve('./data');

// Add initial mangas if not exists
const MANGAS_FILE = path.join(DATA_DIR, 'mangas.json');
if (!fs.existsSync(MANGAS_FILE)) {
  const defaultMangas = [
    {
      "id": "1",
      "title": "Solo Leveling",
      "slug": "solo-leveling",
      "author": "Chugong",
      "artist": "DUBU",
      "rating": "4.9",
      "chapters": 179,
      "lastChapter": 179,
      "status": "Tamamlandı",
      "cover": "https://manga-tr.com/image/poster/solo-leveling.jpg",
      "banner": "https://images.alphacoders.com/133/1338690.png",
      "synopsis": "On yıl önce, gerçek dünya ile canavarların yaşadığı boyutları birbirine bağlayan \"Kapı\" (Gate) açıldı. Dünyayı korumak için bazı sıradan insanlar uyanarak özel güçler kazandı. Bu kişilere \"Avcı\" deniyor. Sung Jin-Woo ise E-Serisi, yani en zayıf avcıdır.",
      "genres": ["Aksiyon", "Macera", "Fantezi"],
      "tags": ["Sistem", "Seviye Atlama", "Büyü", "Zindan", "Canavarlar", "Reenkarnasyon"],
      "views": "2.4M",
      "year": 2018,
      "isTrending": true,
      "isNew": false,
      "isFeatured": true
    },
    {
      "id": "2",
      "title": "One Piece",
      "slug": "one-piece",
      "author": "Eiichiro Oda",
      "artist": "Eiichiro Oda",
      "rating": "4.8",
      "chapters": 1100,
      "lastChapter": 1100,
      "status": "Devam Ediyor",
      "cover": "https://manga-tr.com/image/poster/one-piece.jpg",
      "banner": "https://images.alphacoders.com/132/1329188.jpeg",
      "synopsis": "Gol D. Roger, her şeyi elde etmiş efsanevi Korsanlar Kralı'dır. İdam edilmeden önceki son sözleri, okyanusun en büyük hazinesi 'One Piece'i bulmaya yönelik tüm dünyada büyük bir çağ başlatır.",
      "genres": ["Aksiyon", "Macera", "Komedi"],
      "tags": ["Korsanlar", "Süper Güçler", "Dostluk", "Denizler"],
      "views": "5.1M",
      "year": 1997,
      "isTrending": true,
      "isNew": false,
      "isFeatured": false
    },
    {
      "id": "3",
      "title": "Jujutsu Kaisen",
      "slug": "jujutsu-kaisen",
      "author": "Gege Akutami",
      "artist": "Gege Akutami",
      "rating": "4.7",
      "chapters": 240,
      "lastChapter": 240,
      "status": "Devam Ediyor",
      "cover": "https://manga-tr.com/image/poster/jujutsu-kaisen.jpg",
      "banner": "https://images.alphacoders.com/131/1317424.jpeg",
      "synopsis": "Yuji Itadori, inanılmaz bir fiziksel yeteneğe sahip sıradan bir lise öğrencisidir. Bir gün, okuldaki Okültizm Kulübü'ndeki arkadaşları 'Lanet' denilen varlıkların mühürlendiği bir nesneyi açarlar ve dehşet verici olaylar başlar.",
      "genres": ["Aksiyon", "Doğaüstü", "Korku"],
      "tags": ["Lanetler", "Okül", "Okul Hayatı", "Büyü"],
      "views": "1.8M",
      "year": 2018,
      "isTrending": false,
      "isNew": true,
      "isFeatured": false
    }
  ];
  fs.writeFileSync(MANGAS_FILE, JSON.stringify(defaultMangas, null, 2), 'utf8');
}

// Add default settings if not exists
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
if (!fs.existsSync(SETTINGS_FILE)) {
  const defaultSettings = {
    theme: {
      colorPrimary: "#8b5cf6",
      colorPrimaryHover: "#7c3aed",
      colorPrimaryGlow: "rgba(139, 92, 246, 0.2)",
      fontFamily: "'Outfit', sans-serif"
    },
    sidebarLinks: [
      { id: "1", title: "Anasayfa", url: "index.html", icon: "home" },
      { id: "2", title: "Katalog", url: "katalog.html", icon: "catalog" },
      { id: "3", title: "Trendler", url: "katalog.html?sort=trending", icon: "trending" },
      { id: "4", title: "En Yüksek Puan", url: "katalog.html?sort=rating", icon: "star" },
      { id: "5", title: "Yeni Eklenenler", url: "katalog.html?sort=new", icon: "new" }
    ],
    bottomLinks: [
      { id: "1", title: "Anasayfa", url: "index.html", icon: "home" },
      { id: "2", title: "Katalog", url: "katalog.html", icon: "catalog" },
      { id: "3", title: "Ara", url: "#", icon: "search", customId: "mobileNavSearch" },
      { id: "4", title: "Kitaplık", url: "profil.html?tab=library", icon: "library" },
      { id: "5", title: "Menü", url: "#", icon: "menu", customId: "mobileNavMore" }
    ]
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), 'utf8');
}

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database helper functions
const getFilePath = (filename) => path.join(DATA_DIR, `${filename}.json`);

const readData = (filename) => {
  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error(`Error reading database file: ${filename}`, error);
    return [];
  }
};

const writeData = (filename, data) => {
  const filePath = getFilePath(filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing database file: ${filename}`, error);
    return false;
  }
};

// Simple secure hash function
export const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Database interface
export const db = {
  // --- Settings ---
  getSettings: () => {
    let settings = readData('settings');
    if (Array.isArray(settings) && settings.length === 0) settings = {};
    settings.announcement = settings.announcement || { text: "", active: false, type: "info" };
    return settings;
  },
  saveSettings: (settings) => writeData('settings', settings),
  
  // --- Mangas ---
  getManga: () => readData('mangas'),
  saveManga: (mangas) => writeData('mangas', mangas),
  addManga: (manga) => {
    const mangas = readData('mangas');
    manga.id = crypto.randomUUID();
    mangas.push(manga);
    writeData('mangas', mangas);
    return manga;
  },
  updateManga: (id, updates) => {
    const mangas = readData('mangas');
    const index = mangas.findIndex(m => m.id === id);
    if (index !== -1) {
      mangas[index] = { ...mangas[index], ...updates };
      writeData('mangas', mangas);
      return mangas[index];
    }
    return null;
  },
  deleteManga: (id) => {
    const mangas = readData('mangas');
    const filtered = mangas.filter(m => m.id !== id);
    writeData('mangas', filtered);
    return true;
  },

  // --- Users ---
  getUsers: () => readData('users'),
  saveUsers: (users) => writeData('users', users),
  findUser: (usernameOrEmail) => {
    const users = readData('users');
    const term = usernameOrEmail.toLowerCase();
    return users.find(u => u.username.toLowerCase() === term || u.email.toLowerCase() === term);
  },
  createUser: (user) => {
    const users = readData('users');
    user.id = crypto.randomUUID();
    user.password = hashPassword(user.password);
    
    // First user is admin, others are user
    user.role = users.length === 0 ? 'admin' : 'user';
    
    user.library = user.library || [];
    user.favorites = user.favorites || [];
    user.reading_lists = user.reading_lists || {
      reading: [],
      completed: [],
      dropped: [],
      plan_to_read: []
    };
    user.avatar = user.avatar || '';
    user.cover_image = user.cover_image || '';
    user.achievements = user.achievements || [];
    user.xp = user.xp || 0;
    user.guildId = null; // New guild tracking
    user.isBanned = false;
    user.muteUntil = null;
    
    user.joined = new Date().toISOString();
    users.push(user);
    writeData('users', users);
    return user;
  },
  deleteUser: (id) => {
    const users = readData('users');
    const filtered = users.filter(u => u.id !== id);
    return writeData('users', filtered);
  },
  updateUserRole: (id, role) => {
    const users = readData('users');
    const uIdx = users.findIndex(u => u.id === id);
    if(uIdx > -1) {
      users[uIdx].role = role;
      writeData('users', users);
      return users[uIdx];
    }
    return null;
  },
  banUser: (id, status) => {
    const users = readData('users');
    const uIdx = users.findIndex(u => u.id === id);
    if(uIdx > -1) {
      users[uIdx].isBanned = status;
      writeData('users', users);
      return users[uIdx];
    }
    return null;
  },
  muteUser: (id, hours) => {
    const users = readData('users');
    const uIdx = users.findIndex(u => u.id === id);
    if(uIdx > -1) {
      if (hours > 0) {
        const date = new Date();
        date.setHours(date.getHours() + hours);
        users[uIdx].muteUntil = date.toISOString();
      } else {
        users[uIdx].muteUntil = null; // Unmute
      }
      writeData('users', users);
      return users[uIdx];
    }
    return null;
  },

  // --- Comments ---
  getComments: () => readData('comments'),
  deleteComment: (id) => {
    const comments = readData('comments');
    const filtered = comments.filter(c => c.id !== id);
    return writeData('comments', filtered);
  },
  saveComments: (comments) => writeData('comments', comments),
  getCommentsForChapter: (slug, chapter) => {
    const comments = readData('comments');
    const chNum = parseInt(chapter) || 0;
    return comments.filter(c => c.slug === slug && parseInt(c.chapter) === chNum);
  },
  addComment: (comment) => {
    const comments = readData('comments');
    comment.id = crypto.randomUUID();
    comment.parentId = comment.parentId || null;
    comment.isSpoiler = comment.isSpoiler || false;
    comment.upvotes = [];
    comment.downvotes = [];
    comment.timestamp = new Date().toISOString();
    comments.push(comment);
    writeData('comments', comments);
    
    // Add XP for commenting
    const users = readData('users');
    const userIndex = users.findIndex(u => u.username === comment.username);
    if (userIndex > -1) {
      users[userIndex].xp = (users[userIndex].xp || 0) + 15;
      writeData('users', users);
    }
    
    return comment;
  },
  voteComment: (commentId, username, voteType) => {
    const comments = readData('comments');
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return null;
    
    comment.upvotes = comment.upvotes || [];
    comment.downvotes = comment.downvotes || [];
    
    // Remove existing votes from this user
    comment.upvotes = comment.upvotes.filter(u => u !== username);
    comment.downvotes = comment.downvotes.filter(u => u !== username);
    
    // Apply new vote if it's not a toggle-off
    if (voteType === 'upvote') {
      comment.upvotes.push(username);
    } else if (voteType === 'downvote') {
      comment.downvotes.push(username);
    }
    
    writeData('comments', comments);
    return comment;
  },

  // --- Reading Progress ---
  getProgress: () => readData('progress'),
  saveProgress: (progress) => writeData('progress', progress),
  getUserProgress: (username) => {
    const progress = readData('progress');
    return progress.filter(p => p.username === username);
  },
  updateProgress: (username, slug, chapter, page) => {
    const progressList = readData('progress');
    const existingIdx = progressList.findIndex(p => p.username === username && p.slug === slug);
    
    const entry = {
      username,
      slug,
      chapter: parseInt(chapter) || 1,
      page: parseInt(page) || 1,
      timestamp: new Date().toISOString()
    };

    if (existingIdx > -1) {
      progressList[existingIdx] = entry;
    } else {
      progressList.push(entry);
    }
    writeData('progress', progressList);
    // Add XP for reading chapter
    const users = readData('users');
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex > -1) {
      // Only give XP if it's the first time reaching page 1 or beyond
      users[userIndex].xp = (users[userIndex].xp || 0) + 10;
      
      // Add XP to Guild if user is in one
      const gId = users[userIndex].guildId;
      if (gId) {
        const guilds = readData('guilds');
        const gIdx = guilds.findIndex(g => g.id === gId);
        if (gIdx > -1) {
          guilds[gIdx].xp += 5; // Guild gets 50% of the reading XP
          // Level up guild per 100 xp roughly
          guilds[gIdx].level = Math.floor(guilds[gIdx].xp / 100) + 1;
          writeData('guilds', guilds);
        }
      }
      
      writeData('users', users);
    }

    return entry;
  },
  
  // --- Guilds ---
  getGuilds: () => readData('guilds'),
  getGuild: (id) => readData('guilds').find(g => g.id === id),
  saveGuilds: (guilds) => writeData('guilds', guilds),
  createGuild: (name, ownerUsername) => {
    const guilds = readData('guilds');
    if (guilds.find(g => g.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Bu isimde bir lonca zaten var.');
    }
    const newGuild = {
      id: crypto.randomUUID(),
      name,
      owner: ownerUsername,
      members: [ownerUsername],
      xp: 0,
      level: 1,
      createdAt: new Date().toISOString()
    };
    guilds.push(newGuild);
    writeData('guilds', guilds);
    
    // Assign to user
    const users = readData('users');
    const uIdx = users.findIndex(u => u.username === ownerUsername);
    if (uIdx > -1) {
      users[uIdx].guildId = newGuild.id;
      writeData('users', users);
    }
    return newGuild;
  },
  joinGuild: (guildId, username) => {
    const guilds = readData('guilds');
    const gIdx = guilds.findIndex(g => g.id === guildId);
    if (gIdx === -1) throw new Error('Lonca bulunamadı.');
    
    if (!guilds[gIdx].members.includes(username)) {
      guilds[gIdx].members.push(username);
      writeData('guilds', guilds);
    }
    
    const users = readData('users');
    const uIdx = users.findIndex(u => u.username === username);
    if (uIdx > -1) {
      users[uIdx].guildId = guildId;
      writeData('users', users);
    }
    return guilds[gIdx];
  },
  leaveGuild: (username) => {
    const users = readData('users');
    const uIdx = users.findIndex(u => u.username === username);
    if (uIdx === -1) return false;
    
    const guildId = users[uIdx].guildId;
    if (!guildId) return false;
    
    users[uIdx].guildId = null;
    writeData('users', users);
    
    const guilds = readData('guilds');
    const gIdx = guilds.findIndex(g => g.id === guildId);
    if (gIdx > -1) {
      guilds[gIdx].members = guilds[gIdx].members.filter(m => m !== username);
      if (guilds[gIdx].members.length === 0) {
        // If empty, delete guild
        guilds.splice(gIdx, 1);
      } else if (guilds[gIdx].owner === username) {
        // Transfer ownership
        guilds[gIdx].owner = guilds[gIdx].members[0];
      }
      writeData('guilds', guilds);
    }
    return true;
  },

  // --- Chat Messages ---
  getMessages: () => {
    const msgs = readData('messages');
    // Keep only last 100 messages
    return msgs.slice(-100);
  },
  addMessage: (username, text, role = 'user', guildName = null) => {
    const msgs = readData('messages');
    const newMsg = {
      id: crypto.randomUUID(),
      username,
      role,
      guildName,
      text,
      timestamp: new Date().toISOString()
    };
    msgs.push(newMsg);
    // Prune if over 200
    if (msgs.length > 200) msgs.splice(0, msgs.length - 100);
    writeData('messages', msgs);
    return newMsg;
  },

  // --- Mangas ---
  getManga: () => readData('mangas'),
  saveManga: (mangas) => writeData('mangas', mangas),
  deleteManga: (slug) => {
    const mangas = readData('mangas');
    const filtered = mangas.filter(m => m.slug !== slug);
    return writeData('mangas', filtered);
  },
  addManga: (manga) => {
    const mangas = readData('mangas');
    manga.id = crypto.randomUUID();
    mangas.push(manga);
    writeData('mangas', mangas);
    return manga;
  }
};
