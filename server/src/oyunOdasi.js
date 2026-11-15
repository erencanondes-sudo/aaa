/* Oyun odası: her düello, kişisel, günlük ve haftalık turnuva için bir oda.
   Oyunun bütün bilgisi (oyuncular, davetler, turlar, puanlar, sohbet) yalnızca burada durur.
   Süresi dolunca kendini kapatır; biten oyun herkesin son 20 listesinden düşünce ya da en geç 3 ay sonra silinir. */

import { DurableObject } from "cloudflare:workers";
import { GUN } from "./ortak.js";
import { sozluk } from "./sozluk.js";
import { bildirimGonder } from "./bildirim.js";
import {
  yeniTohum, acilisTahtasi, oyuncuTohumu, HarfSirasi, Tahta, ondenVeri,
  TUR_SURESI, KALAN_SANIYE_PUANI,
} from "../../shared/oyun.js";

export const BILGISAYAR = "bilgisayar";
export const SURELER = { 1: GUN, 3: 2 * GUN, 7: 7 * GUN };
export const DAVET_SURESI = 7 * GUN;
export const TURKIYE = 3 * 3600000;
// Biten oyunun odası ne kadar kalır: düello 3 ay, kişisel turnuva 1 ay (ikisinde de son 20 kuralı ayrıca işler),
// günlük turnuva 1 gün (dünün turnuvası), haftalık turnuva 1 hafta (geçen haftanın turnuvası)
const SAKLAMA = { duello: 90 * GUN, turnuva: 30 * GUN, gunluk: 1 * GUN, haftalik: 7 * GUN };
const EN_FAZLA_OYUNCU = 100;
const GORUNEN_MESAJ = 100;   // oyuncu son 100 mesajı görür; bütün mesajlar şikâyetler için oda silinene kadar saklanır
const EN_UZUN_MESAJ = 100;
const SIRALAMA_ADEDI = 100;
const ONDEN = 3;          // turnuvada telefona önceden gönderilen taş sayısı (her sıradan)
const PAY = 5000;         // ağ gecikmesi için süre payı

/* Zorluk: şimdilik kolay ve orta daha sık (oyunların %80'i 0–60, %20'si 60–100) */
function zorlukCek() {
  const r = Math.random();
  return r < 0.8 ? Math.floor(Math.random() * 61) : 60 + Math.floor(Math.random() * 41);
}

/* Her turun kendi tohumu vardır */
async function turTohumu(tohum, idx) {
  const ozet = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tohum + "|tur|" + idx));
  return Array.from(new Uint8Array(ozet).slice(0, 16), (x) => x.toString(16).padStart(2, "0")).join("");
}

/* 7 oyunlukta oyunlar her gece 00:00'da (Türkiye saati) açılır; 6. gün son iki oyun birlikte açılır */
export function acikOyunSayisi(o, simdi) {
  if (o.format !== 7 || !o.startsAt) return o.format;
  const gun = Math.floor((simdi + TURKIYE) / GUN) - Math.floor((o.startsAt + TURKIYE) / GUN) + 1;
  return gun >= 6 ? 7 : Math.max(1, gun);
}

// Harfleri sunucunun ürettiği ve her kelimeyi kontrol ettiği oyunlar: yalnızca günlük ve haftalık turnuva.
// Düelloda ve kişisel turnuvada telefona yalnızca tohum gider; puanı telefon hesaplar.
const turnuvaMi = (kind) => kind === "gunluk" || kind === "haftalik";
const EN_YUKSEK_PUAN = 10000;

/* Düelloda ayrıntıda gösterilen açılış harfleri (telefon gönderir) */
function harfleriDuzelt(liste) {
  return (Array.isArray(liste) ? liste : []).slice(0, 8).map((h) => String(h).slice(0, 1)).filter(Boolean);
}

/* Telefonun gönderdiği kelimeler: en fazla 300, her biri 2–8 harf */
function kelimeleriDuzelt(liste) {
  return (Array.isArray(liste) ? liste : []).slice(0, 300).map((k) => String(k).slice(0, 8)).filter((k) => k.length >= 2);
}

function puanDuzelt(p) {
  return Math.max(0, Math.min(EN_YUKSEK_PUAN, Math.round(Number(p) || 0)));
}

function gecen(t, simdi) {
  return (t.durdu || simdi) - t.basladi - t.durmaMs;
}

function kalanSaniye(t, simdi) {
  return Math.max(0, TUR_SURESI - Math.floor(gecen(t, simdi) / 1000));
}

