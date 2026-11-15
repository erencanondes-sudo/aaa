/* Oyun istekleri: telefondan gelen isteği ilgili oyun odasına ve kullanıcı odasına yönlendirir */

import { Hata, GUN, kimlikUret, kullaniciBul, cift, engelliMi } from "./ortak.js";
import { bildirimGonder } from "./bildirim.js";
import { getir as profilGetir } from "./profil.js";
import { liste as arkadasListesi } from "./arkadas.js";
import { BILGISAYAR, SURELER, DAVET_SURESI, TURKIYE } from "./oyunOdasi.js";

const KUYRUK_SURESI = 2 * GUN;
const GUNLUK_HAK = 1;          // günlük turnuvada oynama hakkı
const EN_FAZLA_OKUNAN = 40;    // açılışta en fazla kaç oyunun ayrıntısı gelir

const oyunOdasi = (env, id) => env.OYUN_ODASI.get(env.OYUN_ODASI.idFromName(id));
const kullaniciOdasi = (env, uid) => env.KULLANICI_ODASI.get(env.KULLANICI_ODASI.idFromName(uid));

function sonuc(r) {
  if (r && r.hata) throw new Hata(r.hata, r.durum);
  return r;
}

/* Odalar oyuncuları uid ile tutar; telefona kullanıcı adı ve avatar gider, uid gitmez */
async function adlar(env, uidler) {
  const harita = {};
  const liste = [...new Set(uidler)].filter((u) => u !== BILGISAYAR);
  for (let i = 0; i < liste.length; i += 90) {
    const parca = liste.slice(i, i + 90);
    const { results } = await env.DB.prepare(
      `SELECT uid, username, avatar FROM users WHERE uid IN (${parca.map(() => "?").join(",")})`
    ).bind(...parca).all();
    for (const r of results) harita[r.uid] = r;
  }
  return harita;
}

function kisi(harita, uid, ben) {
  if (uid === BILGISAYAR) return { ben: false, username: "Bilgisayar", avatar: null };
  const u = harita[uid];
  return { ben: uid === ben, username: u ? u.username : "Silinmiş kullanıcı", avatar: u ? u.avatar : null };
}

async function telefonaHazirla(env, detaylar, uid) {
  const uidler = [];
  for (const d of detaylar) (d.oyuncular || d.siralama || []).forEach((o) => uidler.push(o.uid));
  const harita = await adlar(env, uidler);
  return detaylar.map((d) => {
    const cikti = Object.assign({}, d);
    if (d.oyuncular) cikti.oyuncular = d.oyuncular.map(({ uid: u, ...o }) => Object.assign(kisi(harita, u, uid), o));
    if (d.siralama) cikti.siralama = d.siralama.map(({ uid: u, ...o }) => Object.assign(kisi(harita, u, uid), o));
    return cikti;
  });
}

/* ---------- Açılış ---------- */

/* Telefon elindeki oyunların sürüm numaralarını gönderir (bilinen: {oyunId: surum});
   yalnızca numarası değişen oyunların ayrıntısı gelir. Bilinen boşsa hepsi gelir. */
export async function acilis({ env, uid, govde, simdi }) {
  const [p, { liste, giden }, arkadaslik] = await Promise.all([
    profilGetir({ env, uid }), kullaniciOdasi(env, uid).getir(simdi, uid), arkadasListesi({ env, uid, simdi }),
  ]);
  const bilinen = govde.bilinen || {};

  const istenecek = Object.entries(liste)
    .filter(([id, k]) => (k.kind === "duello" || k.kind === "turnuva") && bilinen[id] !== k.surum)
    .map(([id]) => id)
    .slice(0, EN_FAZLA_OKUNAN);

  const silinen = [];
  const detaylar = [];
  await Promise.all(istenecek.map(async (id) => {
    let d;
    try {
      d = await oyunOdasi(env, id).detay({ uid, simdi });
    } catch (e) {
      return;
    }
    if (d.hata) silinen.push(id);
    else detaylar.push(d);
  }));
  // Oyun odası artık yoksa oyun listeden çıkar
  for (const id of silinen) await kullaniciOdasi(env, uid).cikar(id);

  // İstekler sekmesi: gönderdiğim düello ve turnuva davetleri
  const harita = await adlar(env, giden.map((d) => d.hedef));
  // Düelloya açık oyuncular: gece hazırlanan 1000 satırdan rastgele biri (tek satır okunur).
  // Telefon önce 15'ini, "devamını gör" deyince 50'sini gösterir.
  const satir = await env.DB.prepare("SELECT data FROM duel_pool WHERE id = ?").bind(Math.floor(Math.random() * 1000)).first();
  const kuyruk = await env.DB.prepare("SELECT 1 FROM queue WHERE uid = ? AND created_at > ?").bind(uid, simdi - KUYRUK_SURESI).first();
  const benimAdim = p.profil ? p.profil.username : null;

  return {
    profil: p.profil,
    arkadaslik,
    rastgeleBekliyor: !!kuyruk,
    acikOyuncular: satir ? JSON.parse(satir.data).filter((o) => o.username !== benimAdim) : [],
    giden: giden.map((d) => Object.assign(kisi(harita, d.hedef, uid), {
      oyunId: d.oyunId, kind: d.kind, zaman: d.zaman,
      durum: d.durum === "bekliyor" && d.bitis < simdi ? "dustu" : d.durum,
    })),
    liste: Object.entries(liste).filter(([id]) => !silinen.includes(id)).map(([id, k]) => ({
      id, kind: k.kind, durum: k.durum, surum: k.surum, bitis: k.bitis, bitti: !!k.bitti || (k.bitis && k.bitis < simdi),
    })),
    oyunlar: await telefonaHazirla(env, detaylar, uid),
  };
}

