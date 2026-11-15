/* Günlük temizlik (Cron Trigger): süresi dolan oyunları kapatır, eski kayıtları siler */

import { GUN } from "./ortak.js";
import { bittiyseKapat } from "./oyun.js";

const SURE = { duello: 365 * GUN, turnuva: 365 * GUN, gunluk: 7 * GUN, haftalik: 28 * GUN };

export async function temizle(env) {
  const simdi = Date.now();

  // Cevapsız düello davetleri düşer
  await env.DB.prepare("UPDATE games SET status = 'dustu', updated_at = ?1 WHERE status = 'bekliyor' AND ends_at < ?1").bind(simdi).run();

  // Süresi dolan düellolar kapanır (oynanmayan turlar 0 sayılır)
  const { results: duellolar } = await env.DB.prepare(
    "SELECT id FROM games WHERE status = 'suruyor' AND kind = 'duello' AND ends_at < ? LIMIT 500"
  ).bind(simdi).all();
  for (const d of duellolar) await bittiyseKapat(env, d.id, simdi, true);

  // Süresi dolan turnuvalar biter (çıkış hakkıyla bırakılan turları oda kendisi kapatır)
  await env.DB.prepare(
    "UPDATE games SET status = 'bitti', updated_at = ?1 WHERE status = 'suruyor' AND kind != 'duello' AND ends_at < ?1"
  ).bind(simdi).run();

  // Eski oyunlar silinir: düello ve kişisel turnuva 1 yıl, günlük 7 gün, haftalık 4 hafta
  for (const tur of Object.keys(SURE)) {
    const kosul = "SELECT id FROM games WHERE kind = ?1 AND status IN ('bitti','reddedildi','dustu') AND updated_at < ?2";
    const sinir = simdi - SURE[tur];
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM rounds WHERE game_id IN (${kosul})`).bind(tur, sinir),
      env.DB.prepare(`DELETE FROM players WHERE game_id IN (${kosul})`).bind(tur, sinir),
      env.DB.prepare(`DELETE FROM messages WHERE game_id IN (${kosul})`).bind(tur, sinir),
      env.DB.prepare(`DELETE FROM games WHERE id IN (${kosul})`).bind(tur, sinir),
    ]);
  }

  // Herkesin listesinden sildiği biten oyunlar hemen silinir
  const herkesGizledi = `SELECT g.id FROM games g WHERE g.status IN ('bitti','reddedildi','dustu') AND g.kind IN ('duello','turnuva')
    AND NOT EXISTS (SELECT 1 FROM players p WHERE p.game_id = g.id AND p.hidden = 0 AND p.uid != 'bilgisayar' AND p.status = 'katildi')`;
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM rounds WHERE game_id IN (${herkesGizledi})`),
    env.DB.prepare(`DELETE FROM messages WHERE game_id IN (${herkesGizledi})`),
    env.DB.prepare(`DELETE FROM players WHERE game_id IN (${herkesGizledi})`),
    env.DB.prepare(`DELETE FROM games WHERE id IN (${herkesGizledi})`),
  ]);

  // 48 saati geçen rastgele bekleyişler ve 1 ayı geçen arkadaşlık istekleri
  await env.DB.batch([
    env.DB.prepare("DELETE FROM queue WHERE created_at < ?").bind(simdi - 2 * GUN),
    env.DB.prepare("DELETE FROM friends WHERE status = 'istek' AND created_at < ?").bind(simdi - 30 * GUN),
  ]);
}
