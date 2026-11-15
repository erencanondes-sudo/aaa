/* Turnuva turu odası: her oyuncunun her turnuvası için ayrı bir oda.
   Harfler burada üretilir; telefona yalnızca tahtadaki taşlar ve sıradaki birkaç taş gönderilir. */

import { DurableObject } from "cloudflare:workers";
import { SOZLUK } from "./sozluk.js";
import { turKaydet } from "./oyun.js";
import { GUN } from "./ortak.js";
import { acilisTahtasi, oyuncuTohumu, HarfSirasi, Tahta, ondenVeri, TUR_SURESI, KALAN_SANIYE_PUANI } from "../../shared/oyun.js";

const ONDEN = 3;          // telefona önceden gönderilen taş sayısı (her sıradan)
const PAY = 5000;         // ağ gecikmesi için süre payı

function gecen(t, simdi) {
  return (t.durdu || simdi) - t.basladi - t.durmaMs;
}

function kalanSaniye(t, simdi) {
  return Math.max(0, TUR_SURESI - Math.floor(gecen(t, simdi) / 1000));
}

export class TurOdasi extends DurableObject {

  constructor(ctx, env) {
    super(ctx, env);
    this.siralar = {};
  }

  async sira(t) {
    let s = this.siralar[t.idx];
    const ayni = s && ["serbest", "sesli", "sessiz"].every((ad) => s.konum[ad] === t.konum[ad]);
    if (!ayni) {
      s = new HarfSirasi(t.tohum, t.zorluk);
      s.konum = Object.assign({}, t.konum);
      this.siralar[t.idx] = s;
    }
    await s.hazirla(8 + ONDEN);
    return s;
  }

  async kaydet(t) {
    await this.ctx.storage.put("tur:" + t.idx, t);
    await this.alarmKur();
  }

  /* Süresi dolan tur kendiliğinden kapanır; çıkış hakkıyla bırakılan tur turnuva bitince kapanır (kalan saniyeleriyle) */
  async alarmKur() {
    const turlar = await this.ctx.storage.list({ prefix: "tur:" });
    let en = null, sonBitis = 0;
    for (const t of turlar.values()) {
      sonBitis = Math.max(sonBitis, t.bitis);
      if (t.bitti) continue;
      const zaman = t.durdu ? t.bitis : t.basladi + t.durmaMs + TUR_SURESI * 1000 + PAY;
      en = en === null ? zaman : Math.min(en, zaman);
    }
    // Açık tur kalmadıysa oda turnuva bittikten bir gün sonra temizlenir
    await this.ctx.storage.setAlarm(en !== null ? en : sonBitis + GUN);
  }

  async alarm() {
    const simdi = Date.now();
    const turlar = await this.ctx.storage.list({ prefix: "tur:" });
    let acik = false, sonBitis = 0;
    for (const t of turlar.values()) {
      sonBitis = Math.max(sonBitis, t.bitis);
      if (t.bitti) continue;
      const doldu = t.durdu ? simdi >= t.bitis : gecen(t, simdi) >= TUR_SURESI * 1000 + PAY;
      // Çıkış hakkıyla bırakılan turda kalan saniyeler de puana eklenir
      if (doldu) await this.kapat(t, t.durdu ? kalanSaniye(t, simdi) : 0, simdi);
      else acik = true;
    }
    if (!acik && simdi > sonBitis + GUN - 60000) {
      await this.ctx.storage.deleteAll();
      return;
    }
    await this.alarmKur();
  }

  async kapat(t, kalan, simdi) {
    const puan = t.puan + KALAN_SANIYE_PUANI * kalan;
    await turKaydet(this.env, { id: t.oyunId, kind: "turnuva" }, t.uid, t.idx, puan, t.kelimeler, simdi);
    t.bitti = true;
    t.sonPuan = puan;
    delete this.siralar[t.idx];
    await this.ctx.storage.put("tur:" + t.idx, t);
    return puan;
  }

