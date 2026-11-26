/* Kelime Serüveni: kısımlar, seviyeler, ilerleme (yalnızca bu telefonda) ve seviye oyunu.
   Seviyeler Çetrefilli oyun ekranında oynanır; hedef kelimeler js/seruven-kelimeler.js içinde. */

/* Bu üç kısımda yalnızca 5 harf ve üstü kelimeler geçerli. İşaretler tahtadaki harflere konur, harfler değişmez.
   Harf Avı: hedef = işaretli taş sayısı (her biri farklı harf), can = işaretli taşların canı */
function seruvenAv(hedef,can){ return {hedef:hedef,can:can,sure:120}; }
const SERUVEN_AV_SEVIYELERI=[
seruvenAv(1,1),seruvenAv(1,2),seruvenAv(2,1),seruvenAv(2,2),seruvenAv(3,1),
seruvenAv(1,3),seruvenAv(3,2),seruvenAv(2,3),seruvenAv(4,1),seruvenAv(4,2),
seruvenAv(3,3),seruvenAv(5,1),seruvenAv(5,2),seruvenAv(4,3),seruvenAv(6,1),
seruvenAv(6,2),seruvenAv(5,3),seruvenAv(7,1),seruvenAv(6,3),seruvenAv(7,2)
];

/* Bomba Taşları: bomba = bombalı taş sayısı, sayac = kaç kelimede patlar */
function seruvenBomba(bomba,sayac){ return {bomba:bomba,sayac:sayac,sure:120}; }
const SERUVEN_BOMBA_SEVIYELERI=[
seruvenBomba(1,4),seruvenBomba(1,3),seruvenBomba(2,4),seruvenBomba(2,3),seruvenBomba(1,2),
seruvenBomba(3,4),seruvenBomba(2,2),seruvenBomba(3,3),seruvenBomba(1,1),seruvenBomba(4,4),
seruvenBomba(3,2),seruvenBomba(4,3),seruvenBomba(2,1),seruvenBomba(5,4),seruvenBomba(4,2),
seruvenBomba(5,3),seruvenBomba(3,1),seruvenBomba(6,3),seruvenBomba(5,2),seruvenBomba(4,1)
];

/* Yayılan Taş: gri = başlangıçtaki gri taş sayısı, aralik = kaç kelimede bir yayılır, adet = her yayılışta kaç taş griye döner */
function seruvenYayilan(gri,aralik,adet){ return {gri:gri,aralik:aralik,adet:adet||1,sure:120}; }
const SERUVEN_YAYILAN_SEVIYELERI=[
seruvenYayilan(1,3),seruvenYayilan(2,3),seruvenYayilan(2,2),seruvenYayilan(3,3),seruvenYayilan(3,2),
seruvenYayilan(2,1),seruvenYayilan(4,3),seruvenYayilan(4,2),seruvenYayilan(3,1),seruvenYayilan(5,3),
seruvenYayilan(5,2),seruvenYayilan(4,1),seruvenYayilan(6,3),seruvenYayilan(6,2),seruvenYayilan(5,1),
seruvenYayilan(7,2),seruvenYayilan(6,1),seruvenYayilan(7,1),seruvenYayilan(6,1,2),seruvenYayilan(7,1,2)
];

const SERUVEN_KISIMLARI=[
{ad:"Hedef Kelimeler",tur:"hedef",ikon:"🎯",renk:"#4fa3f7,#1f6fd1",seviyeler:SERUVEN_HEDEF_KELIMELER},
{ad:"Harf Avı",tur:"av",ikon:"🔍",renk:"#5fd3a0,#1f9e6b",seviyeler:SERUVEN_AV_SEVIYELERI},
{ad:"Bomba Taşları",tur:"bomba",ikon:"💣",renk:"#ff9a6b,#e0532f",seviyeler:SERUVEN_BOMBA_SEVIYELERI},
{ad:"Yayılan Taş",tur:"yayilan",ikon:"🪨",renk:"#b28cf0,#7a4fd1",seviyeler:SERUVEN_YAYILAN_SEVIYELERI},
{ad:"Yakında",ikon:"✨",renk:"#c3cede,#94a3b8",seviyeler:null}
];
const SERUVEN_SEVIYE_SAYISI=20;
const SERUVEN_RASTGELE_SEVIYE=20;   // kısım bitince oynanan rastgele oyun (21. oyun)
const SERUVEN_RASTGELE_SURE=120;

let seruvenAcikKisim=0;


