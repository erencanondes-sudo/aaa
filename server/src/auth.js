/* Firebase giriş belgesinin (ID token) doğrulanması */

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

/* Geçerliyse kullanıcının uid'sini, değilse null döndürür */
export async function kimlikDogrula(istek, projeId) {
  const baslik = istek.headers.get("authorization") || "";
  const belge = baslik.startsWith("Bearer ") ? baslik.slice(7) : null;
  if (!belge) return null;

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

  return gecerli ? icerik.sub : null;
}