export async function detay({ env, uid, govde, simdi }) {
  const d = await oyunOdasi(env, String(govde.id)).detay({ uid, simdi });
  if (d.hata === "oyun-yok") await kullaniciOdasi(env, uid).cikar(String(govde.id));
  sonuc(d);
  const [oyun] = await telefonaHazirla(env, [d], uid);
  return { oyun };
}

export async function gizle({ env, uid, govde, simdi }) {
  sonuc(await kullaniciOdasi(env, uid).gizle(String(govde.id), simdi));
}

/* ---------- Düello ---------- */

export async function duelloOlustur({ env, uid, govde, simdi, arka }) {
  const format = [1, 3, 7].includes(govde.format) ? govde.format : null;
  if (!format) throw new Hata("format-gecersiz");
  const id = kimlikUret();
  const benim = kullaniciOdasi(env, uid);

  if (govde.rakip === "bilgisayar") {
    const bitis = simdi + SURELER[format];
    sonuc(await benim.ekle(id, { kind: "duello", durum: "katildi", surum: 1, bitis }, { devam: true }, simdi));
    await oyunOdasi(env, id).kur({
      id, kind: "duello", opponent: "bilgisayar", creator: uid, format, status: "suruyor",
      createdAt: simdi, startsAt: simdi, endsAt: bitis, oyuncular: [{ uid, status: "katildi" }],
    });
    return { id };
  }

  // Arkadaşa ya da kullanıcı adıyla düello daveti (1 hafta geçerli)
  const hedef = await kullaniciBul(env, govde.username);
  if (!hedef) throw new Hata("kullanici-yok", 404);
  if (hedef.uid === uid) throw new Hata("kendin");
  if (await engelliMi(env, uid, hedef.uid)) throw new Hata("engelli");
  // Karşı taraf engellediyse davet ona hiç ulaşmaz (gönderene belli edilmez)
  const sessiz = await engelliMi(env, hedef.uid, uid);

  const bitis = simdi + DAVET_SURESI;
  sonuc(await benim.kontrol({}, { devam: true }, simdi));
  sonuc(await benim.gidenEkle({ oyunId: id, kind: "duello", hedef: hedef.uid, bitis }, simdi));
  if (!sessiz) {
    const r = await kullaniciOdasi(env, hedef.uid).ekle(id, { kind: "duello", durum: "davetli", davetEden: uid, surum: 1, bitis }, { gelen: true, ayniKisi: true }, simdi);
    if (r.hata) {
      await benim.gidenSil(id, hedef.uid);
      throw new Hata(r.hata);
    }
  }
  await benim.ekle(id, { kind: "duello", durum: "bekliyor", surum: 1, bitis }, null, simdi);
  await oyunOdasi(env, id).kur({
    id, kind: "duello", opponent: "arkadas", creator: uid, format, status: "bekliyor", createdAt: simdi, endsAt: bitis,
    oyuncular: [{ uid, status: "katildi" }, { uid: hedef.uid, status: "davetli", davetEden: uid }],
  });

  if (!sessiz && arka) {
    const ben = await env.DB.prepare("SELECT username FROM users WHERE uid = ?").bind(uid).first();
    arka(bildirimGonder(env, hedef.uid, "oyun", "Düello daveti", ben.username + " seni düelloya davet etti.", { oyun: id }));
  }
  return { id };
}

