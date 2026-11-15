/* Turnuvalar: düellodan açılan kişisel turnuva, günlük turnuva, haftalık turnuva */

import { Hata, GUN, kimlikUret, kullaniciBul, cift, engelliMi } from "./ortak.js";
import { yeniTohum } from "../../shared/oyun.js";
import { zorlukCek, devamEdenSayisi, acikOyunSayisi, TURKIYE, EN_FAZLA_DEVAM_EDEN, EN_FAZLA_GIDEN_DAVET, EN_FAZLA_GELEN_DAVET, BILGISAYAR } from "./oyun.js";

const EN_FAZLA_OYUNCU = 100;
const GUNLUK_HAK = 1;        // günlük turnuvada oynama hakkı
const SIRALAMA_ADEDI = 100;
const SECILEBILEN_GUNLER = [1, 2, 3, 7];   // kişisel turnuvanın süresi (gün)

/* ---------- Türkiye saatiyle gün ve hafta ---------- */

function gunBasi(simdi) {
  return Math.floor((simdi + TURKIYE) / GUN) * GUN - TURKIYE;
}

function tarih(an) {
  return new Date(an + TURKIYE).toISOString().slice(0, 10);
}

function haftaBasi(simdi) {
  const gun = gunBasi(simdi);
  const haftaninGunu = (new Date(gun + TURKIYE).getUTCDay() + 6) % 7; // pazartesi = 0
  return gun - haftaninGunu * GUN;
}

/* ---------- Kişisel turnuva ---------- */

/* Düellodaki "Arkadaş ekle": düello oyuncularıyla yeni bir turnuva açılır, sonra arkadaşlar davet edilir */
export async function kisiselAc({ env, uid, govde, simdi }) {
  const kaynak = await env.DB.prepare(
    "SELECT g.* FROM games g JOIN players p ON p.game_id = g.id WHERE g.id = ? AND p.uid = ? AND p.status = 'katildi' AND g.kind = 'duello'"
  ).bind(govde.kaynak, uid).first();
  if (!kaynak || kaynak.opponent === "bilgisayar") throw new Hata("oyun-yok", 404);
  // 7 oyunlukta oyunlar her gece açıldığı için süre 7 gün olmak zorunda
  const gun = kaynak.format === 7 ? 7 : govde.gun | 0;
  if (!SECILEBILEN_GUNLER.includes(gun)) throw new Hata("sure-gecersiz");
  if ((await devamEdenSayisi(env, uid)) >= EN_FAZLA_DEVAM_EDEN) throw new Hata("devam-eden-siniri");

  const { results: digerleri } = await env.DB.prepare(
    "SELECT uid FROM players WHERE game_id = ? AND uid != ? AND status = 'katildi'"
  ).bind(kaynak.id, uid).all();

  const id = kimlikUret();
  const ad = String(govde.ad || "").trim().slice(0, 30) || null;
  const komutlar = [
    env.DB.prepare(
      "INSERT INTO games (id, kind, creator, name, format, seed, difficulty, status, source_game, created_at, starts_at, ends_at, updated_at) VALUES (?, 'turnuva', ?, ?, ?, ?, ?, 'suruyor', ?, ?, ?, ?, ?)"
    ).bind(id, uid, ad, kaynak.format, yeniTohum(), zorlukCek(), kaynak.id, simdi, simdi, simdi + gun * GUN, simdi),
    env.DB.prepare("INSERT INTO players (game_id, uid, status, total, joined_at, updated_at) VALUES (?, ?, 'katildi', 0, ?, ?)").bind(id, uid, simdi, simdi),
  ];
  for (const d of digerleri) {
    if (d.uid === BILGISAYAR) continue;
    komutlar.push(env.DB.prepare("INSERT INTO players (game_id, uid, status, invited_by, total, updated_at) VALUES (?, ?, 'davetli', ?, 0, ?)").bind(id, d.uid, uid, simdi));
  }
  await env.DB.batch(komutlar);
  return { id };
}

