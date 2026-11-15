-- Konfeti veritabanı (Cloudflare D1)

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

-- Bulunan benzersiz kelimeler (profildeki sayı için)
CREATE TABLE IF NOT EXISTS found_words (
  uid TEXT NOT NULL,
  word TEXT NOT NULL,
  PRIMARY KEY (uid, word)
);

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

-- Bütün oyun türleri tek tabloda
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,            -- 'duello' | 'turnuva' | 'gunluk' | 'haftalik'
  opponent TEXT,                 -- düello için: 'arkadas' | 'rastgele' | 'bilgisayar'
  creator TEXT,
  name TEXT,
  format INTEGER NOT NULL,       -- oyun sayısı: 1, 3 veya 7
  seed TEXT NOT NULL,            -- gizli tohum
  difficulty INTEGER NOT NULL,   -- 0..100
  status TEXT NOT NULL,          -- 'bekliyor' | 'suruyor' | 'bitti' | 'reddedildi' | 'dustu'
  period TEXT,                   -- günlük/haftalık turnuvanın gün/hafta kimliği
  source_game TEXT,              -- düellodan açılan turnuvada kaynak düello
  created_at INTEGER NOT NULL,
  starts_at INTEGER,
  ends_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS games_period ON games(kind, period);
CREATE INDEX IF NOT EXISTS games_ends ON games(status, ends_at);

CREATE TABLE IF NOT EXISTS players (
  game_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  status TEXT NOT NULL,          -- 'davetli' | 'katildi' | 'reddetti'
  invited_by TEXT,
  total INTEGER NOT NULL DEFAULT 0,
  joined_at INTEGER,
  hidden INTEGER NOT NULL DEFAULT 0,
  notified INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (game_id, uid)
);

CREATE INDEX IF NOT EXISTS players_uid ON players(uid, updated_at);

CREATE TABLE IF NOT EXISTS rounds (
  game_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  idx INTEGER NOT NULL,
  started_at INTEGER,
  paused_at INTEGER,
  pause_used INTEGER NOT NULL DEFAULT 0,
  paused_ms INTEGER NOT NULL DEFAULT 0,
  finished_at INTEGER,
  score INTEGER,
  words TEXT,
  PRIMARY KEY (game_id, uid, idx)
);