/* ---------- İlerleme: her kısım için 20 seviyenin yıldızı (0 = geçilmedi) ---------- */

function seruvenIlerleme(){
try{
let v=JSON.parse(localStorage.getItem("konfetiSeruven")||"{}");
return (v && typeof v==="object") ? v : {};
}catch(e){ return {}; }
}

function seruvenYildizlar(k){
let v=seruvenIlerleme()[k];
let l=[];
for(let i=0;i<SERUVEN_SEVIYE_SAYISI;i++)l.push((v && v[i]) || 0);
return l;
}

function seruvenKaydet(k,s,yildiz){
let v=seruvenIlerleme();
let l=seruvenYildizlar(k);
l[s]=Math.max(l[s],yildiz);
v[k]=l;
try{ localStorage.setItem("konfetiSeruven",JSON.stringify(v)); }catch(e){}
}

/* Sıradaki seviye: geçilmemiş ilk seviye (hepsi geçildiyse 20 = rastgele oyun) */
function seruvenSiradakiSeviye(k){
let i=seruvenYildizlar(k).indexOf(0);
return i===-1 ? SERUVEN_RASTGELE_SEVIYE : i;
}

function seruvenToplamGecilen(){
let n=0;
for(let k=0;k<SERUVEN_KISIMLARI.length;k++){
n+=seruvenYildizlar(k).filter(function(y){ return y>0; }).length;
}
return n;
}


/* ---------- Kelime Serüveni sayfası: kısım kartları ve toplam ilerleme ---------- */

function seruvenSayfasi(){
hideAllScreens();
seruvenKisimlariCiz();
document.getElementById("seruvenScreen").style.display="block";
}

function seruvenKisimlariCiz(){

let h="";

SERUVEN_KISIMLARI.forEach(function(kisim,k){

let hazir=!!kisim.seviyeler;
let gecilen=seruvenYildizlar(k).filter(function(y){ return y>0; }).length;
let bitti=gecilen===SERUVEN_SEVIYE_SAYISI;
let yuzde=Math.round(gecilen/SERUVEN_SEVIYE_SAYISI*100);

h+="<div class=\"seruven-kart"+(hazir ? "" : " yakinda")+"\""+(hazir ? " onclick=\"seruvenSeviyeleriGoster("+k+")\"" : "")+">";
h+="<div class=\"seruven-kart-ikon\" style=\"background:linear-gradient(135deg,"+kisim.renk+");\">"+kisim.ikon+"</div>";
h+="<div class=\"seruven-kart-govde\"><div class=\"seruven-kart-ad\">"+kisim.ad+(bitti ? " <i class=\"fa-solid fa-check seruven-tik\"></i>" : "")+"</div>";
if(hazir){
h+="<div class=\"seruven-kart-ilerleme\"><div class=\"seruven-bar\"><div class=\"seruven-bar-dolu\" style=\"width:"+yuzde+"%;\"></div></div><span>"+gecilen+" / "+SERUVEN_SEVIYE_SAYISI+"</span></div>";
}
h+="</div>";

if(hazir){
h+="<button class=\"seruven-oynat\" onclick=\"event.stopPropagation();seruvenOyna("+k+","+seruvenSiradakiSeviye(k)+")\"><i class=\"fa-solid fa-play\"></i></button>";
}
else if(kisim.ad!=="Yakında"){
h+="<div class=\"seruven-yakinda\">Yakında</div>";
}

h+="</div>";

});

document.getElementById("seruvenKisimlar").innerHTML=h;

// Toplam ilerleme ve madalya: 1-49 bronz, 50-79 gümüş, 80-100 altın
let toplam=seruvenToplamGecilen();
let enCok=SERUVEN_KISIMLARI.length*SERUVEN_SEVIYE_SAYISI;
let madalya=null;
if(toplam>=80)madalya=["🥇","Altın"];
else if(toplam>=50)madalya=["🥈","Gümüş"];
else if(toplam>=1)madalya=["🥉","Bronz"];

document.getElementById("seruvenOzet").innerHTML="<div class=\"seruven-ozet\"><div class=\"seruven-ozet-yildiz\">⭐</div>"
+"<div class=\"seruven-ozet-govde\"><b>Toplam İlerleme</b><div class=\"seruven-kart-ilerleme\"><div class=\"seruven-bar\"><div class=\"seruven-bar-dolu\" style=\"width:"+Math.round(toplam/enCok*100)+"%;\"></div></div><span>"+toplam+" / "+enCok+"</span></div></div>"
+(madalya ? "<div class=\"seruven-madalya\"><span>"+madalya[0]+"</span><small>"+madalya[1]+"</small></div>" : "")+"</div>";

}


