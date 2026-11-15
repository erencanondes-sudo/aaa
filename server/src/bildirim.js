/* Telefona bildirim (Firebase Cloud Messaging).
   FCM_HESAP: Firebase hizmet hesabı anahtarı (JSON). Cloudflare'e gizli değer olarak girilir. */

let erisim = null;

function b64url(veri) {
  const metin = typeof veri === "string" ? btoa(unescape(encodeURIComponent(veri))) : btoa(String.fromCharCode(...new Uint8Array(veri)));
  return metin.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function erisimAnahtari(env) {
  if (erisim && erisim.bitis > Date.now() + 60000) return erisim.anahtar;
  const hesap = JSON.parse(env.FCM_HESAP);
  const simdi = Math.floor(Date.now() / 1000);
  const ust = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const govde = b64url(JSON.stringify({
    iss: hesap.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: simdi,
    exp: simdi + 3600,
  }));
  const pem = hesap.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const anahtar = await crypto.subtle.importKey(
    "pkcs8", Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const imza = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", anahtar, new TextEncoder().encode(ust + "." + govde));
  const cevap = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + ust + "." + govde + "." + b64url(imza),
  });
  const veri = await cevap.json();
  erisim = { anahtar: veri.access_token, bitis: Date.now() + veri.expires_in * 1000 };
  return erisim.anahtar;
}

/* tur: "oyun" | "mesaj" (kullanıcı ayarlardan ikisini ayrı ayrı kapatabilir) */
export async function bildirimGonder(env, uid, tur, baslik, metin, veri) {
  if (!env.FCM_HESAP) return;
  try {
    const u = await env.DB.prepare("SELECT push_token, notify_game, notify_msg FROM users WHERE uid = ?").bind(uid).first();
    if (!u || !u.push_token) return;
    if (tur === "oyun" && !u.notify_game) return;
    if (tur === "mesaj" && !u.notify_msg) return;

    const cevap = await fetch("https://fcm.googleapis.com/v1/projects/" + env.FIREBASE_PROJE_ID + "/messages:send", {
      method: "POST",
      headers: { authorization: "Bearer " + (await erisimAnahtari(env)), "content-type": "application/json" },
      body: JSON.stringify({ message: { token: u.push_token, notification: { title: baslik, body: metin }, data: veri || {} } }),
    });
    // Uygulama silinmiş ya da izin kaldırılmışsa anahtar unutulur
    if (cevap.status === 404 || cevap.status === 410) {
      await env.DB.prepare("UPDATE users SET push_token = NULL WHERE uid = ? AND push_token = ?").bind(uid, u.push_token).run();
    }
  } catch (e) {
    console.error("bildirim", e);
  }
}
