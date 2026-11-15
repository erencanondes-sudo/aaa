/* Düello, tur başlatma / duraklatma / bitirme */

import { Hata, GUN, kimlikUret, kullaniciBul, engelliMi } from "./ortak.js";
import { SOZLUK } from "./sozluk.js";
import { bildirimGonder } from "./bildirim.js";
import { yeniTohum, acilisTahtasi, oyunuKontrolEt, kelimePuani, SESLILER, TUR_SURESI, JOKER } from "../../shared/oyun.js";

const SURELER = { 1: GUN, 3: 2 * GUN, 7: 7 * GUN };
const DAVET_SURESI = 7 * GUN;
const EN_FAZLA_DEVAM_EDEN = 20;
const EN_FAZLA_GIDEN_DAVET = 50;
const EN_FAZLA_GELEN_DAVET = 100;
export const TURKIYE = 3 * 3600000;
export const BILGISAYAR = "bilgisayar";

/* Zorluk: şimdilik kolay ve orta daha sık (oyunların %80'i 0–60, %20'si 60–100) */
export function zorlukCek() {
  const r = Math.random();
  return r < 0.8 ? Math.floor(Math.random() * 61) : 60 + Math.floor(Math.random() * 41);
}

/* Her turun kendi tohumu vardır */
export async function turTohumu(tohum, idx) {
  const ozet = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tohum + "|tur|" + idx));
  return Array.from(new Uint8Array(ozet).slice(0, 16), (x) => x.toString(16).padStart(2, "0")).join("");
}

/* 7 oyunlukta oyunlar her gece 00:00'da (Türkiye saati) açılır; 6. gün son iki oyun birlikte açılır */
export function acikOyunSayisi(oyun, simdi) {
  if (oyun.format !== 7 || !oyun.starts_at) return oyun.format;
  const gun = Math.floor((simdi + TURKIYE) / GUN) - Math.floor((oyun.starts_at + TURKIYE) / GUN) + 1;
  return gun >= 6 ? 7 : Math.max(1, gun);
}

