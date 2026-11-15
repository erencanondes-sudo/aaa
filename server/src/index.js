/* Konfeti sunucusu (Cloudflare Worker) */

import { kimlikDogrula } from "./auth.js";
import { Hata } from "./ortak.js";
import * as profil from "./profil.js";
import * as arkadas from "./arkadas.js";
import * as oyun from "./oyun.js";
import { temizle } from "./temizlik.js";

export { OyunOdasi } from "./oyunOdasi.js";
export { KullaniciOdasi } from "./kullaniciOdasi.js";

const ISLEMLER = {
  "profil/getir": profil.getir,
  "profil/olustur": profil.olustur,
  "profil/avatar": profil.avatarDegistir,
  "profil/ad": profil.adDegistir,
  "profil/duello-acik": profil.duelloAcikDegistir,
  "profil/bildirim": profil.bildirimAyari,
  "profil/sil": profil.sil,
  "profil/sikayet": profil.sikayet,
  "kullanici/getir": profil.kullaniciGetir,
  "arkadas/liste": arkadas.liste,
  "arkadas/istek": arkadas.istekGonder,
  "arkadas/cevap": arkadas.cevapla,
  "arkadas/sil": arkadas.sil,
  "arkadas/engelle": arkadas.engelle,
  "acilis": oyun.acilis,
  "oyun/detay": oyun.detay,
  "oyun/gizle": oyun.gizle,
  "oyun/duello": oyun.duelloOlustur,
  "oyun/cevap": oyun.daveteCevap,
  "oyun/rastgele": oyun.rastgeleKatil,
  "oyun/rastgele-iptal": oyun.rastgeleIptal,
  "tur/basla": oyun.turBasla,
  "tur/duraklat": oyun.turDuraklat,
  "tur/bitir": oyun.turBitir,
  "turnuva/ac": oyun.kisiselAc,
  "turnuva/davet": oyun.davetEt,
  "turnuva/katil": oyun.katil,
  "turnuva/gecmis": oyun.gecmis,
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

    // Anlık bağlantı: tarayıcı bu bağlantıda başlık gönderemediği için giriş belgesi adreste gelir
    if (yol === "baglan" && istek.headers.get("upgrade") === "websocket") {
      const belge = new URL(istek.url).searchParams.get("belge") || "";
      const uid = await kimlikDogrula(new Request(istek.url, { headers: { authorization: "Bearer " + belge } }), env.FIREBASE_PROJE_ID);
      if (!uid) return new Response("giris-gerekli", { status: 401 });
      return oyun.baglan(istek, env, uid);
    }

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