/* ---------- Seviyeler sayfası: 20 seviye; geçilenler ve sıradaki açık ---------- */

function seruvenSeviyeleriGoster(k){
seruvenAcikKisim=k;
hideAllScreens();
seruvenSeviyeleriCiz();
document.getElementById("seruvenSeviyeScreen").style.display="block";
}

function seruvenSeviyeleriCiz(){

let k=seruvenAcikKisim;
let yildizlar=seruvenYildizlar(k);
let siradaki=seruvenSiradakiSeviye(k);

document.getElementById("seruvenSeviyeBaslik").innerHTML=SERUVEN_KISIMLARI[k].ad;

let h="<div class=\"seruven-seviyeler\">";
for(let s=0;s<SERUVEN_SEVIYE_SAYISI;s++){
let acik=s<=siradaki;
let y=yildizlar[s];
h+="<button class=\"seruven-seviye"+(acik ? "" : " kilitli")+(y ? " gecildi" : "")+"\""+(acik ? " onclick=\"seruvenOyna("+k+","+s+")\"" : " disabled")+">";
h+="<b>"+(s+1)+"</b><span>"+(y ? "★".repeat(y)+"☆".repeat(3-y) : "")+"</span></button>";
}
h+="</div>";

if(siradaki===SERUVEN_RASTGELE_SEVIYE){
h+="<button class=\"menu-card full-card new\" style=\"margin-top:1em;\" onclick=\"seruvenOyna("+k+","+SERUVEN_RASTGELE_SEVIYE+")\"><div class=\"icon-circle\">🎲</div><div class=\"menu-copy\"><b>Rastgele Oyun</b><span>"+(SERUVEN_KISIMLARI[k].tur==="hedef" ? "Rastgele 2 kelime" : "Rastgele bir seviye")+"</span></div><div class=\"arrow\">›</div></button>";
}

h+="<button class=\"menu-card full-card white\" style=\"margin-top:1em;\" onclick=\"seruvenSifirlaSor("+k+")\"><div class=\"icon-circle\">🔄</div><div class=\"menu-copy\"><b>Sıfırla</b><span>Bu kısmın ilerlemesini sil</span></div><div class=\"arrow\">›</div></button>";

document.getElementById("seruvenSeviyeler").innerHTML=h;

}

function seruvenSifirlaSor(k){
openDetailModal("<p class=\"screen-title\">"+SERUVEN_KISIMLARI[k].ad+" ilerlemesi silinsin mi?</p>"
+"<button class=\"menu-card full-card red\" style=\"margin-top:1em;\" onclick=\"seruvenSifirla("+k+")\"><div class=\"menu-copy\"><b>Evet, sıfırla</b></div></button>"
+"<button class=\"menu-card full-card white\" style=\"margin-top:0.8em;\" onclick=\"closeDetailModal()\"><div class=\"menu-copy\"><b>Vazgeç</b></div></button>");
}

function seruvenSifirla(k){
let v=seruvenIlerleme();
delete v[k];
try{ localStorage.setItem("konfetiSeruven",JSON.stringify(v)); }catch(e){}
closeDetailModal();
seruvenKisimlariCiz();
seruvenSeviyeleriCiz();
}


/* ---------- Seviye oyunu ---------- */

function seruvenOyna(k,s){

let kisim=SERUVEN_KISIMLARI[k];
let ayar;
let hedefler=[];
if(s===SERUVEN_RASTGELE_SEVIYE){
// Kısım bitince: Hedef Kelimeler'de rastgele 2 kelime, diğerlerinde rastgele bir seviye
if(kisim.tur==="hedef"){
hedefler=SERUVEN_RASTGELE[Math.floor(Math.random()*SERUVEN_RASTGELE.length)].slice();
ayar={sure:SERUVEN_RASTGELE_SURE};
}
else ayar=kisim.seviyeler[Math.floor(Math.random()*kisim.seviyeler.length)];
}
else{
ayar=kisim.seviyeler[s];
if(kisim.tur==="hedef")hedefler=ayar.havuz[Math.floor(Math.random()*ayar.havuz.length)].slice();
}

seruvenAcikKisim=k;
activeChallengeId=null;
activeChallengeSide=null;
activeChallengeGameIndex=null;

// Oyun ekranındayken (Tekrar / Sonraki seviye) sayfa değişmez
let playAreaEl=document.getElementById("playArea");
if(playAreaEl.style.display!=="block"){
hideAllScreens();
playAreaEl.style.display="block";
}

seruvenOyunu={kisim:k,seviye:s,tur:kisim.tur,ayar:ayar,hedefler:hedefler,bulunan:new Set(),toplam:0,tamam:0,kelimeSayaci:0,kullanilan:[],olay:[]};

newGame({seruven:true,sure:ayar.sure});

}