function disMesaj(m, bakan) {
  return { id: m.id, ben: m.uid === bakan, ad: m.ad, metin: m.metin, zaman: m.zaman };
}

/* ---------- Oda ---------- */

export class OyunOdasi extends DurableObject {

  constructor(ctx, env) {
    super(ctx, env);
    this.siralar = {};
    this.sonMesaj = {};
  }

  async yukle() {
    if (this.oyun !== undefined) return this.oyun;
    this.oyun = (await this.ctx.storage.get("oyun")) || null;
    this.oyuncular = new Map();
    this.mesajlar = [];
    if (this.oyun) {
      for (const o of (await this.ctx.storage.list({ prefix: "o:" })).values()) this.oyuncular.set(o.uid, o);
      this.mesajlar = [...(await this.ctx.storage.list({ prefix: "m:", reverse: true, limit: GORUNEN_MESAJ })).values()].reverse();
    }
    return this.oyun;
  }

  async oyunKaydet() {
    await this.ctx.storage.put("oyun", this.oyun);
  }

  async oyuncuKaydet(o) {
    await this.ctx.storage.put("o:" + o.uid, o);
  }

  yeniOyuncu(uid, status, davetEden, simdi) {
    return { uid, status, davetEden: davetEden || null, total: 0, joinedAt: status === "katildi" ? simdi : null, turlar: {}, bildirimOyun: 0, bildirimMesaj: 0 };
  }

  acik(simdi) {
    return this.oyun.status === "suruyor" && simdi <= this.oyun.endsAt;
  }

  insanlar() {
    return [...this.oyuncular.values()].filter((o) => o.uid !== BILGISAYAR && o.status === "katildi");
  }

  /* ---------- Kurulum ---------- */

  /* v: { id, kind, opponent, creator, name, format, status, createdAt, startsAt, endsAt, period, sourceGame, oyuncular:[{uid,status,davetEden}] } */
  async kur(v) {
    await this.yukle();
    if (this.oyun) return { hata: "zaten-var" };
    const simdi = v.createdAt;
    this.oyun = {
      id: v.id, kind: v.kind, opponent: v.opponent || null, creator: v.creator || null, name: v.name || null,
      format: v.format, seed: yeniTohum(), difficulty: zorlukCek(), status: v.status,
      createdAt: simdi, startsAt: v.startsAt || null, endsAt: v.endsAt, period: v.period || null,
      sourceGame: v.sourceGame || null, surum: 1, bekleyenHaber: [],
    };
    for (const p of v.oyuncular) this.oyuncular.set(p.uid, this.yeniOyuncu(p.uid, p.status, p.davetEden, simdi));

    // Bilgisayarın turlarını telefon hesaplar; oyuncu turunu bırakınca ya da bitirince gönderir
    if (v.opponent === "bilgisayar") this.oyuncular.set(BILGISAYAR, this.yeniOyuncu(BILGISAYAR, "katildi", null, simdi));

    await this.oyunKaydet();
    for (const o of this.oyuncular.values()) await this.oyuncuKaydet(o);
    await this.planla();
    return { tamam: true, endsAt: this.oyun.endsAt };
  }

  /* Günlük ve haftalık turnuva: ilk katılan açar */
  async katil(v) {
    await this.yukle();
    if (!this.oyun) {
      await this.kur({ id: v.id, kind: v.kind, format: v.format, status: "suruyor", createdAt: v.simdi, startsAt: v.startsAt, endsAt: v.endsAt, period: v.period, oyuncular: [] });
    }
    if (!this.acik(v.simdi)) return { hata: "oyun-bitti" };
    if (!this.oyuncular.has(v.uid)) {
      const o = this.yeniOyuncu(v.uid, "katildi", null, v.simdi);
      this.oyuncular.set(v.uid, o);
      await this.oyuncuKaydet(o);
    }
    return { tamam: true, endsAt: this.oyun.endsAt };
  }

  /* Kişisel turnuvaya davet */
  async davetEkle({ uid, davetEden, simdi }) {
    await this.yukle();
    if (!this.oyun || this.oyun.kind !== "turnuva" || !this.acik(simdi)) return { hata: "oyun-yok", durum: 404 };
    const d = this.oyuncular.get(davetEden);
    if (!d || d.status !== "katildi") return { hata: "oyun-yok", durum: 404 };
    if (this.oyuncular.has(uid)) return { hata: "zaten-turnuvada" };
    if (this.oyuncular.size >= EN_FAZLA_OYUNCU) return { hata: "turnuva-dolu" };
    const o = this.yeniOyuncu(uid, "davetli", davetEden, simdi);
    this.oyuncular.set(uid, o);
    await this.oyuncuKaydet(o);
    return { tamam: true, endsAt: this.oyun.endsAt };
  }

