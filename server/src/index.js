/* Konfeti sunucusu (Cloudflare Worker) */

import { kimlikDogrula } from "./auth.js";
import { Hata } from "./ortak.js";
import * as profil from "./profil.js";
import * as arkadas from "./arkadas.js";
import * as oyun from "./oyun.js";

const ISLEMLER = {
  "profil/getir": profil.getir,
  "profil/olustur": profil.olustur,
  "profil/avatar": profil.avatarDegistir,
  "profil/ad": profil.adDegistir,
  "profil/duello-acik": profil.duelloAcikDegistir,
  "profil/bildirim": profil.bildirimAyari,
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
  "tur/basla": oyun.turBasla,
  "tur/duraklat": oyun.turDuraklat,
  "tur/bitir": oyun.turBitir,
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
  async fetch(istek, env) {
    if (istek.method === "OPTIONS") return new Response(null, { headers: cors(env) });

    const yol = new URL(istek.url).pathname.replace(/^\/api\//, "");
    const islem = ISLEMLER[yol];
    if (!islem || istek.method !== "POST") return yanit(env, { hata: "bulunamadi" }, 404);

    const uid = await kimlikDogrula(istek, env.FIREBASE_PROJE_ID);
    if (!uid) return yanit(env, { hata: "giris-gerekli" }, 401);

    let govde = {};
    try {
      govde = await istek.json();
    } catch (e) {}

    try {
      const sonuc = await islem({ env, uid, govde, simdi: Date.now() });
      return yanit(env, Object.assign({ tamam: true }, sonuc || {}));
    } catch (e) {
      if (e instanceof Hata) return yanit(env, { hata: e.message }, e.durum);
      console.error(yol, e);
      return yanit(env, { hata: "sunucu-hatasi" }, 500);
    }
  },
};
