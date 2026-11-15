/* Kullanıcı odası: her oyuncunun oyun listesi, sınır sayaçları ve bulduğu kelimeler.
   Oyunların asıl bilgisi oyun odalarındadır; burada yalnızca "hangi oyun, hangi sürümde" tutulur. */

import { DurableObject } from "cloudflare:workers";

const EN_FAZLA_BITEN = 20;
const EN_FAZLA_DEVAM_EDEN = 20;
const EN_FAZLA_GIDEN_DAVET = 50;
const EN_FAZLA_GELEN_DAVET = 100;
const PARCA = 8000; // bir kayıtta en fazla kaç kelime

/* Liste kaydı: { kind, durum, surum, bitis, bitti, bittiZaman, davetEden }
   durum: 'katildi' | 'davetli' | 'bekliyor' (düello daveti gönderdim, cevap bekliyorum)
   Giden davet kaydı (İstekler sekmesi): { oyunId, kind, hedef, durum: 'bekliyor'|'kabul'|'red', zaman, bitis }
   Cevaplanan ya da süresi dolan davetler bitişten 7 gün sonra silinir. */

function bittiMi(k, simdi) {
  return k.bitti || (k.bitis && k.bitis < simdi);
}

export class KullaniciOdasi extends DurableObject {

  async yukle() {
    if (!this.liste) {
      this.liste = (await this.ctx.storage.get("liste")) || {};
      this.giden = (await this.ctx.storage.get("giden")) || {};
    }
    return this.liste;
  }

  async kaydet() {
    await this.ctx.storage.put("liste", this.liste);
  }

  async gidenKaydet() {
    await this.ctx.storage.put("giden", this.giden);
  }

  gidenBekleyen(simdi) {
    return Object.values(this.giden).filter((d) => d.durum === "bekliyor" && d.bitis > simdi).length;
  }

  /* Giden davet (düello ya da turnuva): en fazla 50 cevapsız */
  async gidenEkle(kayit, simdi) {
    await this.ayikla(simdi);
    if (this.gidenBekleyen(simdi) >= EN_FAZLA_GIDEN_DAVET) return { hata: "giden-davet-siniri" };
    this.giden[kayit.oyunId + ":" + kayit.hedef] = Object.assign({ durum: "bekliyor", zaman: simdi }, kayit);
    await this.gidenKaydet();
    return { tamam: true };
  }

  async gidenSil(oyunId, hedef) {
    await this.yukle();
    if (!this.giden[oyunId + ":" + hedef]) return;
    delete this.giden[oyunId + ":" + hedef];
    await this.gidenKaydet();
  }

  /* Oyun odası davetin cevabını bildirir */
  async gidenSonuc(oyunId, hedef, durum) {
    await this.yukle();
    const d = this.giden[oyunId + ":" + hedef];
    if (!d || d.durum !== "bekliyor") return;
    d.durum = durum;
    await this.gidenKaydet();
  }

  /* Biten oyunlardan yalnızca son 20'si kalır; cevaplanmadan süresi dolan davetler düşer */
  async ayikla(simdi) {
    const l = await this.yukle();
    let degisti = false;
    for (const [id, k] of Object.entries(l)) {
      // Cevaplanmadan süresi dolan gelen davetler listeden düşer
      if (k.durum === "davetli" && bittiMi(k, simdi)) { delete l[id]; degisti = true; }
    }
    const bitenler = Object.entries(l)
      .filter(([, k]) => k.kind !== "gunluk" && k.kind !== "haftalik" && bittiMi(k, simdi))
      .sort((x, y) => (y[1].bittiZaman || y[1].bitis) - (x[1].bittiZaman || x[1].bitis));
    for (const [id] of bitenler.slice(EN_FAZLA_BITEN)) { delete l[id]; degisti = true; this.dustu(id); }
    // Günlük turnuva 7 gün, haftalık 4 hafta listede kalır
    for (const [id, k] of Object.entries(l)) {
      const sure = k.kind === "gunluk" ? 7 : k.kind === "haftalik" ? 28 : 0;
      if (sure && k.bitis + sure * 86400000 < simdi) { delete l[id]; degisti = true; }
    }
    if (degisti) await this.kaydet();
    let gidenDegisti = false;
    for (const [k, d] of Object.entries(this.giden)) {
      if (d.bitis + 7 * 86400000 < simdi) { delete this.giden[k]; gidenDegisti = true; }
    }
    if (gidenDegisti) await this.gidenKaydet();
    return l;
  }