  async davetGeriAl({ uid }) {
    await this.yukle();
    const o = this.oyuncular.get(uid);
    if (!o || o.status !== "davetli") return;
    this.oyuncular.delete(uid);
    await this.ctx.storage.delete("o:" + uid);
  }

  /* Kaynak düellonun oyuncuları (düellodan turnuva açmak için) */
  async uyeler({ uid }) {
    await this.yukle();
    if (!this.oyun) return { hata: "oyun-yok", durum: 404 };
    const ben = this.oyuncular.get(uid);
    if (!ben || ben.status !== "katildi") return { hata: "oyun-yok", durum: 404 };
    return { kind: this.oyun.kind, opponent: this.oyun.opponent, format: this.oyun.format, katilanlar: this.insanlar().map((o) => o.uid) };
  }

  /* ---------- Davete cevap ---------- */

  async cevap({ uid, kabul, simdi }) {
    await this.yukle();
    const o = this.oyun && this.oyuncular.get(uid);
    if (!o || o.status !== "davetli") return { hata: "davet-yok", durum: 404 };
    const g = this.oyun;
    if (g.kind === "duello" ? g.status !== "bekliyor" || simdi > g.endsAt : !this.acik(simdi)) return { hata: "davet-yok", durum: 404 };

    // Davet edenin İstekler sekmesi
    if (o.davetEden) await this.odaHaber(o.davetEden, "gidenSonuc", [g.id, uid, kabul ? "kabul" : "red"]);

    if (!kabul) {
      o.status = "reddetti";
      await this.oyuncuKaydet(o);
      if (g.kind === "duello") await this.bitir("reddedildi", simdi);
      return { tamam: true, kind: g.kind };
    }

    o.status = "katildi";
    o.joinedAt = simdi;
    await this.oyuncuKaydet(o);
    if (g.kind === "duello") {
      g.status = "suruyor";
      g.startsAt = simdi;
      g.endsAt = simdi + SURELER[g.format];
      g.surum++;
      await this.oyunKaydet();
      await this.haberVer({ durum: "katildi", bitis: g.endsAt });
      await this.planla();
    }
    return { tamam: true, kind: g.kind, endsAt: g.endsAt };
  }

  /* ---------- Görünüm ---------- */

  turGorunumu(o, ben) {
    return Object.entries(o.turlar).map(([idx, t]) => {
      const tur = { idx: Number(idx), bitti: !!t.bitti, puan: t.bitti ? t.puan : null };
      if (t.harfler && o === ben) tur.harfler = t.harfler;
      // Kelimeler yalnızca bakan oyuncu da o turu bitirdiyse görünür
      if (t.bitti && (o === ben || (ben && ben.turlar[idx] && ben.turlar[idx].bitti))) tur.kelimeler = t.kelimeler;
      return tur;
    });
  }

  async detay({ uid, simdi }) {
    await this.yukle();
    const g = this.oyun;
    const ben = g && this.oyuncular.get(uid);
    if (!g) return { hata: "oyun-yok", durum: 404 };
    if (g.kind === "duello" || g.kind === "turnuva") {
      if (!ben || ben.status === "reddetti") return { hata: "oyun-yok", durum: 404 };
    }

    const oyun = {
      id: g.id, kind: g.kind, opponent: g.opponent, name: g.name, format: g.format, status: g.status,
      createdAt: g.createdAt, startsAt: g.startsAt, endsAt: g.endsAt, period: g.period, surum: g.surum,
      acikOyun: acikOyunSayisi(g, simdi),
    };

    // Günlük ve haftalık turnuvada yalnızca ilk 100 ve benim bilgilerim
    if (g.kind === "gunluk" || g.kind === "haftalik") {
      const siralama = [...this.oyuncular.values()]
        .sort((x, y) => y.total - x.total || x.joinedAt - y.joinedAt)
        .slice(0, SIRALAMA_ADEDI)
        .map((o) => ({ uid: o.uid, total: o.total }));
      return {
        oyun, siralama, oyuncuSayisi: this.oyuncular.size,
        ben: ben ? { total: ben.total, turlar: this.turGorunumu(ben, ben) } : null,
      };
    }

    return {
      oyun,
      oyuncular: [...this.oyuncular.values()].filter((o) => o.status !== "reddetti").map((o) => ({
        uid: o.uid, status: o.status, total: o.total, turlar: this.turGorunumu(o, ben),
      })),
    };
  }

