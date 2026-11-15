/* Arkadaşlık işlemleri: istek ve onayla çalışır */

import { Hata, GUN, cift, kullaniciBul, engelliMi } from "./ortak.js";

const EN_FAZLA_ARKADAS = 100;
const EN_FAZLA_BEKLEYEN_ISTEK = 50;
const ISTEK_SURESI = 30 * GUN;

export async function liste({ env, uid, simdi }) {
  const sinir = simdi - ISTEK_SURESI;
  const { results } = await env.DB.prepare(
    `SELECT f.status, f.requested_by, f.created_at, u.uid, u.username, u.avatar,
       u.challenge_count, u.challenge_wins, u.word_score_sum, u.word_score_count
     FROM friends f JOIN users u ON u.uid = CASE WHEN f.a = ?1 THEN f.b ELSE f.a END
     WHERE (f.a = ?1 OR f.b = ?1)
       AND (f.status = 'arkadas' OR f.created_at > ?2)
       AND u.uid NOT IN (SELECT blocked_uid FROM blocks WHERE uid = ?1)`
  )
    .bind(uid, sinir)
    .all();

  const sonuc = { arkadaslar: [], gelen: [], giden: [] };
  for (const r of results) {
    const k = {
      username: r.username, avatar: r.avatar,
      basari: r.challenge_count ? Math.round((r.challenge_wins / r.challenge_count) * 100) : 0,
      ortalama: r.word_score_count ? Math.round(r.word_score_sum / r.word_score_count) : 0,
    };
    if (r.status === "arkadas") sonuc.arkadaslar.push(k);
    else if (r.requested_by === uid) sonuc.giden.push(k);
    else sonuc.gelen.push(k);
  }
  return sonuc;
}

async function sayilar(env, uid, simdi) {
  const s = await env.DB.prepare(
    `SELECT
       SUM(CASE WHEN status = 'arkadas' THEN 1 ELSE 0 END) AS arkadas,
       SUM(CASE WHEN status = 'istek' AND requested_by = ?1 AND created_at > ?2 THEN 1 ELSE 0 END) AS giden
     FROM friends WHERE a = ?1 OR b = ?1`
  )
    .bind(uid, simdi - ISTEK_SURESI)
    .first();
  return { arkadas: s.arkadas || 0, giden: s.giden || 0 };
}

export async function istekGonder({ env, uid, govde, simdi }) {
  const hedef = await kullaniciBul(env, govde.username);
  if (!hedef) throw new Hata("kullanici-yok", 404);
  if (hedef.uid === uid) throw new Hata("kendin");

  const [a, b] = cift(uid, hedef.uid);
  const mevcut = await env.DB.prepare("SELECT status, requested_by, created_at FROM friends WHERE a = ? AND b = ?").bind(a, b).first();

  if (mevcut && mevcut.status === "arkadas") return { durum: "arkadas" };

  // Karşı taraf zaten istek göndermişse kabul edilmiş sayılır
  if (mevcut && mevcut.requested_by === hedef.uid && simdi - mevcut.created_at < ISTEK_SURESI && !(await engelliMi(env, uid, hedef.uid))) {
    return cevapla({ env, uid, govde: { username: govde.username, kabul: true }, simdi });
  }

  if (mevcut && mevcut.requested_by === uid && simdi - mevcut.created_at < ISTEK_SURESI) return { durum: "istek-gonderildi" };

  const say = await sayilar(env, uid, simdi);
  if (say.arkadas >= EN_FAZLA_ARKADAS) throw new Hata("arkadas-siniri");
  if (say.giden >= EN_FAZLA_BEKLEYEN_ISTEK) throw new Hata("istek-siniri");

  // Engellendiysen istek yine kaydedilir ama karşı taraf görmez (listede gizlenir)
  await env.DB.prepare(
    "INSERT OR REPLACE INTO friends (a, b, status, requested_by, created_at) VALUES (?, ?, 'istek', ?, ?)"
  )
    .bind(a, b, uid, simdi)
    .run();
  return { durum: "istek-gonderildi" };
}

export async function cevapla({ env, uid, govde, simdi }) {
  const karsi = await kullaniciBul(env, govde.username);
  if (!karsi) throw new Hata("kullanici-yok", 404);
  const [a, b] = cift(uid, karsi.uid);
  const mevcut = await env.DB.prepare("SELECT status, requested_by, created_at FROM friends WHERE a = ? AND b = ?").bind(a, b).first();
  if (!mevcut || mevcut.status !== "istek" || mevcut.requested_by === uid || simdi - mevcut.created_at > ISTEK_SURESI) {
    throw new Hata("istek-yok", 404);
  }

  if (!govde.kabul) {
    await env.DB.prepare("DELETE FROM friends WHERE a = ? AND b = ?").bind(a, b).run();
    return { durum: "reddedildi" };
  }

  const benim = await sayilar(env, uid, simdi);
  const onun = await sayilar(env, karsi.uid, simdi);
  if (benim.arkadas >= EN_FAZLA_ARKADAS || onun.arkadas >= EN_FAZLA_ARKADAS) throw new Hata("arkadas-siniri");

  await env.DB.prepare("UPDATE friends SET status = 'arkadas' WHERE a = ? AND b = ?").bind(a, b).run();
  return { durum: "arkadas" };
}

export async function sil({ env, uid, govde }) {
  const karsi = await kullaniciBul(env, govde.username);
  if (!karsi) throw new Hata("kullanici-yok", 404);
  const [a, b] = cift(uid, karsi.uid);
  await env.DB.prepare("DELETE FROM friends WHERE a = ? AND b = ?").bind(a, b).run();
}

/* Engellenen kişi sana istek, davet ya da mesaj gönderse de sana ulaşmaz */
export async function engelle({ env, uid, govde, simdi }) {
  const karsi = await kullaniciBul(env, govde.username);
  if (!karsi) throw new Hata("kullanici-yok", 404);
  if (karsi.uid === uid) throw new Hata("kendin");
  if (govde.kaldir) {
    await env.DB.prepare("DELETE FROM blocks WHERE uid = ? AND blocked_uid = ?").bind(uid, karsi.uid).run();
    return;
  }
  const [a, b] = cift(uid, karsi.uid);
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO blocks (uid, blocked_uid, created_at) VALUES (?, ?, ?)").bind(uid, karsi.uid, simdi),
    env.DB.prepare("DELETE FROM friends WHERE a = ? AND b = ? AND status = 'arkadas'").bind(a, b),
  ]);
}