  async basla(v) {
    let t = await this.ctx.storage.get("tur:" + v.idx);
    if (t && t.bitti) return { hata: "tur-bitti" };

    if (!t) {
      t = {
        oyunId: v.oyunId, uid: v.uid, idx: v.idx, bitis: v.bitis,
        tohum: await oyuncuTohumu(v.tohum, v.uid),
        zorluk: v.zorluk,
        // Açılış tahtası turnuvadaki herkes için aynıdır
        taslar: await acilisTahtasi(v.tohum, v.zorluk, true),
        konum: { serbest: 0, sesli: 0, sessiz: 0 },
        kelimeler: [], puan: 0,
        basladi: v.simdi, durdu: null, durmaMs: 0, cikisKullanildi: false,
      };
      await this.env.DB.prepare("INSERT OR IGNORE INTO rounds (game_id, uid, idx, started_at) VALUES (?, ?, ?, ?)").bind(v.oyunId, v.uid, v.idx, v.simdi).run();
    } else if (t.durdu) {
      // Çıkış hakkından dönüş: süre kaldığı yerden devam eder
      t.durmaMs += v.simdi - t.durdu;
      t.durdu = null;
    }

    const sira = await this.sira(t);
    await this.kaydet(t);
    return {
      taslar: t.taslar,
      onden: ondenVeri(sira, ONDEN),
      kelimeler: t.kelimeler,
      puan: t.puan,
      kalanSaniye: kalanSaniye(t, v.simdi),
      cikisHakki: !t.cikisKullanildi,
    };
  }

  async kelime(v) {
    const t = await this.ctx.storage.get("tur:" + v.idx);
    if (!t || t.bitti) return { hata: "tur-yok", durum: 404 };
    if (t.durdu) return { hata: "tur-durdu" };
    if (gecen(t, v.simdi) > TUR_SURESI * 1000 + PAY) {
      await this.kapat(t, 0, v.simdi);
      await this.alarmKur();
      return { hata: "sure-doldu" };
    }

    const sira = await this.sira(t);
    const tahta = new Tahta(t.taslar, sira);
    tahta.bulunanlar = new Set(t.kelimeler);
    tahta.puan = t.puan;
    const sonuc = tahta.kelimeYaz(v.yerler, v.joker, SOZLUK);
    if (!sonuc.tamam) return { tamam: false, sebep: sonuc.sebep, taslar: t.taslar };

    t.taslar = tahta.taslar;
    t.konum = Object.assign({}, sira.konum);
    t.kelimeler.push(sonuc.kelime);
    t.puan = tahta.puan;
    await sira.hazirla(8 + ONDEN);
    await this.ctx.storage.put("tur:" + t.idx, t);
    return { tamam: true, kelime: sonuc.kelime, puan: sonuc.puan, toplam: t.puan, taslar: t.taslar, onden: ondenVeri(sira, ONDEN) };
  }

  /* Turda bir kez çıkış hakkı: süre durur, puan korunur */
  async duraklat(v) {
    const t = await this.ctx.storage.get("tur:" + v.idx);
    if (!t || t.bitti || t.durdu || t.cikisKullanildi) return { duraklatildi: false };
    t.durdu = v.simdi;
    t.cikisKullanildi = true;
    await this.kaydet(t);
    return { duraklatildi: true };
  }

  async bitir(v) {
    const t = await this.ctx.storage.get("tur:" + v.idx);
    if (!t) return { hata: "tur-yok", durum: 404 };
    if (t.bitti) return { puan: t.sonPuan, kelimeler: t.kelimeler };
    if (t.durdu) return { hata: "tur-durdu" };
    // Telefonun söylediği kalan süre, sunucunun hesapladığından fazla olamaz
    const kalan = Math.max(0, Math.min(kalanSaniye(t, v.simdi), v.kalanSaniye));
    const puan = await this.kapat(t, kalan, v.simdi);
    await this.alarmKur();
    return { puan, kelimeler: t.kelimeler };
  }

}