  /* ---------- Turlar ---------- */

  async turOyuncusu(uid, idx, simdi) {
    await this.yukle();
    const o = this.oyun && this.oyuncular.get(uid);
    if (!o || o.status !== "katildi") return { hata: "oyun-yok", durum: 404 };
    if (!Number.isInteger(idx) || idx < 0 || idx >= acikOyunSayisi(this.oyun, simdi)) return { hata: "tur-kapali" };
    return { o };
  }

  async sira(uid, idx, t) {
    const anahtar = uid + ":" + idx;
    let s = this.siralar[anahtar];
    if (!s || ["serbest", "sesli", "sessiz"].some((ad) => s.konum[ad] !== t.konum[ad])) {
      s = new HarfSirasi(t.oyuncuTohumu, this.oyun.difficulty);
      s.konum = Object.assign({}, t.konum);
      this.siralar[anahtar] = s;
    }
    await s.hazirla(8 + ONDEN);
    return s;
  }

  async turBasla({ uid, idx, simdi }) {
    const r = await this.turOyuncusu(uid, idx, simdi);
    if (r.hata) return r;
    const o = r.o;
    let t = o.turlar[idx];
    if (t && t.bitti) return { hata: "tur-bitti" };
    // Yeni bir tur yalnızca oyun sürerken başlar; çıkıştan dönüş bitişten sonra da olabilir (süre kalmışsa)
    if (!t && !this.acik(simdi)) return { hata: "oyun-bitti" };
    o.bildirimOyun = 0;

    const tohum = await turTohumu(this.oyun.seed, idx);
    if (!t) {
      t = { basladi: simdi, durdu: null, durmaMs: 0, cikis: false };
      if (turnuvaMi(this.oyun.kind)) {
        // Açılış tahtası turnuvadaki herkes için aynı; devamı oyuncuya özel
        Object.assign(t, {
          taslar: await acilisTahtasi(tohum, this.oyun.difficulty, true),
          konum: { serbest: 0, sesli: 0, sessiz: 0 },
          oyuncuTohumu: await oyuncuTohumu(tohum, uid),
          kelimeler: [], puan: 0,
        });
      }
      o.turlar[idx] = t;
    } else if (t.durdu) {
      // Çıkış hakkından dönüş: süre kaldığı yerden devam eder
      t.durmaMs += simdi - t.durdu;
      t.durdu = null;
    }
    await this.oyuncuKaydet(o);
    await this.planla();

    const ortak = { kalanSaniye: kalanSaniye(t, simdi), cikisHakki: !t.cikis };
    if (turnuvaMi(this.oyun.kind)) {
      const s = await this.sira(uid, idx, t);
      return Object.assign(ortak, { taslar: t.taslar, onden: ondenVeri(s, ONDEN), kelimeler: t.kelimeler, puan: t.puan });
    }
    // Kişisel turnuvada açılış herkes için aynı, devamı oyuncuya özel
    const kisisel = this.oyun.kind === "turnuva";
    return Object.assign(ortak, {
      acilisTohumu: tohum,
      tohum: kisisel ? await oyuncuTohumu(tohum, uid) : tohum,
      turnuva: kisisel,
      zorluk: this.oyun.difficulty,
      hamleler: t.hamleler || [],
      bilgisayar: this.bilgisayarBekliyor(idx),
    });
  }

  /* Turda bir kez çıkış hakkı: süre durur, o ana kadarki puan saklanır */
  async turDuraklat({ uid, idx, simdi, hamleler, puan, kelimeler, bilgisayar, harfler }) {
    const r = await this.turOyuncusu(uid, idx, simdi);
    if (r.hata) return r;
    await this.bilgisayarTuru(idx, bilgisayar, simdi);
    const t = r.o.turlar[idx];
    if (!t || t.bitti || t.durdu || t.cikis) return { duraklatildi: false };
    if (!turnuvaMi(this.oyun.kind)) {
      // Telefon o ana kadarki puanı ve kelimeleri bildirir; hamleler dönüşte tahtayı kurmak için saklanır
      t.puan = puanDuzelt(puan);
      t.kelimeler = kelimeleriDuzelt(kelimeler);
      t.hamleler = Array.isArray(hamleler) ? hamleler.slice(0, 300) : [];
      t.harfler = harfleriDuzelt(harfler);
    }
    t.durdu = simdi;
    t.cikis = true;
    await this.oyuncuKaydet(r.o);
    await this.planla();
    return { duraklatildi: true };
  }

