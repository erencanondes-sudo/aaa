/* Kelime listesi: uygulamadaki words.js dosyasının kendisi okunur, ayrı bir kopya tutulmaz.
   Liste belleğe ayrıca hazırlanmaz (ücretsiz planın işlemci sınırını aşıyordu);
   kelime doğrudan metnin içinde aranır. */

import metin from "../../words.js";

const liste = metin.slice(metin.indexOf("`") + 1, metin.lastIndexOf("`"));

export const sozluk = {
  has: (kelime) => typeof kelime === "string" && kelime.length > 0 && !kelime.includes("\n") && liste.includes("\n" + kelime + "\n"),
};
