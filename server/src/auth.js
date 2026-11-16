/* Giriş belgesinin doğrulanması: Firebase'in belgesi (1 saat geçerli) ya da sunucunun verdiği oturum belgesi.
   Oturum belgesi Firebase belgesiyle yapılan açılışta verilir, 30 gün geçerlidir; telefon uygulama açılınca
   Firebase'i beklemeden sunucuya bununla sorar (Firebase ayrıca telefonda oturumu kontrol eder). */

const ANAHTAR_ADRESI = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let anahtarlar = null;
let anahtarBitis = 0;

async function anahtarlariGetir() {
  if (anahtarlar && Date.now() < anahtarBitis) return anahtarlar;
  const yanit = await fetch(ANAHTAR_ADRESI);
  const veri = await yanit.json();
  const sure = /max-age=(\d+)/.exec(yanit.headers.get("cache-control") || "");
  anahtarBitis = Date.now() + (sure ? parseInt(sure[1], 10) * 1000 : 3600000);
  anahtarlar = {};
  for (const k of veri.keys) {
    anahtarlar[k.kid] = await crypto.subtle.importKey("jwk", k, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  }
  return anahtarlar;
}

function b64(metin) {
  const s = metin.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(s + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
}

function b64Yaz(bayt) {
  return btoa(String.fromCharCode(...new Uint8Array(bayt))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ---------- Oturum belgesi: "o.<uid>.<bitiş saniyesi>.<imza>" ---------- */

export const OTURUM_SURESI = 30 * 86400;
let oturumAnahtari = null;

async function oturumAnahtariGetir(db) {
  if (oturumAnahtari) return oturumAnahtari;
  let r = await db.prepare("SELECT v FROM settings WHERE k = 'oturum'").first();
  if (!r) {
    const yeni = b64Yaz(crypto.getRandomValues(new Uint8Array(32)));
    await db.prepare("INSERT OR IGNORE INTO settings (k, v) VALUES ('oturum', ?)").bind(yeni).run();
    r = await db.prepare("SELECT v FROM settings WHERE k = 'oturum'").first();
  }
  oturumAnahtari = await crypto.subtle.importKey("raw", b64(r.v), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return oturumAnahtari;
}

export async function oturumVer(env, uid) {
  const veri = "o." + uid + "." + (Math.floor(Date.now() / 1000) + OTURUM_SURESI);
  const imza = await crypto.subtle.sign("HMAC", await oturumAnahtariGetir(env.DB), new TextEncoder().encode(veri));
  return veri + "." + b64Yaz(imza);
}

async function oturumDogrula(env, belge) {
  const p = belge.split(".");
  if (p.length !== 4 || p[0] !== "o" || !p[1] || !(Number(p[2]) > Date.now() / 1000)) return null;
  let imza;
  try { imza = b64(p[3]); } catch (e) { return null; }
  const gecerli = await crypto.subtle.verify("HMAC", await oturumAnahtariGetir(env.DB), imza, new TextEncoder().encode(p[0] + "." + p[1] + "." + p[2]));
  return gecerli ? p[1] : null;
}

/* Geçerliyse {uid, firebase: Firebase belgesiyle mi geldi}, değilse null döndürür */
export async function kimlikDogrula(istek, env) {
  const baslik = istek.headers.get("authorization") || "";
  const belge = baslik.startsWith("Bearer ") ? baslik.slice(7) : null;
  if (!belge) return null;

  if (belge.startsWith("o.")) {
    const uid = await oturumDogrula(env, belge);
    return uid ? { uid, firebase: false } : null;
  }

  const projeId = env.FIREBASE_PROJE_ID;
  const parcalar = belge.split(".");
  if (parcalar.length !== 3) return null;

  let ust, icerik;
  try {
    ust = JSON.parse(new TextDecoder().decode(b64(parcalar[0])));
    icerik = JSON.parse(new TextDecoder().decode(b64(parcalar[1])));
  } catch (e) {
    return null;
  }

  const simdi = Math.floor(Date.now() / 1000);
  if (ust.alg !== "RS256") return null;
  if (icerik.aud !== projeId) return null;
  if (icerik.iss !== "https://securetoken.google.com/" + projeId) return null;
  if (!icerik.sub || icerik.exp < simdi || icerik.iat > simdi + 300) return null;

  const anahtar = (await anahtarlariGetir())[ust.kid];
  if (!anahtar) return null;

  const gecerli = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    anahtar,
    b64(parcalar[2]),
    new TextEncoder().encode(parcalar[0] + "." + parcalar[1])
  );

  return gecerli ? { uid: icerik.sub, firebase: true } : null;
}
