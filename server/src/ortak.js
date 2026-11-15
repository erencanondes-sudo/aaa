/* Sunucunun ortak yardımcıları */

export class Hata extends Error {
  constructor(mesaj, durum) {
    super(mesaj);
    this.durum = durum || 400;
  }
}

export const GUN = 86400000;

export function kimlikUret() {
  const b = new Uint8Array(10);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(36).padStart(2, "0")).join("").slice(0, 16);
}

/* Kullanıcı adı: 3–15 karakter; küçük harf, rakam ve alt çizgi */
const KUFURLER = ["amk", "amcık", "orospu", "yarrak", "siktir", "pezevenk", "kahpe", "ibne", "gavat", "kaltak"];

export function kullaniciAdiDuzelt(ad) {
  const k = String(ad || "").trim().toLocaleLowerCase("tr");
  if (!/^[a-zçğıöşü0-9_]{3,15}$/.test(k)) throw new Hata("ad-gecersiz");
  if (KUFURLER.some((x) => k.includes(x))) throw new Hata("ad-uygunsuz");
  return k;
}

export async function kullaniciBul(env, kullaniciAdi) {
  return env.DB.prepare("SELECT uid, username, avatar FROM users WHERE username = ?")
    .bind(String(kullaniciAdi || "").toLocaleLowerCase("tr"))
    .first();
}

/* Arkadaşlık satırı her zaman (küçük uid, büyük uid) sırasıyla tutulur */
export function cift(x, y) {
  return x < y ? [x, y] : [y, x];
}

export async function engelliMi(env, uid, karsi) {
  const satir = await env.DB.prepare("SELECT 1 FROM blocks WHERE uid = ? AND blocked_uid = ?").bind(uid, karsi).first();
  return !!satir;
}