/* Açılış harfleri (Hedef Kelimeler'de hedeflerden hiçbiri hemen yazılamasın, gerisi rastgele) */
function seruvenTahtasi(){
let o=seruvenOyunu;
let d;
let deneme=0;
do{
d=generateWordGameData();
deneme++;
} while(o.tur==="hedef" && deneme<50 && o.hedefler.some(function(w){ return window.KonfetiOyun.kurulabilir(w,d.baseLetters,1); }));
return d;
}

/* Taşlar dağıtılmadan önce işaretler konur: avlanacak taşlar (farklı harfler), bombalar ya da gri taşlar.
   Harfler değişmez, işaret rastgele taşlara gelir. */
function seruvenTahtaHazirla(){

let o=seruvenOyunu;
let a=o.ayar;
let yerler=shuffleArray(wordTiles.map(function(t,i){ return i; }).filter(function(i){ return wordTiles[i].letter!=='★'; }));

if(o.tur==="av"){
let harfler=[];
let secilen=yerler.filter(function(i){
let h=wordTiles[i].letter;
if(harfler.includes(h))return false;
harfler.push(h);
return true;
}).slice(0,a.hedef);
secilen.forEach(function(i){
wordTiles[i].av=true;
wordTiles[i].life=a.can;
});
o.toplam=secilen.length;
}
else if(o.tur==="bomba"){
let secilen=yerler.slice(0,a.bomba);
secilen.forEach(function(i){ wordTiles[i].bomba=a.sayac; });
o.toplam=secilen.length;
}
else if(o.tur==="yayilan"){
yerler.slice(0,a.gri).forEach(function(i){ wordTiles[i].gri=true; });
}

}

/* Oyun ekranından çıkılınca seviye bırakılır */
function seruvenBirak(){
clearInterval(timer);
gameActive=false;
resultRecorded=true;
seruvenOyunu=null;
}


/* ---------- Görev bilgisi ve taş görünümü ---------- */

/* Harf, henüz bulunmamış bir hedef kelimede geçiyor mu (taş turuncu görünür) */
function seruvenHedefHarfi(harf){
let o=seruvenOyunu;
return !!o && o.hedefler.some(function(w){ return !o.bulunan.has(w) && w.includes(harf); });
}

function seruvenTasSinifi(t){
let o=seruvenOyunu;
if(!o || t.letter==='★')return "";
if(o.tur==="hedef")return seruvenHedefHarfi(t.letter) ? " hedef-harf" : "";
if(o.tur==="av")return t.av ? " av-tasi" : "";
if(o.tur==="bomba")return typeof t.bomba==="number" ? " bomba-tasi" : "";
if(o.tur==="yayilan")return t.gri ? " gri-tas" : "";
return "";
}

function seruvenTasEki(t){
if(seruvenOyunu && seruvenOyunu.tur==="bomba" && typeof t.bomba==="number")return "<span class=\"bomba-sayac\">💣"+t.bomba+"</span>";
return "";
}

function seruvenGriSayisi(){
return wordTiles.filter(function(t){ return t.gri; }).length;
}

