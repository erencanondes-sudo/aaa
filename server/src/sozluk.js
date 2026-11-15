/* Kelime listesi: uygulamadaki words.js dosyasının kendisi okunur, ayrı bir kopya tutulmaz.
   Liste yalnızca gerektiğinde (tur kontrolünde) belleğe alınır; diğer istekler bu yükü taşımaz. */

import metin from "../../words.js";

let kume = null;

export function sozluk() {
  if (!kume) kume = new Set(metin.slice(metin.indexOf("`") + 1, metin.lastIndexOf("`")).trim().split("\n"));
  return kume;
}
