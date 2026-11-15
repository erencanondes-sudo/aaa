/* Profil işlemleri */

import { Hata, GUN, kullaniciAdiDuzelt, cift, kullaniciBul } from "./ortak.js";

const AVATAR_SAYISI = 97;

function avatarDuzelt(a) {
  const n = parseInt(String(a || "").replace("avatar-", ""), 10);
  return n >= 1 && n <= AVATAR_SAYISI ? "avatar-" + n : null;
}

function disProfil(u) {
  return {
    username: u.username,
    avatar: u.avatar,
    country: u.country,
    challengeCount: u.challenge_count,
    challengeWins: u.challenge_wins,
    wordScoreSum: u.word_score_sum,
    wordScoreCount: u.word_score_count,
    foundWordsCount: u.found_words_count,
  };
}

export async function getir({ env, uid }) {
  const u = await env.DB.prepare("SELECT * FROM users WHERE uid = ?").bind(uid).first();
  if (!u) return { profil: null };
  return {
    profil: Object.assign(disProfil(u), {
      name: u.name,
      duelOpen: !!u.duel_open,
      notifyGame: !!u.notify_game,
      notifyMsg: !!u.notify_msg,
      usernameChangedAt: u.username_changed_at,
    }),
  };
}

export async function olustur({ env, uid, govde, simdi }) {
  const ad = kullaniciAdiDuzelt(govde.username);
  const var1 = await env.DB.prepare("SELECT uid FROM users WHERE uid = ? OR username = ?").bind(uid, ad).first();
  if (var1) throw new Hata(var1.uid === uid ? "profil-var" : "ad-alinmis");
  await env.DB.prepare(
    "INSERT INTO users (uid, username, name, country, avatar, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(uid, ad, String(govde.name || "").slice(0, 60), String(govde.country || "").slice(0, 8), avatarDuzelt(govde.avatar), simdi, simdi)
    .run();
  return getir({ env, uid, simdi });
}

export async function avatarDegistir({ env, uid, govde }) {
  const a = avatarDuzelt(govde.avatar);
  if (!a) throw new Hata("avatar-gecersiz");
  await env.DB.prepare("UPDATE users SET avatar = ? WHERE uid = ?").bind(a, uid).run();
}

/* Kullanıcı adı ayda bir değiştirilebilir */
export async function adDegistir({ env, uid, govde, simdi }) {
  const ad = kullaniciAdiDuzelt(govde.username);
  const u = await env.DB.prepare("SELECT username, username_changed_at FROM users WHERE uid = ?").bind(uid).first();
  if (!u) throw new Hata("profil-yok", 404);
  if (u.username_changed_at && simdi - u.username_changed_at < 30 * GUN) throw new Hata("ad-ayda-bir");
  const alinmis = await env.DB.prepare("SELECT uid FROM users WHERE username = ? AND uid != ?").bind(ad, uid).first();
  if (alinmis) throw new Hata("ad-alinmis");
  await env.DB.prepare("UPDATE users SET username = ?, username_changed_at = ? WHERE uid = ?").bind(ad, simdi, uid).run();
  return { username: ad };
}

export async function duelloAcikDegistir({ env, uid, govde }) {
  await env.DB.prepare("UPDATE users SET duel_open = ? WHERE uid = ?").bind(govde.acik ? 1 : 0, uid).run();
}

export async function bildirimAyari({ env, uid, govde }) {
  const alanlar = [];
  const degerler = [];
  if (typeof govde.oyun === "boolean") { alanlar.push("notify_game = ?"); degerler.push(govde.oyun ? 1 : 0); }
  if (typeof govde.mesaj === "boolean") { alanlar.push("notify_msg = ?"); degerler.push(govde.mesaj ? 1 : 0); }
  if (typeof govde.token === "string") { alanlar.push("push_token = ?"); degerler.push(govde.token.slice(0, 400) || null); }
  if (!alanlar.length) return;
  await env.DB.prepare("UPDATE users SET " + alanlar.join(", ") + " WHERE uid = ?").bind(...degerler, uid).run();
}

export async function kullaniciGetir({ env, uid, govde }) {
  const u = await env.DB.prepare("SELECT * FROM users WHERE username = ?")
    .bind(String(govde.username || "").toLocaleLowerCase("tr"))
    .first();
  if (!u) throw new Hata("kullanici-yok", 404);
  const [a, b] = cift(uid, u.uid);
  const f = await env.DB.prepare("SELECT status, requested_by FROM friends WHERE a = ? AND b = ?").bind(a, b).first();
  let arkadaslik = "yok";
  if (f) arkadaslik = f.status === "arkadas" ? "arkadas" : f.requested_by === uid ? "istek-gonderildi" : "istek-geldi";
  return { kullanici: Object.assign(disProfil(u), { arkadaslik }) };
}

/* Düelloya açık oyunculardan rastgele 20 kişi (son 7 günde oyun oynamış olanlar) */
export async function acikOyuncular({ env, uid, simdi }) {
  const { results } = await env.DB.prepare(
    `SELECT username, avatar, word_score_sum, word_score_count FROM users
     WHERE duel_open = 1 AND uid != ?1 AND last_seen > ?2
       AND uid NOT IN (SELECT blocked_uid FROM blocks WHERE uid = ?1)
       AND uid NOT IN (SELECT uid FROM blocks WHERE blocked_uid = ?1)
     ORDER BY RANDOM() LIMIT 20`
  ).bind(uid, simdi - 7 * GUN).all();
  return {
    oyuncular: results.map((u) => ({
      username: u.username, avatar: u.avatar,
      ortalama: u.word_score_count ? Math.round(u.word_score_sum / u.word_score_count) : 0,
    })),
  };
}

/* Şikâyet: günde en fazla 20 */
export async function sikayet({ env, uid, govde, simdi }) {
  const hedef = await kullaniciBul(env, govde.username);
  if (!hedef || hedef.uid === uid) throw new Hata("kullanici-yok", 404);
  const s = await env.DB.prepare("SELECT COUNT(*) AS n FROM reports WHERE reporter = ? AND created_at > ?").bind(uid, simdi - GUN).first();
  if (s.n >= 20) throw new Hata("sikayet-siniri", 429);
  await env.DB.prepare("INSERT INTO reports (reporter, target, game_id, reason, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(uid, hedef.uid, govde.oyunId || null, String(govde.sebep || "").slice(0, 200), simdi).run();
}

/* Hesap silme: oyuncunun oyunlarına haber verilir (bekleyen davetler düşer), sonra profil, arkadaşlar,
   engeller ve kullanıcı odası silinir. Biten oyunlarda oyuncu "Silinmiş kullanıcı" görünür.
   Firebase hesabını telefon siler. */
export async function sil({ env, uid, simdi }) {
  const oda = env.KULLANICI_ODASI.get(env.KULLANICI_ODASI.idFromName(uid));
  const oyunlar = await oda.sil();
  for (const id of oyunlar) {
    try {
      await env.OYUN_ODASI.get(env.OYUN_ODASI.idFromName(id)).kullaniciSilindi({ uid, simdi });
    } catch (e) {}
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM friends WHERE a = ?1 OR b = ?1").bind(uid),
    env.DB.prepare("DELETE FROM blocks WHERE uid = ?1 OR blocked_uid = ?1").bind(uid),
    env.DB.prepare("DELETE FROM queue WHERE uid = ?").bind(uid),
    env.DB.prepare("DELETE FROM users WHERE uid = ?").bind(uid),
  ]);
}