function seruvenGorevCiz(){

let o=seruvenOyunu;
if(!o)return;

let baslik, liste, etiket, deger, oran;

if(o.tur==="hedef"){
baslik="HEDEF KELİMELER";
liste=o.hedefler.map(function(w){
let bulundu=o.bulunan.has(w);
return "<div class=\"seruven-hedef"+(bulundu ? " bulundu" : "")+"\">"+(bulundu ? "✓ " : "")+w+"</div>";
}).join("");
etiket="BULUNAN";
deger=o.bulunan.size+"/"+o.hedefler.length;
oran=o.bulunan.size/o.hedefler.length;
}
else if(o.tur==="av"){
baslik="AVLANACAK HARFLER";
liste=wordTiles.filter(function(t){ return t.av; }).map(function(t){ return "<div class=\"seruven-hedef\">"+t.letter+" ×"+t.life+"</div>"; }).join("");
etiket="AVLANAN";
deger=o.tamam+"/"+o.toplam;
oran=o.toplam ? o.tamam/o.toplam : 1;
}
else if(o.tur==="bomba"){
baslik="BOMBALAR";
liste=wordTiles.filter(function(t){ return typeof t.bomba==="number"; }).map(function(t){ return "<div class=\"seruven-hedef\">"+t.letter+" 💣"+t.bomba+"</div>"; }).join("");
etiket="ÇÖZÜLEN";
deger=o.tamam+"/"+o.toplam;
oran=o.toplam ? o.tamam/o.toplam : 1;
}
else{
let gri=seruvenGriSayisi();
let kalan=o.ayar.aralik-o.kelimeSayaci;
baslik="GRİ TAŞLAR";
liste="<div class=\"seruven-hedef\">"+kalan+" kelime sonra yayılır</div>";
etiket="GRİ TAŞ";
deger=gri;
oran=gri/7;
}

document.getElementById("seruvenGorevBaslik").innerHTML=baslik;
document.getElementById("seruvenHedefler").innerHTML=liste;
document.getElementById("wordTargetLabel").innerHTML=etiket;
document.getElementById("wordTarget").innerHTML=deger;
document.getElementById("wordTargetBar").style.width=Math.round(oran*100)+"%";

}


/* ---------- Kelime yazılınca ---------- */

/* Harfler değişmeden önce: kullanılan işaretli taşlar (avlanan, çözülen bomba, temizlenen gri) belirlenir */
function seruvenKelimeOncesi(yerler){
let o=seruvenOyunu;
if(!o)return;
o.kullanilan=yerler.map(function(i){ return wordTiles[i]; });
o.olay=[];
o.kullanilan.forEach(function(t){
if(t.av && t.life<=1){
t.av=false;
o.tamam++;
o.olay.push("🎯 "+t.letter+" avlandı!");
}
if(typeof t.bomba==="number"){
t.bomba=null;
o.tamam++;
o.olay.push("✂️ Bomba çözüldü!");
}
if(t.gri){
t.gri=false;
o.olay.push("✨ Gri taş temizlendi!");
}
});
}

/* Geçerli kelimeden sonra (harfler değişti): görev ilerler, seviye biter ya da kaybedilir */
function seruvenKelime(kelime){

let o=seruvenOyunu;
if(!o || resultRecorded)return;
let mesaj=o.olay.length ? o.olay.join(" ") : kelime+" geçerli, harfler yenilendi.";

if(o.tur==="hedef"){
if(o.hedefler.includes(kelime) && !o.bulunan.has(kelime)){
o.bulunan.add(kelime);
mesaj="🎯 "+kelime+" bulundu!";
}
document.getElementById("wordMessage").innerHTML=mesaj;
seruvenGorevCiz();
if(o.bulunan.size===o.hedefler.length)seruvenBitti(true);
return;
}

if(o.tur==="bomba"){
// Kullanılmayan bombaların sayacı bir azalır
let patladi=false;
wordTiles.forEach(function(t){
if(typeof t.bomba==="number" && !o.kullanilan.includes(t)){
t.bomba--;
if(t.bomba<=0)patladi=true;
}
});
document.getElementById("wordMessage").innerHTML=mesaj;
seruvenGorevCiz();
if(patladi)seruvenBitti(false,"Bomba patladı 💥");
else if(o.tamam>=o.toplam)seruvenBitti(true);
return;
}

if(o.tur==="yayilan"){
if(seruvenGriSayisi()===0){
document.getElementById("wordMessage").innerHTML=mesaj;
seruvenGorevCiz();
seruvenBitti(true);
return;
}
o.kelimeSayaci++;
if(o.kelimeSayaci>=o.ayar.aralik){
o.kelimeSayaci=0;
let yayildi=false;
for(let n=0;n<o.ayar.adet;n++){ if(seruvenYay())yayildi=true; }
if(yayildi)mesaj+=" ⚠️ Gri taş yayıldı!";
}
document.getElementById("wordMessage").innerHTML=mesaj;
seruvenGorevCiz();
if(seruvenGriSayisi()>=wordTiles.filter(function(t){ return t.letter!=='★'; }).length)seruvenBitti(false,"Bütün taşlar griye döndü");
return;
}

// Harf Avı
document.getElementById("wordMessage").innerHTML=mesaj;
seruvenGorevCiz();
if(o.tamam>=o.toplam)seruvenBitti(true);

}