  /* Turnuvada her kelime odaya gelir; oda yeni taşları ve sıradaki birkaç taşı döner */
  async kelime(uid, { idx, yerler, joker }, simdi) {
    if (!turnuvaMi(this.oyun.kind)) return { hata: "tur-yok" };
    const o = this.oyuncular.get(uid);
    const t = o && o.turlar[idx];
    if (!t || t.bitti) return { hata: "tur-yok" };
    if (t.durdu) return { hata: "tur-durdu" };
    if (gecen(t, simdi) > TUR_SURESI * 1000 + PAY) {
      await this.turKapat(o, idx, t.puan, t.kelimeler, simdi);
      return { hata: "sure-doldu" };
    }
    const s = await this.sira(uid, idx, t);
    const tahta = new Tahta(t.taslar, s);
    tahta.bulunanlar = new Set(t.kelimeler);
    tahta.puan = t.puan;
    const sonuc = tahta.kelimeYaz(Array.isArray(yerler) ? yerler.slice(0, 8) : [], joker || null, sozluk);
    if (!sonuc.tamam) return { tamam: false, sebep: sonuc.sebep, taslar: t.taslar };

    t.taslar = tahta.taslar;
    t.konum = Object.assign({}, s.konum);
    t.kelimeler.push(sonuc.kelime);
    t.puan = tahta.puan;
    await s.hazirla(8 + ONDEN);
    await this.oyuncuKaydet(o);
    return { tamam: true, kelime: sonuc.kelime, puan: sonuc.puan, toplam: t.puan, taslar: t.taslar, onden: ondenVeri(s, ONDEN) };
  }

  async turBitir({ uid, idx, simdi, kalanSaniye: istenen, puan: telefonPuani, kelimeler: telefonKelimeleri, bilgisayar, harfler }) {
    const r = await this.turOyuncusu(uid, idx, simdi);
    if (r.hata) return r;
    await this.bilgisayarTuru(idx, bilgisayar, simdi);
    const o = r.o;
    const t = o.turlar[idx];
    if (!t) return { hata: "tur-yok", durum: 404 };
    if (t.bitti) return { puan: t.puan, kelimeler: t.kelimeler };
    if (t.durdu) return { hata: "tur-durdu" };

    // Telefonun söylediği kalan süre, sunucunun hesapladığından fazla olamaz
    const kalan = Math.max(0, Math.min(kalanSaniye(t, simdi), istenen | 0));
    let puan, kelimeler;
    if (turnuvaMi(this.oyun.kind)) {
      puan = t.puan + KALAN_SANIYE_PUANI * kalan;
      kelimeler = t.kelimeler;
    } else {
      puan = puanDuzelt(telefonPuani);
      kelimeler = kelimeleriDuzelt(telefonKelimeleri);
      t.harfler = harfleriDuzelt(harfler);
    }
    await this.turKapat(o, idx, puan, kelimeler, simdi);
    return { puan, kelimeler };
  }

  /* Bilgisayar rakibin bu turu henüz yazılmadıysa telefon hesaplayıp gönderir */
  bilgisayarBekliyor(idx) {
    const b = this.oyuncular.get(BILGISAYAR);
    return !!b && !(b.turlar[idx] && b.turlar[idx].bitti);
  }

  async bilgisayarTuru(idx, s, simdi) {
    if (!s || !this.bilgisayarBekliyor(idx)) return;
    const b = this.oyuncular.get(BILGISAYAR);
    const puan = puanDuzelt(s.puan);
    b.turlar[idx] = { bitti: true, puan, kelimeler: kelimeleriDuzelt(s.kelimeler), bittiZaman: simdi };
    b.total += puan;
    await this.oyuncuKaydet(b);
  }

  async turKapat(o, idx, puan, kelimeler, simdi) {
    const t = o.turlar[idx];
    o.turlar[idx] = { bitti: true, puan, kelimeler, bittiZaman: simdi };
    if (t && t.harfler) o.turlar[idx].harfler = t.harfler;
    delete this.siralar[o.uid + ":" + idx];
    o.total += puan;
    await this.oyuncuKaydet(o);
    await this.istatistik(o.uid, puan, kelimeler, simdi);

    if (this.oyun.kind === "duello") {
      this.oyun.surum++;
      await this.oyunKaydet();
      await this.rakibeHaber(o.uid);
      if (!this.kapaniyor && this.herkesBitirdi()) await this.duelloyuKapat(simdi);
      else await this.haberVer({});
    }
    if (this.oyun.kind !== "gunluk" && this.oyun.kind !== "haftalik") this.yayinla({ t: "degisti", surum: this.oyun.surum });
    await this.planla();
    return t;
  }