/* Turnuva sürerken arkadaş davet edilir; davet turnuva bitene kadar geçerlidir */
export async function davetEt({ env, uid, govde, simdi }) {
  const g = await env.DB.prepare(
    "SELECT g.* FROM games g JOIN players p ON p.game_id = g.id WHERE g.id = ? AND p.uid = ? AND p.status = 'katildi' AND g.kind = 'turnuva'"
  ).bind(govde.id, uid).first();
  if (!g || g.status !== "suruyor" || simdi > g.ends_at) throw new Hata("oyun-yok", 404);

  const hedef = await kullaniciBul(env, govde.username);
  if (!hedef) throw new Hata("kullanici-yok", 404);
  const [a, b] = cift(uid, hedef.uid);
  const arkadas = await env.DB.prepare("SELECT 1 FROM friends WHERE a = ? AND b = ? AND status = 'arkadas'").bind(a, b).first();
  if (!arkadas) throw new Hata("arkadas-degil");
  if (await engelliMi(env, uid, hedef.uid)) throw new Hata("engelli");

  const s = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM players WHERE game_id = ?3) AS oyuncu,
       (SELECT COUNT(*) FROM players WHERE game_id = ?3 AND uid = ?2) AS var,
       (SELECT COUNT(*) FROM players p JOIN games g ON g.id = p.game_id
          WHERE p.uid = ?2 AND p.invited_by = ?1 AND p.status = 'davetli' AND g.kind = 'turnuva' AND g.status = 'suruyor' AND g.ends_at > ?4) AS ayni,
       (SELECT COUNT(*) FROM players p JOIN games g ON g.id = p.game_id
          WHERE p.invited_by = ?1 AND p.status = 'davetli' AND g.status IN ('bekliyor','suruyor') AND g.ends_at > ?4) AS giden,
       (SELECT COUNT(*) FROM players p JOIN games g ON g.id = p.game_id
          WHERE p.uid = ?2 AND p.status = 'davetli' AND g.status IN ('bekliyor','suruyor') AND g.ends_at > ?4) AS gelen`
  ).bind(uid, hedef.uid, g.id, simdi).first();

  if (s.var) throw new Hata("zaten-turnuvada");
  if (s.oyuncu >= EN_FAZLA_OYUNCU) throw new Hata("turnuva-dolu");
  if (s.ayni > 0) throw new Hata("zaten-davet-var");
  if (s.giden >= EN_FAZLA_GIDEN_DAVET) throw new Hata("giden-davet-siniri");
  if (s.gelen >= EN_FAZLA_GELEN_DAVET) throw new Hata("karsi-davet-siniri");

  await env.DB.batch([
    env.DB.prepare("INSERT INTO players (game_id, uid, status, invited_by, total, updated_at) VALUES (?, ?, 'davetli', ?, 0, ?)").bind(g.id, hedef.uid, uid, simdi),
    env.DB.prepare("UPDATE games SET updated_at = ? WHERE id = ?").bind(simdi, g.id),
  ]);
}

/* ---------- Günlük ve haftalık turnuva ---------- */

async function acikTurnuva(env, tur, simdi) {
  const gunlukMu = tur === "gunluk";
  const bas = gunlukMu ? gunBasi(simdi) : haftaBasi(simdi);
  const bitis = bas + (gunlukMu ? GUN : 7 * GUN);
  const donem = tarih(bas);
  const id = tur + "-" + donem;
  // İlk katılan turnuvayı açar; aynı anda gelen ikinci istek var olanı kullanır
  await env.DB.prepare(
    "INSERT OR IGNORE INTO games (id, kind, format, seed, difficulty, status, period, created_at, starts_at, ends_at, updated_at) VALUES (?, ?, ?, ?, ?, 'suruyor', ?, ?, ?, ?, ?)"
  ).bind(id, tur, gunlukMu ? GUNLUK_HAK : 7, yeniTohum(), zorlukCek(), donem, simdi, bas, bitis, simdi).run();
  return id;
}

export async function katil({ env, uid, govde, simdi }) {
  if (govde.tur !== "gunluk" && govde.tur !== "haftalik") throw new Hata("tur-gecersiz");
  const id = await acikTurnuva(env, govde.tur, simdi);
  await env.DB.prepare(
    "INSERT OR IGNORE INTO players (game_id, uid, status, total, joined_at, updated_at) VALUES (?, ?, 'katildi', 0, ?, ?)"
  ).bind(id, uid, simdi, simdi).run();
  return durum({ env, uid, govde: { id }, simdi });
}

/* Turnuva sayfası: benim turlarım, sıralama (ilk 100) ve benim yerim */
export async function durum({ env, uid, govde, simdi }) {
  const g = await env.DB.prepare("SELECT * FROM games WHERE id = ?").bind(govde.id).first();
  if (!g || g.kind === "duello") throw new Hata("oyun-yok", 404);
  if (g.status === "suruyor" && simdi > g.ends_at) {
    await env.DB.prepare("UPDATE games SET status = 'bitti', updated_at = ? WHERE id = ? AND status = 'suruyor'").bind(simdi, g.id).run();
    g.status = "bitti";
  }
  const ben = await env.DB.prepare("SELECT status, total, last_read_at FROM players WHERE game_id = ? AND uid = ?").bind(g.id, uid).first();
  if (g.kind === "turnuva" && !ben) throw new Hata("oyun-yok", 404);

  const { results: siralama } = await env.DB.prepare(
    `SELECT p.uid, p.total, u.username, u.avatar FROM players p LEFT JOIN users u ON u.uid = p.uid
     WHERE p.game_id = ? AND p.status = 'katildi' ORDER BY p.total DESC, p.joined_at LIMIT ?`
  ).bind(g.id, SIRALAMA_ADEDI).all();
  const sayi = await env.DB.prepare("SELECT COUNT(*) AS n FROM players WHERE game_id = ? AND status = 'katildi'").bind(g.id).first();

  let yerim = null, turlarim = [];
  if (ben && ben.status === "katildi") {
    const ust = await env.DB.prepare("SELECT COUNT(*) AS n FROM players WHERE game_id = ? AND status = 'katildi' AND total > ?").bind(g.id, ben.total).first();
    yerim = ust.n + 1;
    const { results } = await env.DB.prepare("SELECT idx, finished_at, score FROM rounds WHERE game_id = ? AND uid = ?").bind(g.id, uid).all();
    turlarim = results.map((t) => ({ idx: t.idx, bitti: !!t.finished_at, puan: t.finished_at ? t.score : null }));
  }

  return {
    oyun: {
      id: g.id, kind: g.kind, name: g.name, format: g.format, status: g.status, period: g.period,
      startsAt: g.starts_at, endsAt: g.ends_at, acikOyun: acikOyunSayisi(g, simdi),
    },
    katildim: !!(ben && ben.status === "katildi"),
    okunmamis: !!(ben && g.last_msg_at && (!ben.last_read_at || g.last_msg_at > ben.last_read_at)),
    toplam: ben ? ben.total : 0,
    yerim,
    oyuncuSayisi: sayi.n,
    turlarim,
    siralama: siralama.map((o) => ({ ben: o.uid === uid, username: o.username || "Silinmiş kullanıcı", avatar: o.avatar, total: o.total })),
  };
}

/* Geçmiş günlük (7 gün) ve haftalık (4 hafta) turnuvalarım */
export async function gecmis({ env, uid, govde }) {
  if (govde.tur !== "gunluk" && govde.tur !== "haftalik") throw new Hata("tur-gecersiz");
  const { results } = await env.DB.prepare(
    `SELECT g.id, g.period, g.status, p.total,
       (SELECT COUNT(*) FROM players x WHERE x.game_id = g.id AND x.status = 'katildi' AND x.total > p.total) + 1 AS yer,
       (SELECT COUNT(*) FROM players x WHERE x.game_id = g.id AND x.status = 'katildi') AS oyuncu
     FROM players p JOIN games g ON g.id = p.game_id
     WHERE p.uid = ? AND p.status = 'katildi' AND g.kind = ?
     ORDER BY g.starts_at DESC LIMIT ?`
  ).bind(uid, govde.tur, govde.tur === "gunluk" ? 7 : 4).all();
  return { turnuvalar: results.map((r) => ({ id: r.id, period: r.period, status: r.status, total: r.total, yer: r.yer, oyuncuSayisi: r.oyuncu })) };
}