export async function devamEdenSayisi(env, uid) {
  const s = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM players p JOIN games g ON g.id = p.game_id
     WHERE p.uid = ? AND p.status = 'katildi' AND g.kind IN ('duello','turnuva') AND g.status IN ('bekliyor','suruyor')`
  ).bind(uid).first();
  return s.n;
}

/* ---------- Bilgisayar rakip ---------- */

function kurulabilir(kelime, harfler, joker) {
  const sayac = {};
  for (const h of harfler) sayac[h] = (sayac[h] || 0) + 1;
  let kalanJoker = joker, jokerKullanildi = false;
  for (const ch of kelime) {
    if (sayac[ch] > 0) sayac[ch]--;
    else if (kalanJoker > 0) { kalanJoker--; jokerKullanildi = true; }
    else return false;
  }
  return !(jokerKullanildi && kelime.length < 5);
}

function harfBonusu(harfler) {
  const sayac = {};
  harfler.forEach((h) => (sayac[h] = (sayac[h] || 0) + 1));
  let bonus = 0;
  Object.keys(sayac).forEach((h) => {
    if (!SESLILER.includes(h) && sayac[h] > 1) bonus += 100 * (sayac[h] - 1);
  });
  if (harfler.includes("J")) bonus += 120;
  ["Ö", "G", "P", "Ğ"].forEach((h) => { if (harfler.includes(h)) bonus += 70; });
  const m = harfler.includes("M"), a = harfler.includes("A"), e = harfler.includes("E"), k = harfler.includes("K");
  if (m && a && e && k) bonus -= 200;
  else if ((m && a && k) || (m && e && k)) bonus -= 150;
  return bonus;
}

async function bilgisayarOyna(tohum, zorluk) {
  const tahta = await acilisTahtasi(tohum, zorluk, false);
  const harfler = tahta.filter((t) => t.harf !== JOKER).map((t) => t.harf);
  const kurulabilenler = [];
  for (const k of SOZLUK) if (kurulabilir(k, harfler, 1)) kurulabilenler.push(k);
  const sayilar = kurulabilenler.length < 150 ? [8, 17] : kurulabilenler.length < 200 ? [12, 20] : [14, 21];
  const adet = Math.min(kurulabilenler.length, sayilar[0] + Math.floor(Math.random() * (sayilar[1] - sayilar[0] + 1)));
  const secilen = kurulabilenler.sort(() => Math.random() - 0.5).slice(0, adet);
  const puan = secilen.reduce((t, k) => t + kelimePuani(k), 0) + harfBonusu(harfler);
  return { puan, kelimeler: secilen };
}

/* ---------- Düello oluşturma ---------- */

export async function duelloOlustur({ env, uid, govde, simdi, arka }) {
  const format = [1, 3, 7].includes(govde.format) ? govde.format : null;
  if (!format) throw new Hata("format-gecersiz");
  if ((await devamEdenSayisi(env, uid)) >= EN_FAZLA_DEVAM_EDEN) throw new Hata("devam-eden-siniri");

  const id = kimlikUret();
  const tohum = yeniTohum();
  const zorluk = zorlukCek();
  const komutlar = [];

  if (govde.rakip === "bilgisayar") {
    komutlar.push(
      env.DB.prepare(
        "INSERT INTO games (id, kind, opponent, creator, format, seed, difficulty, status, created_at, starts_at, ends_at, updated_at) VALUES (?, 'duello', 'bilgisayar', ?, ?, ?, ?, 'suruyor', ?, ?, ?, ?)"
      ).bind(id, uid, format, tohum, zorluk, simdi, simdi, simdi + SURELER[format], simdi),
      env.DB.prepare("INSERT INTO players (game_id, uid, status, total, joined_at, updated_at) VALUES (?, ?, 'katildi', 0, ?, ?)").bind(id, uid, simdi, simdi)
    );
    let toplam = 0;
    for (let i = 0; i < format; i++) {
      const sonuc = await bilgisayarOyna(await turTohumu(tohum, i), zorluk);
      toplam += sonuc.puan;
      komutlar.push(
        env.DB.prepare("INSERT INTO rounds (game_id, uid, idx, started_at, finished_at, score, words) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(id, BILGISAYAR, i, simdi, simdi, sonuc.puan, JSON.stringify(sonuc.kelimeler))
      );
    }
    komutlar.push(
      env.DB.prepare("INSERT INTO players (game_id, uid, status, total, joined_at, updated_at) VALUES (?, ?, 'katildi', ?, ?, ?)").bind(id, BILGISAYAR, toplam, simdi, simdi)
    );
    await env.DB.batch(komutlar);
    return { id };
  }

  // Arkadaşa düello daveti
  const hedef = await kullaniciBul(env, govde.username);
  if (!hedef) throw new Hata("kullanici-yok", 404);
  if (hedef.uid === uid) throw new Hata("kendin");
  if (await engelliMi(env, uid, hedef.uid)) throw new Hata("engelli");
  // Karşı taraf engellediyse davet sessizce düşer (gönderene belli edilmez)
  const sessiz = await engelliMi(env, hedef.uid, uid);

  const s = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM games g JOIN players p ON p.game_id = g.id AND p.uid = ?2 AND p.status = 'davetli'
          WHERE g.creator = ?1 AND g.kind = 'duello' AND g.status = 'bekliyor' AND g.created_at > ?3) AS ayni,
       (SELECT COUNT(*) FROM games g WHERE g.creator = ?1 AND g.status = 'bekliyor' AND g.created_at > ?3) AS giden,
       (SELECT COUNT(*) FROM players p JOIN games g ON g.id = p.game_id
          WHERE p.uid = ?2 AND p.status = 'davetli' AND g.status = 'bekliyor' AND g.created_at > ?3) AS gelen`
  ).bind(uid, hedef.uid, simdi - DAVET_SURESI).first();

  if (s.ayni > 0) throw new Hata("zaten-davet-var");
  if (s.giden >= EN_FAZLA_GIDEN_DAVET) throw new Hata("giden-davet-siniri");
  if (s.gelen >= EN_FAZLA_GELEN_DAVET) throw new Hata("karsi-davet-siniri");

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO games (id, kind, opponent, creator, format, seed, difficulty, status, created_at, ends_at, updated_at) VALUES (?, 'duello', 'arkadas', ?, ?, ?, ?, 'bekliyor', ?, ?, ?)"
    ).bind(id, uid, format, tohum, zorluk, simdi, simdi + DAVET_SURESI, simdi),
    env.DB.prepare("INSERT INTO players (game_id, uid, status, total, joined_at, updated_at) VALUES (?, ?, 'katildi', 0, ?, ?)").bind(id, uid, simdi, simdi),
    env.DB.prepare("INSERT INTO players (game_id, uid, status, invited_by, total, updated_at) VALUES (?, ?, 'davetli', ?, 0, ?)").bind(id, hedef.uid, uid, simdi),
  ]);
  if (arka && !sessiz) {
    const ben = await env.DB.prepare("SELECT username FROM users WHERE uid = ?").bind(uid).first();
    arka(bildirimGonder(env, hedef.uid, "oyun", "Düello daveti", ben.username + " seni düelloya davet etti.", { oyun: id }));
  }
  return { id };
}