  herkesBitirdi() {
    return this.insanlar().concat(this.oyuncular.get(BILGISAYAR) || []).every((o) => {
      for (let i = 0; i < this.oyun.format; i++) if (!(o.turlar[i] && o.turlar[i].bitti)) return false;
      return true;
    });
  }

  /* Oyuncunun istatistiği (veritabanı) ve bulduğu kelimeler (kendi odası) */
  async istatistik(uid, puan, kelimeler, simdi) {
    if (uid === BILGISAYAR) return;
    const oda = this.env.KULLANICI_ODASI.get(this.env.KULLANICI_ODASI.idFromName(uid));
    const sayi = await oda.kelimeEkle(kelimeler);
    await this.env.DB.prepare(
      "UPDATE users SET word_score_sum = word_score_sum + ?, word_score_count = word_score_count + 1, found_words_count = ?, last_seen = ? WHERE uid = ?"
    ).bind(puan, sayi, simdi, uid).run();
  }

  /* ---------- Kapanış ---------- */

  async duelloyuKapat(simdi) {
    this.kapaniyor = true;
    // Çıkış hakkıyla bırakılıp dönülmeyen turlar: saklanan puan + kalan saniyeler
    for (const o of this.insanlar()) {
      for (const [idx, t] of Object.entries(o.turlar)) {
        if (!t.bitti && t.durdu) await this.turKapat(o, Number(idx), (t.puan || 0) + KALAN_SANIYE_PUANI * kalanSaniye(t, simdi), t.kelimeler || [], simdi);
      }
    }
    this.kapaniyor = false;

    const oyuncular = this.insanlar().concat(this.oyuncular.get(BILGISAYAR) || []);
    const enYuksek = Math.max(...oyuncular.map((o) => o.total));
    const kazananlar = oyuncular.filter((o) => o.total === enYuksek);
    const komutlar = this.insanlar().map((o) =>
      this.env.DB.prepare("UPDATE users SET challenge_count = challenge_count + 1, challenge_wins = challenge_wins + ? WHERE uid = ?")
        .bind(kazananlar.length === 1 && kazananlar[0].uid === o.uid ? 1 : 0, o.uid)
    );
    if (komutlar.length) await this.env.DB.batch(komutlar);
    await this.bitir("bitti", simdi);
  }

  /* status: 'bitti' | 'reddedildi' | 'dustu' */
  async bitir(status, simdi) {
    const g = this.oyun;
    g.status = status;
    g.bittiZaman = simdi;
    g.surum++;
    await this.oyunKaydet();
    if (g.kind === "duello") await this.haberVer({ bitti: true, bittiZaman: simdi });
    this.yayinla({ t: "degisti", surum: g.surum });
    await this.planla();
  }

  /* Turnuva süresi bitince: çıkış hakkıyla bırakılan turlar kalan saniyeleriyle kapanır.
     Bitişten hemen önce başlayan turlar kendi 2 dakikasını tamamlar. */
  async turnuvayiKapat(simdi) {
    for (const o of this.oyuncular.values()) {
      for (const [idx, t] of Object.entries(o.turlar)) {
        if (!t.bitti && t.durdu) await this.turKapat(o, Number(idx), t.puan + KALAN_SANIYE_PUANI * kalanSaniye(t, simdi), t.kelimeler, simdi);
      }
    }
    await this.bitir("bitti", simdi);
  }

  /* ---------- Zamanlayıcı ---------- */

  sonrakiZaman(simdi) {
    const g = this.oyun;
    const zamanlar = [];
    if (g.bekleyenHaber.length) zamanlar.push(simdi + 60000);
    if (g.status === "bekliyor" || g.status === "suruyor") zamanlar.push(g.endsAt);
    if (turnuvaMi(g.kind)) {
      for (const o of this.oyuncular.values()) {
        for (const t of Object.values(o.turlar)) {
          if (!t.bitti && !t.durdu) zamanlar.push(t.basladi + t.durmaMs + TUR_SURESI * 1000 + PAY);
        }
      }
    }
    if (g.status !== "bekliyor" && g.status !== "suruyor") zamanlar.push((g.bittiZaman || g.endsAt) + SAKLAMA[g.kind]);
    return Math.min(...zamanlar);
  }

  async planla() {
    await this.ctx.storage.setAlarm(this.sonrakiZaman(Date.now()));
  }

