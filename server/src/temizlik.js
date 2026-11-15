/* Gece işi (Cron Trigger, her gece 03:07): eski kayıtları siler ve düello oyuncu listesini hazırlar.
   Oyunlar kendi odalarında kendiliğinden kapanıp silinir. */

import { GUN } from "./ortak.js";

const SATIR = 1000;
const SATIRDA = 50;

/* Düelloya açık, son 7 günde oynamış oyuncular karıştırılıp 1000 satıra bölünür.
   Oyuncu sayısı 50 000'den azsa her satır, oyuncular arasından rastgele 50 kişidir. */
async function havuzHazirla(env, simdi) {
  const { results } = await env.DB.prepare(
    "SELECT username, avatar, word_score_sum, word_score_count FROM users WHERE duel_open = 1 AND last_seen > ?"
  ).bind(simdi - 7 * GUN).all();
  const oyuncular = results.map((u) => ({
    username: u.username, avatar: u.avatar,
    ortalama: u.word_score_count ? Math.round(u.word_score_sum / u.word_score_count) : 0,
  }));
  karistir(oyuncular);

  const komutlar = [env.DB.prepare("DELETE FROM duel_pool")];
  if (oyuncular.length) {
    for (let i = 0; i < SATIR; i++) {
      let satir;
      if (oyuncular.length >= SATIR * SATIRDA) satir = oyuncular.slice(i * SATIRDA, (i + 1) * SATIRDA);
      else satir = karistir(oyuncular.slice()).slice(0, SATIRDA);
      komutlar.push(env.DB.prepare("INSERT INTO duel_pool (id, data) VALUES (?, ?)").bind(i, JSON.stringify(satir)));
    }
  }
  for (let i = 0; i < komutlar.length; i += 100) await env.DB.batch(komutlar.slice(i, i + 100));
}

function karistir(dizi) {
  for (let i = dizi.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dizi[i], dizi[j]] = [dizi[j], dizi[i]];
  }
  return dizi;
}

export async function temizle(env) {
  const simdi = Date.now();
  await env.DB.batch([
    // 48 saati geçen rastgele rakip beklemeleri
    env.DB.prepare("DELETE FROM queue WHERE created_at < ?").bind(simdi - 2 * GUN),
    // 1 ayı geçen cevapsız arkadaşlık istekleri
    env.DB.prepare("DELETE FROM friends WHERE status = 'istek' AND created_at < ?").bind(simdi - 30 * GUN),
  ]);
  await havuzHazirla(env, simdi);
}