/* Rastgele rakip: bekleyen biri varsa hemen eşleşir, yoksa 48 saat sırada kalır */
export async function rastgeleKatil({ env, uid, simdi, arka }) {
  sonuc(await kullaniciOdasi(env, uid).kontrol({}, { devam: true }, simdi));
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
    const id = kimlikUret();
    const bitis = simdi + SURELER[1];
    await oyunOdasi(env, id).kur({
      id, kind: "duello", opponent: "rastgele", creator: r.uid, format: 1, status: "suruyor",
      createdAt: simdi, startsAt: simdi, endsAt: bitis,
      oyuncular: [{ uid: r.uid, status: "katildi" }, { uid, status: "katildi" }],
    });
    const kayit = { kind: "duello", durum: "katildi", surum: 1, bitis };
    await kullaniciOdasi(env, uid).ekle(id, kayit, null, simdi);
    await kullaniciOdasi(env, r.uid).ekle(id, kayit, null, simdi);
    if (arka) arka(bildirimGonder(env, r.uid, "oyun", "Rakip bulundu", "Rastgele düellon başladı.", { oyun: id }));
    return { id };
  }

  await env.DB.prepare("INSERT OR REPLACE INTO queue (uid, created_at) VALUES (?, ?)").bind(uid, simdi).run();
  return { bekliyor: true };
}

export async function rastgeleIptal({ env, uid }) {
  await env.DB.prepare("DELETE FROM queue WHERE uid = ?").bind(uid).run();
}

/* Düello ya da kişisel turnuva davetine cevap */
export async function daveteCevap({ env, uid, govde, simdi }) {
  const id = String(govde.id);
  const benim = kullaniciOdasi(env, uid);
  if (govde.kabul) sonuc(await benim.kontrol({}, { devam: true }, simdi));
  const r = sonuc(await oyunOdasi(env, id).cevap({ uid, kabul: !!govde.kabul, simdi }));
  // Düelloda listeleri oda günceller; turnuvada yalnızca kendi listem güncellenir
  if (r.kind === "turnuva") {
    if (govde.kabul) await benim.guncelle(id, { durum: "katildi", bitis: r.endsAt });
    else await benim.cikar(id);
  } else if (!govde.kabul) await benim.cikar(id);
}

/* ---------- Turlar ---------- */

export async function turBasla({ env, uid, govde, simdi }) {
  return sonuc(await oyunOdasi(env, String(govde.id)).turBasla({ uid, idx: govde.idx | 0, simdi }));
}

export async function turDuraklat({ env, uid, govde, simdi }) {
  const hamleler = Array.isArray(govde.hamleler) ? govde.hamleler.slice(0, 300) : [];
  return sonuc(await oyunOdasi(env, String(govde.id)).turDuraklat({ uid, idx: govde.idx | 0, simdi, hamleler, puan: govde.puan, kelimeler: govde.kelimeler }));
}

export async function turBitir({ env, uid, govde, simdi }) {
  return sonuc(await oyunOdasi(env, String(govde.id)).turBitir({ uid, idx: govde.idx | 0, simdi, kalanSaniye: govde.kalanSaniye | 0, puan: govde.puan, kelimeler: govde.kelimeler }));
}

/* ---------- Turnuvalar ---------- */

/* Düellodaki "Arkadaş ekle": düellonun oyuncularıyla yeni bir turnuva açılır.
   Biçim düellodaki gibi seçilir: 1 oyun 24 saat, 3 oyun 48 saat, 7 oyun 1 hafta. */
export async function kisiselAc({ env, uid, govde, simdi }) {
  const format = [1, 3, 7].includes(govde.format) ? govde.format : null;
  if (!format) throw new Hata("format-gecersiz");
  const kaynak = sonuc(await oyunOdasi(env, String(govde.kaynak)).uyeler({ uid }));
  if (kaynak.kind !== "duello" || kaynak.opponent === "bilgisayar") throw new Hata("oyun-yok", 404);

  const id = kimlikUret();
  const bitis = simdi + SURELER[format];
  sonuc(await kullaniciOdasi(env, uid).ekle(id, { kind: "turnuva", durum: "katildi", surum: 1, bitis }, { devam: true }, simdi));

  const oyuncular = [{ uid, status: "katildi" }];
  for (const d of kaynak.katilanlar) {
    if (d === uid) continue;
    if ((await kullaniciOdasi(env, uid).gidenEkle({ oyunId: id, kind: "turnuva", hedef: d, bitis }, simdi)).hata) continue;
    const r = await kullaniciOdasi(env, d).ekle(id, { kind: "turnuva", durum: "davetli", davetEden: uid, surum: 1, bitis }, { gelen: true, ayniKisi: true }, simdi);
    if (!r.hata) oyuncular.push({ uid: d, status: "davetli", davetEden: uid });
    else await kullaniciOdasi(env, uid).gidenSil(id, d);
  }
  await oyunOdasi(env, id).kur({
    id, kind: "turnuva", creator: uid, name: String(govde.ad || "").trim().slice(0, 30) || null, format, status: "suruyor",
    createdAt: simdi, startsAt: simdi, endsAt: bitis, sourceGame: String(govde.kaynak), oyuncular,
  });
  return { id };
}

