-- Konfeti veritabanı (Cloudflare D1)
-- Oyunlar burada değil: her oyunun kendi odası, her kullanıcının kendi oyun listesi odası var.

CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT,
  country TEXT,
  avatar TEXT,
  created_at INTEGER NOT NULL,
  username_changed_at INTEGER,
  challenge_count INTEGER NOT NULL DEFAULT 0,
  challenge_wins INTEGER NOT NULL DEFAULT 0,
  word_score_sum INTEGER NOT NULL DEFAULT 0,
  word_score_count INTEGER NOT NULL DEFAULT 0,
  found_words_count INTEGER NOT NULL DEFAULT 0,
  duel_open INTEGER NOT NULL DEFAULT 0,
  notify_game INTEGER NOT NULL DEFAULT 1,
  notify_msg INTEGER NOT NULL DEFAULT 1,
  push_token TEXT,
  last_seen INTEGER
);

CREATE INDEX IF NOT EXISTS users_duel_open ON users(duel_open, last_seen);

-- Arkadaşlık: a < b olacak şekilde tek satır
CREATE TABLE IF NOT EXISTS friends (
  a TEXT NOT NULL,
  b TEXT NOT NULL,
  status TEXT NOT NULL,          -- 'istek' | 'arkadas'
  requested_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (a, b)
);

CREATE INDEX IF NOT EXISTS friends_b ON friends(b);

CREATE TABLE IF NOT EXISTS blocks (
  uid TEXT NOT NULL,
  blocked_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (uid, blocked_uid)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter TEXT NOT NULL,
  target TEXT NOT NULL,
  game_id TEXT,
  reason TEXT,
  created_at INTEGER NOT NULL
);

-- Rastgele rakip bekleyenler (48 saat)
CREATE TABLE IF NOT EXISTS queue (
  uid TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);