  /* Biten oyun listemden düştü: oyun odasına haber (iki oyuncunun da listesinden düşen oyun silinir).
     Haber ulaşmazsa oyun odası 1 yıl dolunca kendini yine siler. */
  dustu(id) {
    const uid = this.ctx.id.name || this.sahip;
    if (!uid) return;
    this.ctx.waitUntil(this.env.OYUN_ODASI.get(this.env.OYUN_ODASI.idFromName(id)).listedenDustu({ uid }).catch(() => {}));
  }

  async getir(simdi, uid) {
    // Oda kimin olduğunu bilsin (oyun odasına haber verirken gerekir)
    if (uid && !this.sahip) {
      this.sahip = (await this.ctx.storage.get("sahip")) || uid;
      await this.ctx.storage.put("sahip", uid);
    }
    return { liste: await this.ayikla(simdi), giden: Object.values(this.giden) };
  }

  /* sinirlar: { devam, gelen, ayniKisi } — hangileri kontrol edilecek */
  async kontrol(kayit, sinirlar, simdi) {
    const l = await this.ayikla(simdi);
    const aktif = Object.values(l).filter((k) => !bittiMi(k, simdi) && (k.kind === "duello" || k.kind === "turnuva"));
    if (sinirlar) {
      if (sinirlar.devam && aktif.filter((k) => k.durum === "katildi" || k.durum === "bekliyor").length >= EN_FAZLA_DEVAM_EDEN) return { hata: "devam-eden-siniri" };
      if (sinirlar.gelen && aktif.filter((k) => k.durum === "davetli").length >= EN_FAZLA_GELEN_DAVET) return { hata: "karsi-davet-siniri" };
      if (sinirlar.ayniKisi && aktif.some((k) => k.durum === "davetli" && k.kind === kayit.kind && k.davetEden === kayit.davetEden)) return { hata: "zaten-davet-var" };
    }
    return { tamam: true };
  }

  async ekle(id, kayit, sinirlar, simdi) {
    const k = await this.kontrol(kayit, sinirlar, simdi);
    if (k.hata) return k;
    const l = this.liste;
    if (l[id]) return { hata: "zaten-var" };
    l[id] = kayit;
    await this.kaydet();
    return { tamam: true };
  }

  /* Oyun odası haber verir; sırasız gelen eski haber yok sayılır */
  async guncelle(id, bilgi) {
    const l = await this.yukle();
    const k = l[id];
    if (!k) return;
    if (bilgi.surum !== undefined && bilgi.surum < (k.surum || 0)) return;
    Object.assign(k, bilgi);
    await this.kaydet();
  }

  async cikar(id) {
    const l = await this.yukle();
    if (!l[id]) return;
    delete l[id];
    await this.kaydet();
  }

  /* Oyuncu kendi listesinden biten oyunu siler */
  async gizle(id, simdi) {
    const l = await this.yukle();
    if (!l[id] || !bittiMi(l[id], simdi)) return { hata: "oyun-bitmedi" };
    delete l[id];
    await this.kaydet();
    this.dustu(id);
    return { tamam: true };
  }

  /* Bulunan kelimeler: yeni olanlar eklenir, toplam sayı döner */
  async kelimeEkle(kelimeler) {
    if (!this.kelimeler) {
      this.kelimeler = new Set();
      const parcalar = [...(await this.ctx.storage.list({ prefix: "k:" })).entries()]
        .sort((x, y) => Number(x[0].slice(2)) - Number(y[0].slice(2)));
      for (const [, p] of parcalar) for (const w of p.split(",")) if (w) this.kelimeler.add(w);
    }
    const yeni = kelimeler.filter((w) => !this.kelimeler.has(w));
    if (yeni.length) {
      yeni.forEach((w) => this.kelimeler.add(w));
      // Yalnızca son parça yeniden yazılır
      const hepsi = [...this.kelimeler];
      const son = Math.floor((hepsi.length - 1) / PARCA);
      const ilkDegisen = Math.floor((hepsi.length - yeni.length) / PARCA);
      for (let i = ilkDegisen; i <= son; i++) await this.ctx.storage.put("k:" + i, hepsi.slice(i * PARCA, (i + 1) * PARCA).join(","));
    }
    return this.kelimeler.size;
  }

  /* Hesap silme: oyun numaraları verilir, oda temizlenir */
  async sil() {
    const l = await this.yukle();
    const idler = Object.keys(l);
    await this.ctx.storage.deleteAll();
    this.liste = {};
    this.giden = {};
    this.kelimeler = null;
    return idler;
  }

}