/* Turnuva sürerken arkadaş davet edilir; davet turnuva bitene kadar geçerlidir */
export async function davetEt({ env, uid, govde, simdi }) {
  const id = String(govde.id);
  const hedef = await kullaniciBul(env, govde.username);
  if (!hedef) throw new Hata("kullanici-yok", 404);
  const [a, b] = cift(uid, hedef.uid);
  const arkadas = await env.DB.prepare("SELECT 1 FROM friends WHERE a = ? AND b = ? AND status = 'arkadas'").bind(a, b).first();
  if (!arkadas) throw new Hata("arkadas-degil");
  if (await engelliMi(env, uid, hedef.uid) || await engelliMi(env, hedef.uid, uid)) throw new Hata("engelli");

  const oda = oyunOdasi(env, id);
  const benim = kullaniciOdasi(env, uid);
  const r = sonuc(await oda.davetEkle({ uid: hedef.uid, davetEden: uid, simdi }));
  const g = await benim.gidenEkle({ oyunId: id, kind: "turnuva", hedef: hedef.uid, bitis: r.endsAt }, simdi);
  const l = g.hata ? g : await kullaniciOdasi(env, hedef.uid).ekle(id, { kind: "turnuva", durum: "davetli", davetEden: uid, surum: 1, bitis: r.endsAt }, { gelen: true, ayniKisi: true }, simdi);
  if (l.hata) {
    await oda.davetGeriAl({ uid: hedef.uid });
    if (!g.hata) await benim.gidenSil(id, hedef.uid);
    throw new Hata(l.hata);
  }
}

/* Türkiye saatiyle gün ve hafta */
function gunBasi(simdi) {
  return Math.floor((simdi + TURKIYE) / GUN) * GUN - TURKIYE;
}

function haftaBasi(simdi) {
  const gun = gunBasi(simdi);
  return gun - ((new Date(gun + TURKIYE).getUTCDay() + 6) % 7) * GUN; // pazartesi
}

export async function katil({ env, uid, govde, simdi }) {
  const tur = govde.tur;
  if (tur !== "gunluk" && tur !== "haftalik") throw new Hata("tur-gecersiz");
  const bas = tur === "gunluk" ? gunBasi(simdi) : haftaBasi(simdi);
  const bitis = bas + (tur === "gunluk" ? GUN : 7 * GUN);
  const period = new Date(bas + TURKIYE).toISOString().slice(0, 10);
  const id = tur + "-" + period;

  sonuc(await oyunOdasi(env, id).katil({ id, kind: tur, format: tur === "gunluk" ? GUNLUK_HAK : 7, startsAt: bas, endsAt: bitis, period, uid, simdi }));
  await kullaniciOdasi(env, uid).ekle(id, { kind: tur, durum: "katildi", surum: 1, bitis }, null, simdi);
  return detay({ env, uid, govde: { id }, simdi });
}

/* Geçmiş günlük (7 gün) ve haftalık (4 hafta) turnuvalarım */
export async function gecmis({ env, uid, govde, simdi }) {
  if (govde.tur !== "gunluk" && govde.tur !== "haftalik") throw new Hata("tur-gecersiz");
  const { liste } = await kullaniciOdasi(env, uid).getir(simdi);
  const idler = Object.entries(liste).filter(([, k]) => k.kind === govde.tur).sort((x, y) => y[1].bitis - x[1].bitis).map(([id]) => id);
  const turnuvalar = [];
  for (const id of idler) {
    const d = await oyunOdasi(env, id).detay({ uid, simdi });
    if (d.hata) continue;
    const yer = d.siralama.findIndex((s) => s.uid === uid);
    turnuvalar.push({ id, period: d.oyun.period, status: d.oyun.status, total: d.ben ? d.ben.total : 0, yer: yer === -1 ? null : yer + 1, oyuncuSayisi: d.oyuncuSayisi });
  }
  return { turnuvalar };
}

/* ---------- Anlık bağlantı (sohbet ve turnuvada kelimeler) ---------- */

export async function baglan(istek, env, uid) {
  // Kendi oyun listemin canlı bağlantısı
  if (new URL(istek.url).searchParams.get("liste")) {
    return kullaniciOdasi(env, uid).fetch(new Request(istek.url, { headers: { upgrade: "websocket" } }));
  }
  const id = new URL(istek.url).searchParams.get("oyun") || "";
  const u = await env.DB.prepare("SELECT username FROM users WHERE uid = ?").bind(uid).first();
  if (!u) return new Response("profil-yok", { status: 404 });
  const { results } = await env.DB.prepare("SELECT blocked_uid FROM blocks WHERE uid = ?").bind(uid).all();
  return oyunOdasi(env, id).fetch(new Request(istek.url, {
    headers: {
      upgrade: "websocket",
      "x-uid": uid,
      "x-ad": encodeURIComponent(u.username),
      "x-engelli": JSON.stringify(results.map((r) => r.blocked_uid)),
    },
  }));
}