/* Rastgele eşleşmede iki oyuncu hazır olunca düello açılır (eşleştirme odası çağırır) */
export async function rastgeleDuelloAc(env, uidA, uidB, simdi) {
  const id = kimlikUret();
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO games (id, kind, opponent, creator, format, seed, difficulty, status, created_at, starts_at, ends_at, updated_at) VALUES (?, 'duello', 'rastgele', ?, 1, ?, ?, 'suruyor', ?, ?, ?, ?)"
    ).bind(id, uidA, yeniTohum(), zorlukCek(), simdi, simdi, simdi + SURELER[1], simdi),
    env.DB.prepare("INSERT INTO players (game_id, uid, status, total, joined_at, updated_at) VALUES (?, ?, 'katildi', 0, ?, ?)").bind(id, uidA, simdi, simdi),
    env.DB.prepare("INSERT INTO players (game_id, uid, status, total, joined_at, updated_at) VALUES (?, ?, 'katildi', 0, ?, ?)").bind(id, uidB, simdi, simdi),
  ]);
  return id;
}

/* Rastgele rakip: bekleyen biri varsa hemen eşleşir, yoksa 48 saat kuyrukta kalır */
const KUYRUK_SURESI = 2 * GUN;

export async function rastgeleKatil({ env, uid, simdi, arka }) {
  if ((await devamEdenSayisi(env, uid)) >= EN_FAZLA_DEVAM_EDEN) throw new Hata("devam-eden-siniri");
  const benim = await env.DB.prepare("SELECT created_at FROM queue WHERE uid = ? AND created_at > ?").bind(uid, simdi - KUYRUK_SURESI).first();
  if (benim) return { bekliyor: true };

  const { results } = await env.DB.prepare(
    `SELECT uid FROM queue WHERE uid != ?1 AND created_at > ?2
       AND uid NOT IN (SELECT blocked_uid FROM blocks WHERE uid = ?1)
       AND uid NOT IN (SELECT uid FROM blocks WHERE blocked_uid = ?1)
     ORDER BY created_at LIMIT 5`
  ).bind(uid, simdi - KUYRUK_SURESI).all();

  for (const r of results) {
    // Aynı kişiyi iki istek birden almasın
    const alindi = await env.DB.prepare("DELETE FROM queue WHERE uid = ?").bind(r.uid).run();
    if (alindi.meta.changes !== 1) continue;
    const id = await rastgeleDuelloAc(env, r.uid, uid, simdi);
    if (arka) arka(bildirimGonder(env, r.uid, "oyun", "Rakip bulundu", "Rastgele düellon başladı.", { oyun: id }));
    return { id };
  }

  await env.DB.prepare("INSERT OR REPLACE INTO queue (uid, created_at) VALUES (?, ?)").bind(uid, simdi).run();
  return { bekliyor: true };
}