  async alarm() {
    const simdi = Date.now();
    await this.yukle();
    const g = this.oyun;
    if (!g) return;

    if (g.bekleyenHaber.length) await this.haberleriTekrarla();

    // Süresi dolan tur kendiliğinden kapanır
    if (turnuvaMi(g.kind)) {
      for (const o of this.oyuncular.values()) {
        for (const [idx, t] of Object.entries(o.turlar)) {
          if (!t.bitti && !t.durdu && gecen(t, simdi) >= TUR_SURESI * 1000 + PAY) await this.turKapat(o, Number(idx), t.puan, t.kelimeler, simdi);
        }
      }
    }

    if (g.status === "bekliyor" && simdi >= g.endsAt) await this.bitir("dustu", simdi);
    else if (g.status === "suruyor" && simdi >= g.endsAt) {
      if (g.kind === "duello") await this.duelloyuKapat(simdi);
      else await this.turnuvayiKapat(simdi);
    } else if (g.status !== "bekliyor" && g.status !== "suruyor" && simdi >= (g.bittiZaman || g.endsAt) + SAKLAMA[g.kind]) {
      // Saklama süresi doldu: oda kendini siler
      await this.ctx.storage.deleteAll();
      this.oyun = null;
      this.oyuncular = new Map();
      this.mesajlar = [];
      return;
    }
    await this.planla();
  }

  /* ---------- Oyuncuların listesine haber (yalnızca düelloda) ---------- */

  async haberVer(bilgi) {
    const g = this.oyun;
    if (g.kind !== "duello") return;
    for (const o of this.oyuncular.values()) {
      if (o.uid === BILGISAYAR || o.status === "reddetti") continue;
      await this.odaHaber(o.uid, "guncelle", [g.id, Object.assign({ surum: g.surum }, bilgi)]);
    }
  }

  /* Kullanıcı odasına haber; ulaşmazsa dakikada bir, en fazla 10 kez tekrar denenir */
  async odaHaber(uid, metod, argumanlar) {
    try {
      await this.env.KULLANICI_ODASI.get(this.env.KULLANICI_ODASI.idFromName(uid))[metod](...argumanlar);
    } catch (e) {
      this.oyun.bekleyenHaber.push({ uid, metod, argumanlar, deneme: 0 });
      await this.oyunKaydet();
    }
  }

  async haberleriTekrarla() {
    const g = this.oyun;
    const kalan = [];
    for (const b of g.bekleyenHaber) {
      try {
        await this.env.KULLANICI_ODASI.get(this.env.KULLANICI_ODASI.idFromName(b.uid))[b.metod](...b.argumanlar);
      } catch (e) {
        if (++b.deneme < 10) kalan.push(b);
      }
    }
    g.bekleyenHaber = kalan;
    await this.oyunKaydet();
  }

  /* "Rakibin oynadı": rakip oyuna dönene kadar tekrar gönderilmez */
  async rakibeHaber(uid) {
    const ben = await this.env.DB.prepare("SELECT username FROM users WHERE uid = ?").bind(uid).first();
    for (const o of this.insanlar()) {
      if (o.uid === uid || o.bildirimOyun) continue;
      o.bildirimOyun = 1;
      await this.oyuncuKaydet(o);
      this.ctx.waitUntil(bildirimGonder(this.env, o.uid, "oyun", "Rakibin oynadı", (ben ? ben.username : "Rakibin") + " sırasını oynadı.", { oyun: this.oyun.id }));
    }
  }

  /* ---------- Silinme ----------
     Biten düello ve kişisel turnuva, katılan herkesin son 20 oyun listesinden düşünce silinir (en geç 3 ay). */

  async listedenDustu({ uid }) {
    await this.yukle();
    const g = this.oyun;
    if (!g || g.status === "bekliyor" || g.status === "suruyor" || !(g.kind === "duello" || g.kind === "turnuva")) return;
    g.dusenler = [...new Set([...(g.dusenler || []), uid])];
    if (this.insanlar().every((o) => g.dusenler.includes(o.uid))) {
      await this.ctx.storage.deleteAll();
      this.oyun = null;
      this.oyuncular = new Map();
      this.mesajlar = [];
      return;
    }
    await this.oyunKaydet();
  }

  /* ---------- Hesap silme ---------- */

