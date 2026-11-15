/* Kelime listesi: uygulamadaki words.js dosyasının kendisi okunur, ayrı bir kopya tutulmaz */

import metin from "../../words.js";

export const SOZLUK = new Set(metin.slice(metin.indexOf("`") + 1, metin.lastIndexOf("`")).trim().split("\n"));