export async function rastgeleIptal({ env, uid }) {
  await env.DB.prepare("DELETE FROM queue WHERE uid = ?").bind(uid).run();
}

export async function daveteCevap({ env, uid, govde, simdi }) {
  const g = await env.DB.prepare(
    "SELECT g.* FROM games g JOIN players p ON p.game_id = g.id WHERE g.id = ? AND p.uid = ? AND p.status = 'davetli'"
  ).bind(govde.id, uid).first();
  if (!g || simdi > g.ends_at) throw new Hata("davet-yok", 404);

  if (!govde.kabul) {
    const komutlar = [env.DB.prepare("UPDATE players SET status = 'reddetti', updated_at = ? WHERE game_id = ? AND uid = ?").bind(simdi, g.id, uid)];
    if (g.kind === "duello") komutlar.push(env.DB.prepare("UPDATE games SET status = 'reddedildi', updated_at = ? WHERE id = ?").bind(simdi, g.id));
    await env.DB.batch(komutlar);
    return;
  }

  if ((await devamEdenSayisi(env, uid)) >= EN_FAZLA_DEVAM_EDEN) throw new Hata("devam-eden-siniri");

  const komutlar = [env.DB.prepare("UPDATE players SET status = 'katildi', joined_at = ?, updated_at = ? WHERE game_id = ? AND uid = ?").bind(simdi, simdi, g.id, uid)];
  if (g.kind === "duello") {
    komutlar.push(env.DB.prepare("UPDATE games SET status = 'suruyor', starts_at = ?, ends_at = ?, updated_at = ? WHERE id = ?").bind(simdi, simdi + SURELER[g.format], simdi, g.id));
  }
  await env.DB.batch(komutlar);
}

/* ---------- Turlar ---------- */

async function oyunVeKatilim(env, uid, id) {
  const g = await env.DB.prepare("SELECT g.* FROM games g JOIN players p ON p.game_id = g.id WHERE g.id = ? AND p.uid = ? AND p.status = 'katildi'").bind(id, uid).first();
  if (!g) throw new Hata("oyun-yok", 404);
  return g;
}

function gecenSure(t, simdi) {
  const bitis = t.paused_at || simdi;
  return bitis - t.started_at - t.paused_ms;
}

export async function turBasla({ env, uid, govde, simdi }) {
  const g = await oyunVeKatilim(env, uid, govde.id);
  const idx = govde.idx | 0;
  if (g.status !== "suruyor" || simdi > g.ends_at) throw new Hata("oyun-bitti");
  if (idx < 0 || idx >= acikOyunSayisi(g, simdi)) throw new Hata("tur-kapali");
  await env.DB.prepare("UPDATE players SET notified_game = 0 WHERE game_id = ? AND uid = ?").bind(g.id, uid).run();

  // Turnuvada harfler sunucudaki odada üretilir
  if (g.kind !== "duello") {
    return odaSonucu(await oda(env, g.id, uid).basla({
      oyunId: g.id, uid, idx, simdi,
      tohum: await turTohumu(g.seed, idx),
      zorluk: g.difficulty,
      bitis: g.ends_at,
    }));
  }

  let t = await env.DB.prepare("SELECT * FROM rounds WHERE game_id = ? AND uid = ? AND idx = ?").bind(g.id, uid, idx).first();
  if (t && t.finished_at) throw new Hata("tur-bitti");

  if (!t) {
    await env.DB.prepare("INSERT INTO rounds (game_id, uid, idx, started_at) VALUES (?, ?, ?, ?)").bind(g.id, uid, idx, simdi).run();
    t = { started_at: simdi, paused_at: null, paused_ms: 0, pause_used: 0 };
  } else if (t.paused_at) {
    // Çıkış hakkından dönüş: süre kaldığı yerden devam eder
    const ek = simdi - t.paused_at;
    await env.DB.prepare("UPDATE rounds SET paused_at = NULL, paused_ms = paused_ms + ? WHERE game_id = ? AND uid = ? AND idx = ?").bind(ek, g.id, uid, idx).run();
    t.paused_ms += ek;
    t.paused_at = null;
  }

  const kalan = Math.max(0, TUR_SURESI - Math.floor(gecenSure(t, simdi) / 1000));
  return {
    tohum: await turTohumu(g.seed, idx),
    zorluk: g.difficulty,
    kalanSaniye: kalan,
    cikisHakki: !t.pause_used,
  };
}