/* Grilik bir gri taşın yanındaki (sağ, sol, üst, alt) temiz taşa geçer; yanında temiz taş yoksa rastgele bir temiz taşa */
function seruvenYay(){
let SUTUN=4;
let temiz=function(i){ return i>=0 && i<wordTiles.length && wordTiles[i].letter!=='★' && !wordTiles[i].gri; };
let adaylar=[];
wordTiles.forEach(function(t,i){
if(!t.gri)return;
let komsular=[i-SUTUN,i+SUTUN];
if(i%SUTUN>0)komsular.push(i-1);
if(i%SUTUN<SUTUN-1)komsular.push(i+1);
komsular.forEach(function(n){ if(temiz(n) && !adaylar.includes(n))adaylar.push(n); });
});
if(!adaylar.length)adaylar=wordTiles.map(function(t,i){ return i; }).filter(temiz);
if(!adaylar.length)return false;
wordTiles[adaylar[Math.floor(Math.random()*adaylar.length)]].gri=true;
return true;
}


/* ---------- Seviye sonu ---------- */

function seruvenBitti(kazandi,sebep){

let o=seruvenOyunu;
if(!o)return;

clearInterval(timer);
gameActive=false;
resultRecorded=true;

let k=o.kisim;
let s=o.seviye;
let rastgele=s===SERUVEN_RASTGELE_SEVIYE;
let h;

if(kazandi){

// Yıldız: kalan süre yarıdan fazlaysa 3, dörtte birden fazlaysa 2, değilse 1
let oran=time/turSuresi;
let yildiz=oran>0.5 ? 3 : (oran>0.25 ? 2 : 1);

if(!rastgele){
seruvenKaydet(k,s,yildiz);
seruvenKisimlariCiz();
seruvenSeviyeleriCiz();
}

playWinSound();
launchMemConfetti("extra",false);

let sonraki=rastgele ? SERUVEN_RASTGELE_SEVIYE : seruvenSiradakiSeviye(k);

h="<p class=\"screen-title\">"+(rastgele ? "Tebrikler! 🎉" : (s+1)+". seviye geçildi! 🎉")+"</p>";
if(!rastgele)h+="<p class=\"seruven-sonuc-yildiz\">"+"★".repeat(yildiz)+"☆".repeat(3-yildiz)+"</p>";
h+="<button class=\"menu-card full-card new\" style=\"margin-top:1em;\" onclick=\"closeDetailModal();seruvenOyna("+k+","+sonraki+")\"><div class=\"icon-circle\">▶️</div><div class=\"menu-copy\"><b>"+(sonraki===SERUVEN_RASTGELE_SEVIYE ? "Rastgele Oyun" : (sonraki+1)+". Seviye")+"</b></div><div class=\"arrow\">›</div></button>";

}
else{

playErrorSound();

h="<p class=\"screen-title\">"+(sebep || "Süre bitti ⏱️")+"</p>";
if(o.tur==="hedef")h+="<p>"+o.bulunan.size+" / "+o.hedefler.length+" kelime bulundu.</p>";
h+="<button class=\"menu-card full-card new\" style=\"margin-top:1em;\" onclick=\"closeDetailModal();seruvenOyna("+k+","+s+")\"><div class=\"icon-circle\">🔁</div><div class=\"menu-copy\"><b>Tekrar</b></div><div class=\"arrow\">›</div></button>";

}

h+="<button class=\"menu-card full-card white\" style=\"margin-top:0.8em;\" onclick=\"seruvenSeviyelereDon("+k+")\"><div class=\"icon-circle\">🗺️</div><div class=\"menu-copy\"><b>Seviyeler</b></div><div class=\"arrow\">›</div></button>";

openDetailModal(h);

}

/* Sonuç penceresinden seviyeler sayfasına (oyun ekranı geçmişten çıkarılır, geri tuşu kısımlar sayfasına gider) */
function seruvenSeviyelereDon(k){
closeDetailModal();
seruvenAcikKisim=k;
if(screenNavStack.length && screenNavStack[screenNavStack.length-1].id==="seruvenSeviyeScreen")screenNavStack.pop();
suppressScreenPush=true;
hideAllScreens();
suppressScreenPush=false;
seruvenSeviyeleriCiz();
document.getElementById("seruvenSeviyeScreen").style.display="block";
}