  async kullaniciSilindi({ uid, simdi }) {
    await this.yukle();
    const g = this.oyun;
    const o = g && this.oyuncular.get(uid);
    if (!o) return;
    if (o.status === "katildi" && g.status !== "bekliyor" && g.status !== "suruyor") return this.listedenDustu({ uid });
    if (o.status === "davetli") {
      if (o.davetEden) await this.odaHaber(o.davetEden, "gidenSonuc", [g.id, uid, "red"]);
      if (g.kind === "duello") {
        o.status = "reddetti";
        await this.oyuncuKaydet(o);
        await this.bitir("reddedildi", simdi);
      } else await this.davetGeriAl({ uid });
    } else if (g.kind === "duello" && g.status === "bekliyor" && g.creator === uid) {
      await this.bitir("dustu", simdi);
    }
  }

  /* ---------- Anlık bağlantı: sohbet ve turnuva kelimeleri ---------- */

  async fetch(istek) {
    await this.yukle();
    const uid = istek.headers.get("x-uid");
    const o = this.oyun && this.oyuncular.get(uid);
    if (!o || o.status !== "katildi") return new Response("oyun-yok", { status: 404 });

    const [telefon, oda] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(oda, [uid]);
    const engelli = JSON.parse(istek.headers.get("x-engelli") || "[]");
    oda.serializeAttachment({ uid, ad: decodeURIComponent(istek.headers.get("x-ad") || ""), engelli });
    oda.send(JSON.stringify({ t: "gecmis", mesajlar: this.mesajlar.filter((m) => !engelli.includes(m.uid)).map((m) => disMesaj(m, uid)) }));

    if (o.bildirimMesaj) {
      o.bildirimMesaj = 0;
      await this.oyuncuKaydet(o);
    }
    return new Response(null, { status: 101, webSocket: telefon });
  }

  yayinla(veri) {
    const metin = JSON.stringify(veri);
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(metin); } catch (e) {}
    }
  }

  async webSocketMessage(ws, ham) {
    await this.yukle();
    if (!this.oyun) return ws.close(1000, "oyun-yok");
    const kim = ws.deserializeAttachment();
    const simdi = Date.now();
    let v;
    try { v = JSON.parse(ham); } catch (e) { return; }

    if (v.t === "kelime") {
      const r = await this.kelime(kim.uid, v, simdi);
      ws.send(JSON.stringify(Object.assign({ t: "kelime", no: v.no }, r)));
      return;
    }

    if (v.t === "mesaj") {
      const metin = String(v.metin || "").replace(/\s+/g, " ").trim();
      if (!metin || [...metin].length > EN_UZUN_MESAJ) return ws.send(JSON.stringify({ t: "hata", hata: "mesaj-gecersiz" }));
      if (simdi - (this.sonMesaj[kim.uid] || 0) < 1000) return ws.send(JSON.stringify({ t: "hata", hata: "cok-hizli" }));
      this.sonMesaj[kim.uid] = simdi;

      // Her mesaj ayrı kayıt; anahtar zamana göre sıralanır
      const son = this.mesajlar[this.mesajlar.length - 1];
      const m = { id: son && son.id >= simdi ? son.id + 1 : simdi, uid: kim.uid, ad: kim.ad, metin, zaman: simdi };
      this.mesajlar.push(m);
      if (this.mesajlar.length > GORUNEN_MESAJ) this.mesajlar.splice(0, this.mesajlar.length - GORUNEN_MESAJ);
      await this.ctx.storage.put("m:" + String(m.id).padStart(15, "0"), m);

      const baglilar = new Set();
      for (const d of this.ctx.getWebSockets()) {
        const a = d.deserializeAttachment();
        baglilar.add(a.uid);
        if (a.engelli.includes(kim.uid)) continue;
        try { d.send(JSON.stringify({ t: "mesaj", mesaj: disMesaj(m, a.uid) })); } catch (e) {}
      }

      // "X sana mesaj gönderdi": yalnızca düelloda, sohbette olmayan rakibe, sohbeti açana kadar bir kez
      if (this.oyun.kind === "duello") {
        for (const o of this.insanlar()) {
          if (o.uid === kim.uid || o.bildirimMesaj || baglilar.has(o.uid)) continue;
          const engelledi = await this.env.DB.prepare("SELECT 1 FROM blocks WHERE uid = ? AND blocked_uid = ?").bind(o.uid, kim.uid).first();
          if (engelledi) continue;
          o.bildirimMesaj = 1;
          await this.oyuncuKaydet(o);
          this.ctx.waitUntil(bildirimGonder(this.env, o.uid, "mesaj", "Yeni mesaj", kim.ad + " sana mesaj gönderdi.", { oyun: this.oyun.id, sohbet: "1" }));
        }
      }
    }
  }

}