/* Turda bir kez çıkış hakkı: süre durur */
export async function turDuraklat({ env, uid, govde, simdi }) {
  const g = await oyunVeKatilim(env, uid, govde.id);
  if (g.kind !== "duello") return odaSonucu(await oda(env, g.id, uid).duraklat({ idx: govde.idx | 0, simdi }));
  const r = await env.DB.prepare(
    "UPDATE rounds SET paused_at = ?, pause_used = 1 WHERE game_id = ? AND uid = ? AND idx = ? AND finished_at IS NULL AND paused_at IS NULL AND pause_used = 0"
  ).bind(simdi, govde.id, uid, govde.idx | 0).run();
  return { duraklatildi: r.meta.changes === 1 };
}

/* Turnuvada her kelime odaya gönderilir; oda yeni taşları ve sıradaki birkaç taşı döner */
export async function turKelime({ env, uid, govde, simdi }) {
  const g = await oyunVeKatilim(env, uid, govde.id);
  if (g.kind === "duello") throw new Hata("tur-yok", 404);
  const yerler = Array.isArray(govde.yerler) ? govde.yerler.slice(0, 8).map((y) => y | 0) : [];
  return odaSonucu(await oda(env, g.id, uid).kelime({ idx: govde.idx | 0, yerler, joker: govde.joker || null, simdi }));
}

export async function turBitir({ env, uid, govde, simdi, arka }) {
  const g = await oyunVeKatilim(env, uid, govde.id);
  const idx = govde.idx | 0;
  if (g.kind !== "duello") return odaSonucu(await oda(env, g.id, uid).bitir({ idx, kalanSaniye: govde.kalanSaniye | 0, simdi }));
  const t = await env.DB.prepare("SELECT * FROM rounds WHERE game_id = ? AND uid = ? AND idx = ?").bind(g.id, uid, idx).first();
  if (!t || t.finished_at) throw new Hata("tur-yok", 404);

  const hamleler = Array.isArray(govde.hamleler) ? govde.hamleler.slice(0, 300) : [];
  const tohum = await turTohumu(g.seed, idx);
  const kalanSaniye = Math.max(0, TUR_SURESI - Math.floor(gecenSure(t, simdi) / 1000));

  // Telefonun söylediği kalan süre, sunucunun hesapladığından fazla olamaz
  const istenenKalan = Math.max(0, Math.min(kalanSaniye, govde.kalanSaniye | 0));

  const kontrol = await oyunuKontrolEt({ tohum, zorluk: g.difficulty, hamleler, kalanSaniye: istenenKalan, sozluk: SOZLUK });
  const puan = kontrol.gecerli ? kontrol.puan : 0;

  await turKaydet(env, g, uid, idx, puan, kontrol.kelimeler, simdi, arka);
  return { puan, gecerli: kontrol.gecerli, kelimeler: kontrol.kelimeler };
}

function oda(env, oyunId, uid) {
  return env.TUR_ODASI.get(env.TUR_ODASI.idFromName(oyunId + ":" + uid));
}

function odaSonucu(r) {
  if (r && r.hata) throw new Hata(r.hata, r.durum);
  return r;
}

