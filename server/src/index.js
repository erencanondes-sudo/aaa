/* Konfeti sunucusu (Cloudflare Worker) */

import { kimlikDogrula } from "./auth.js";
import { Hata } from "./ortak.js";
import * as profil from "./profil.js";
import * as arkadas from "./arkadas.js";
import * as oyun from "./oyun.js";
import * as turnuva from "./turnuva.js";
import * as sohbet from "./sohbet.js";
import { temizle } from "./temizlik.js";

export { TurOdasi } from "./turOdasi.js";

const ISLEMLER = {
  "profil/getir": profil.getir,
  "profil/olustur": profil.olustur,
  "profil/avatar": profil.avatarDegistir,
  "profil/ad": profil.adDegistir,
  "profil/duello-acik": profil.duelloAcikDegistir,
  "profil/bildirim": profil.bildirimAyari,
  "profil/sil": profil.sil,
  "profil/sikayet": profil.sikayet,
  "kullanici/acik": profil.acikOyuncular,
  "kullanici/getir": profil.kullaniciGetir,
  "arkadas/liste": arkadas.liste,
  "arkadas/istek": arkadas.istekGonder,
  "arkadas/cevap": arkadas.cevapla,
  "arkadas/sil": arkadas.sil,
  "arkadas/engelle": arkadas.engelle,
  "oyun/liste": oyun.oyunListesi,
  "oyun/detay": oyun.oyunDetay,
  "oyun/gizle": oyun.oyunGizle,
  "oyun/duello": oyun.duelloOlustur,
  "oyun/cevap": oyun.daveteCevap,
  "oyun/rastgele": oyun.rastgeleKatil,
  "oyun/rastgele-iptal": oyun.rastgeleIptal,
  "tur/basla": oyun.turBasla,
  "tur/kelime": oyun.turKelime,
  "tur/duraklat": oyun.turDuraklat,
  "tur/bitir": oyun.turBitir,
  "turnuva/ac": turnuva.kisiselAc,
  "turnuva/davet": turnuva.davetEt,
  "turnuva/katil": turnuva.katil,
  "turnuva/durum": turnuva.durum,
  "turnuva/gecmis": turnuva.gecmis,
  "sohbet/getir": sohbet.getir,
  "sohbet/gonder": sohbet.gonder,
};

function cors(env) {
  return {
    "Access-Control-Allow-Origin": env.IZINLI_ADRES || "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function yanit(env, veri, durum) {
  return new Response(JSON.stringify(veri), {
    status: durum || 200,
    headers: Object.assign({ "content-type": "application/json; charset=utf-8" }, cors(env)),
  });
}

export default {
  async fetch(istek, env, ctx) {
    if (istek.method === "OPTIONS") return new Response(null, { headers: cors(env) });

    const yol = new URL(istek.url).pathname.replace(/^\/api\//, "");

    // Sürüm kontrolü: girişsiz; telefon bundan eski sürümse güncelleme ister
    if (yol === "surum") return yanit(env, { enDusuk: Number(env.EN_DUSUK_SURUM || 1) });

    const islem = ISLEMLER[yol];
    if (!islem || istek.method !== "POST") return yanit(env, { hata: "bulunamadi" }, 404);

    const uid = await kimlikDogrula(istek, env.FIREBASE_PROJE_ID);
    if (!uid) return yanit(env, { hata: "giris-gerekli" }, 401);

    let govde = {};
    try {
      govde = await istek.json();
    } catch (e) {}

    try {
      const sonuc = await islem({ env, uid, govde, simdi: Date.now(), arka: (is) => ctx.waitUntil(is) });
      return yanit(env, Object.assign({ tamam: true }, sonuc || {}));
    } catch (e) {
      if (e instanceof Hata) return yanit(env, { hata: e.message }, e.durum);
      console.error(yol, e);
      return yanit(env, { hata: "sunucu-hatasi" }, 500);
    }
  },

  async scheduled(olay, env, ctx) {
    ctx.waitUntil(temizle(env));
  },
};
