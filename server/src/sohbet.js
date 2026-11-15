/* Oyun içi sohbet: arkadaş düellosu, rastgele düello ve kişisel turnuvada. Her oyunda son 100 mesaj. */

import { Hata } from "./ortak.js";
import { bildirimGonder } from "./bildirim.js";

const EN_FAZLA_MESAJ = 100;
const EN_UZUN = 100;

async function sohbetOyunu(env, uid, id) {
  const g = await env.DB.prepare(
    "SELECT g.* FROM games g JOIN players p ON p.game_id = g.id WHERE g.id = ? AND p.uid = ? AND p.status = 'katildi'"
  ).bind(id, uid).first();
  if (!g || !(g.kind === "turnuva" || (g.kind === "duello" && g.opponent !== "bilgisayar"))) throw new Hata("oyun-yok", 404);
  return g;
}

/* sonId: telefondaki son mesaj; yalnızca ondan sonrakiler gelir */
export async function getir({ env, uid, govde, simdi }) {
  const g = await sohbetOyunu(env, uid, govde.id);
  const { results } = await env.DB.prepare(
    `SELECT m.id, m.uid, m.text, m.created_at, u.username FROM messages m LEFT JOIN users u ON u.uid = m.uid
     WHERE m.game_id = ?1 AND m.id > ?2 AND m.uid NOT IN (SELECT blocked_uid FROM blocks WHERE uid = ?3)
     ORDER BY m.id DESC LIMIT ?4`
  ).bind(g.id, govde.sonId | 0, uid, EN_FAZLA_MESAJ).all();
  await env.DB.prepare("UPDATE players SET last_read_at = ?, notified_msg = 0 WHERE game_id = ? AND uid = ?").bind(simdi, g.id, uid).run();
  return {
    mesajlar: results.reverse().map((m) => ({
      id: m.id, ben: m.uid === uid, username: m.username || "Silinmiş kullanıcı", metin: m.text, zaman: m.created_at,
    })),
  };
}

export async function gonder({ env, uid, govde, simdi, arka }) {
  const g = await sohbetOyunu(env, uid, govde.id);
  const metin = String(govde.metin || "").replace(/\s+/g, " ").trim();
  if (!metin || [...metin].length > EN_UZUN) throw new Hata("mesaj-gecersiz");

  const son = await env.DB.prepare("SELECT created_at FROM messages WHERE game_id = ? AND uid = ? ORDER BY id DESC LIMIT 1").bind(g.id, uid).first();
  if (son && simdi - son.created_at < 1000) throw new Hata("cok-hizli", 429);

  await env.DB.batch([
    env.DB.prepare("INSERT INTO messages (game_id, uid, text, created_at) VALUES (?, ?, ?, ?)").bind(g.id, uid, metin, simdi),
    env.DB.prepare(
      "DELETE FROM messages WHERE game_id = ?1 AND id <= (SELECT id FROM messages WHERE game_id = ?1 ORDER BY id DESC LIMIT 1 OFFSET ?2)"
    ).bind(g.id, EN_FAZLA_MESAJ),
    env.DB.prepare("UPDATE games SET last_msg_at = ? WHERE id = ?").bind(simdi, g.id),
    env.DB.prepare("UPDATE players SET last_read_at = ? WHERE game_id = ? AND uid = ?").bind(simdi, g.id, uid),
  ]);
  if (arka) arka(haberVer(env, g, uid));
}

/* "X sana mesaj gönderdi" (içerik yok); okunana kadar tekrar gönderilmez */
async function haberVer(env, g, uid) {
  const { results } = await env.DB.prepare(
    `UPDATE players SET notified_msg = 1 WHERE game_id = ?1 AND uid != ?2 AND status = 'katildi' AND notified_msg = 0
       AND uid NOT IN (SELECT uid FROM blocks WHERE blocked_uid = ?2) RETURNING uid`
  ).bind(g.id, uid).all();
  if (!results.length) return;
  const ben = await env.DB.prepare("SELECT username FROM users WHERE uid = ?").bind(uid).first();
  for (const r of results) await bildirimGonder(env, r.uid, "mesaj", "Yeni mesaj", ben.username + " sana mesaj gönderdi.", { oyun: g.id, sohbet: "1" });
}