export async function turKaydet(env, g, uid, idx, puan, kelimeler, simdi, arka) {
  const komutlar = [
    env.DB.prepare("UPDATE rounds SET finished_at = ?, paused_at = NULL, score = ?, words = ? WHERE game_id = ? AND uid = ? AND idx = ?")
      .bind(simdi, puan, JSON.stringify(kelimeler), g.id, uid, idx),
    env.DB.prepare("UPDATE players SET total = total + ?, updated_at = ? WHERE game_id = ? AND uid = ?").bind(puan, simdi, g.id, uid),
    env.DB.prepare("UPDATE users SET word_score_sum = word_score_sum + ?, word_score_count = word_score_count + 1 WHERE uid = ?").bind(puan, uid),
    env.DB.prepare("UPDATE games SET updated_at = ? WHERE id = ?").bind(simdi, g.id),
  ];
  for (const k of kelimeler) komutlar.push(env.DB.prepare("INSERT OR IGNORE INTO found_words (uid, word) VALUES (?, ?)").bind(uid, k));
  komutlar.push(env.DB.prepare("UPDATE users SET found_words_count = (SELECT COUNT(*) FROM found_words WHERE uid = ?1) WHERE uid = ?1").bind(uid));
  await env.DB.batch(komutlar);
  if (g.kind === "duello" && arka) arka(rakibeHaber(env, g, uid));
  await bittiyseKapat(env, g.id, simdi);
}

/* "Rakibin oynadı" bildirimi: rakip oyuna dönene kadar tekrar gönderilmez */
async function rakibeHaber(env, g, uid) {
  const { results } = await env.DB.prepare(
    "UPDATE players SET notified_game = 1 WHERE game_id = ? AND uid != ? AND status = 'katildi' AND notified_game = 0 RETURNING uid"
  ).bind(g.id, uid).all();
  if (!results.length) return;
  const ben = await env.DB.prepare("SELECT username FROM users WHERE uid = ?").bind(uid).first();
  for (const r of results) {
    if (r.uid === BILGISAYAR) continue;
    await bildirimGonder(env, r.uid, "oyun", "Rakibin oynadı", (ben ? ben.username : "Rakibin") + " sırasını oynadı.", { oyun: g.id });
  }
}

/* Bütün oyuncular bütün turları bitirdiyse düello kapanır, istatistikler yazılır */
export async function bittiyseKapat(env, id, simdi, zorla) {
  const g = await env.DB.prepare("SELECT * FROM games WHERE id = ?").bind(id).first();
  if (!g || g.status !== "suruyor" || g.kind !== "duello") return;
  const { results: oyuncular } = await env.DB.prepare("SELECT uid, total FROM players WHERE game_id = ? AND status = 'katildi'").bind(id).all();
  const s = await env.DB.prepare("SELECT COUNT(*) AS n FROM rounds WHERE game_id = ? AND finished_at IS NOT NULL").bind(id).first();
  if (!zorla && s.n < oyuncular.length * g.format) return;

  // Aynı anda iki istek gelirse istatistik bir kez yazılsın
  const kapandi = await env.DB.prepare("UPDATE games SET status = 'bitti', updated_at = ? WHERE id = ? AND status = 'suruyor'").bind(simdi, id).run();
  if (kapandi.meta.changes !== 1) return;

  const enYuksek = Math.max(...oyuncular.map((o) => o.total));
  const kazananlar = oyuncular.filter((o) => o.total === enYuksek);
  const komutlar = [];
  for (const o of oyuncular) {
    if (o.uid === BILGISAYAR) continue;
    const kazandi = kazananlar.length === 1 && kazananlar[0].uid === o.uid ? 1 : 0;
    komutlar.push(env.DB.prepare("UPDATE users SET challenge_count = challenge_count + 1, challenge_wins = challenge_wins + ? WHERE uid = ?").bind(kazandi, o.uid));
  }
  if (komutlar.length) await env.DB.batch(komutlar);
}

export { DAVET_SURESI, SURELER, EN_FAZLA_DEVAM_EDEN, EN_FAZLA_GIDEN_DAVET, EN_FAZLA_GELEN_DAVET };

/* ---------- Oyunlarım ---------- */

const EN_FAZLA_BITEN = 20;

