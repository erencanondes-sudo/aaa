/* Günlük temizlik (Cron Trigger). Oyunlar kendi odalarında kendiliğinden kapanıp silinir;
   burada yalnızca veritabanındaki süresi geçmiş kayıtlar silinir. */

import { GUN } from "./ortak.js";

export async function temizle(env) {
  const simdi = Date.now();
  await env.DB.batch([
    // 48 saati geçen rastgele rakip beklemeleri
    env.DB.prepare("DELETE FROM queue WHERE created_at < ?").bind(simdi - 2 * GUN),
    // 1 ayı geçen cevapsız arkadaşlık istekleri
    env.DB.prepare("DELETE FROM friends WHERE status = 'istek' AND created_at < ?").bind(simdi - 30 * GUN),
  ]);
}