async function oyunlariDoldur(env, oyunlar, uid, simdi, kelimelerle) {
  if (!oyunlar.length) return [];
  const idler = oyunlar.map((g) => g.id);
  const yer = idler.map(() => "?").join(",");
  const { results: oyuncular } = await env.DB.prepare(
    `SELECT p.game_id, p.uid, p.status, p.total, u.username, u.avatar
     FROM players p LEFT JOIN users u ON u.uid = p.uid WHERE p.game_id IN (${yer})`
  ).bind(...idler).all();
  const { results: turlar } = await env.DB.prepare(
    `SELECT game_id, uid, idx, finished_at, score, words FROM rounds WHERE game_id IN (${yer})`
  ).bind(...idler).all();

  return oyunlar.map((g) => {
    const benimBitenler = new Set(turlar.filter((t) => t.game_id === g.id && t.uid === uid && t.finished_at).map((t) => t.idx));
    return {
      id: g.id,
      kind: g.kind,
      opponent: g.opponent,
      name: g.name,
      format: g.format,
      status: g.status,
      createdAt: g.created_at,
      startsAt: g.starts_at,
      endsAt: g.ends_at,
      acikOyun: acikOyunSayisi(g, simdi),
      okunmamis: !!(g.last_msg_at && (!g.okuma || g.last_msg_at > g.okuma)),
      oyuncular: oyuncular
        .filter((o) => o.game_id === g.id)
        .map((o) => ({
          ben: o.uid === uid,
          username: o.uid === BILGISAYAR ? "Bilgisayar" : o.username || "Silinmiş kullanıcı",
          avatar: o.avatar,
          status: o.status,
          total: o.total,
          turlar: turlar
            .filter((t) => t.game_id === g.id && t.uid === o.uid)
            .map((t) => {
              const tur = { idx: t.idx, bitti: !!t.finished_at, puan: t.finished_at ? t.score : null };
              // Kelimeler yalnızca iki taraf da o turu bitirince görünür
              if (kelimelerle && t.finished_at && (o.uid === uid || benimBitenler.has(t.idx))) tur.kelimeler = JSON.parse(t.words || "[]");
              return tur;
            }),
        })),
    };
  });
}

export async function oyunListesi({ env, uid, simdi }) {
  const { results } = await env.DB.prepare(
    `SELECT g.*, p.status AS benim, p.last_read_at AS okuma FROM players p JOIN games g ON g.id = p.game_id
     WHERE p.uid = ?1 AND p.hidden = 0 AND p.status IN ('katildi','davetli')
       AND g.kind IN ('duello','turnuva')
       AND NOT (p.status = 'davetli' AND (g.ends_at < ?2 OR g.creator IN (SELECT blocked_uid FROM blocks WHERE uid = ?1)))
     ORDER BY g.updated_at DESC`
  ).bind(uid, simdi).all();

  const devam = results.filter((g) => g.status === "bekliyor" || g.status === "suruyor");
  const biten = results.filter((g) => g.status === "bitti").slice(0, EN_FAZLA_BITEN);
  return { oyunlar: await oyunlariDoldur(env, devam.concat(biten), uid, simdi, false) };
}

export async function oyunDetay({ env, uid, govde, simdi }) {
  const g = await env.DB.prepare(
    "SELECT g.*, p.last_read_at AS okuma FROM games g JOIN players p ON p.game_id = g.id WHERE g.id = ? AND p.uid = ? AND p.status IN ('katildi','davetli')"
  ).bind(govde.id, uid).first();
  if (!g) throw new Hata("oyun-yok", 404);
  await env.DB.prepare("UPDATE players SET notified_game = 0 WHERE game_id = ? AND uid = ?").bind(g.id, uid).run();
  const [oyun] = await oyunlariDoldur(env, [g], uid, simdi, true);
  return { oyun };
}

/* Kullanıcı biten oyunu kendi listesinden siler; 20'ye sayılmaz */
export async function oyunGizle({ env, uid, govde, simdi }) {
  await env.DB.prepare(
    "UPDATE players SET hidden = 1, updated_at = ? WHERE game_id = ? AND uid = ? AND game_id IN (SELECT id FROM games WHERE status IN ('bitti','reddedildi','dustu'))"
  ).bind(simdi, govde.id, uid).run();
}
