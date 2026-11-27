/* Kelime Serüveni: kısımlar, seviyeler, ilerleme (yalnızca bu telefonda) ve seviye oyunu.
   Seviyeler Çetrefilli oyun ekranında oynanır; hedef kelimeler js/seruven-kelimeler.js içinde. */

/* Harf Avı, Bomba Taşları, Yayılan Taş: işaretli taşlar yalnızca 5 harf ve üstü kelimelerde kullanılabilir.
   İşaretler tahtadaki harflere konur, harfler değişmez. Her kısımda 5 seviyede bir yeni kural gelir.
   Ortak ayarlar: sure (saniye), hak (en fazla kaç kelime; 0 = sınırsız) */

/* Harf Avı: hedef = tahtadaki işaretli taş sayısı, toplam = avlanacak toplam (avlandıkça yenisi gelir),
   can = işaretli taşın canı, kacar = avlar kaç saniyede bir başka taşa kaçar (0 = kaçmaz) */
function seruvenAv(a){ return Object.assign({hedef:1,toplam:0,can:1,kacar:0,hak:0,sure:120},a); }
const SERUVEN_AV_SEVIYELERI=[
// 1-5: temel
seruvenAv({hedef:1,can:2,sure:60}),seruvenAv({hedef:2,can:2,sure:60}),seruvenAv({hedef:1,can:3,sure:55}),seruvenAv({hedef:2,can:3,sure:55}),seruvenAv({hedef:2,can:3,sure:45}),
// 6-10: avlandıkça yenisi gelir
seruvenAv({hedef:1,toplam:3,can:2,sure:80}),seruvenAv({hedef:2,toplam:5,can:2,sure:80}),seruvenAv({hedef:2,toplam:6,can:2,sure:75}),seruvenAv({hedef:2,toplam:6,can:2,sure:65}),seruvenAv({hedef:3,toplam:8,can:2,sure:70}),
// 11-15: avlar kaçar
seruvenAv({hedef:2,toplam:5,can:2,kacar:8,sure:80}),seruvenAv({hedef:2,can:3,kacar:8,sure:50}),seruvenAv({hedef:2,can:3,kacar:6,sure:45}),seruvenAv({hedef:2,toplam:6,can:3,kacar:6,sure:90}),seruvenAv({hedef:2,toplam:6,can:3,kacar:6,sure:80}),
// 16-20: kelime hakkı
seruvenAv({hedef:2,toplam:6,can:2,hak:6,kacar:8,sure:65}),seruvenAv({hedef:2,toplam:5,can:2,hak:4,sure:60}),seruvenAv({hedef:2,can:3,hak:4,kacar:8,sure:45}),seruvenAv({hedef:3,toplam:8,can:2,hak:7,kacar:6,sure:65}),seruvenAv({hedef:2,toplam:6,can:3,hak:7,kacar:6,sure:70})
];

/* Bomba Taşları: bomba = başlangıçtaki bomba sayısı, sayac = patlamaya kalan kelime (saniyeli ise saniye),
   saniyeli = sayaç zamanla azalır, yeni = kaç saniyede bir yeni bomba gelir (0 = gelmez), toplam = çözülecek toplam bomba */
function seruvenBomba(a){ return Object.assign({bomba:1,sayac:4,saniyeli:false,yeni:0,toplam:0,hak:0,sure:120},a); }
const SERUVEN_BOMBA_SEVIYELERI=[
// 1-5: kelimeyle azalan sayaç, yeni bombalar gelir
seruvenBomba({bomba:1,sayac:3,yeni:12,toplam:3,sure:90}),seruvenBomba({bomba:1,sayac:3,yeni:12,toplam:4,sure:90}),seruvenBomba({bomba:2,sayac:3,yeni:10,toplam:6,sure:90}),seruvenBomba({bomba:2,sayac:2,yeni:10,toplam:6,sure:90}),seruvenBomba({bomba:2,sayac:2,yeni:8,toplam:8,sure:90}),
// 6-10: saniyeyle azalan sayaç
seruvenBomba({bomba:1,sayac:25,saniyeli:true,yeni:12,toplam:4,sure:90}),seruvenBomba({bomba:2,sayac:25,saniyeli:true,yeni:10,toplam:6,sure:90}),seruvenBomba({bomba:2,sayac:20,saniyeli:true,yeni:10,toplam:6,sure:90}),seruvenBomba({bomba:2,sayac:18,saniyeli:true,yeni:8,toplam:8,sure:90}),seruvenBomba({bomba:2,sayac:15,saniyeli:true,yeni:8,toplam:8,sure:90}),
// 11-15: bomba bir sonraki kelimede çözülmeli
seruvenBomba({bomba:1,sayac:1,yeni:12,toplam:4,sure:90}),seruvenBomba({bomba:2,sayac:1,yeni:12,toplam:5,sure:90}),seruvenBomba({bomba:2,sayac:1,yeni:10,toplam:6,sure:90}),seruvenBomba({bomba:3,sayac:1,yeni:12,toplam:6,sure:90}),seruvenBomba({bomba:3,sayac:1,yeni:10,toplam:8,sure:90}),
// 16-20: saniyeli ve kelime hakkı
seruvenBomba({bomba:2,sayac:20,saniyeli:true,yeni:10,toplam:6,hak:6,sure:90}),seruvenBomba({bomba:2,sayac:18,saniyeli:true,yeni:8,toplam:8,hak:8,sure:90}),seruvenBomba({bomba:2,sayac:15,saniyeli:true,yeni:8,toplam:8,hak:8,sure:90}),seruvenBomba({bomba:3,sayac:15,saniyeli:true,yeni:8,toplam:9,hak:9,sure:90}),seruvenBomba({bomba:3,sayac:12,saniyeli:true,yeni:7,toplam:10,hak:10,sure:90})
];

/* Yayılan Taş: gri = başlangıçtaki gri taş sayısı, aralik = kaç kelimede bir yayılır (0 = kelimeyle yayılmaz),
   saniye = kaç saniyede bir yayılır (0 = zamanla yayılmaz), adet = her yayılışta kaç taş,
   kilit = gri taş kullanılamaz, yanındaki taşı kullanan 5+ harfli kelime temizler,
   toplam = kaç gri taş temizlenince seviye biter (0 = tahtada gri kalmayınca) */
function seruvenYayilan(a){ return Object.assign({gri:1,aralik:0,saniye:0,adet:1,kilit:false,toplam:0,hak:0,sure:120},a); }
const SERUVEN_YAYILAN_SEVIYELERI=[
// 1-5: kelimeyle yayılır
seruvenYayilan({gri:2,aralik:2,toplam:4,sure:60}),seruvenYayilan({gri:2,aralik:1,toplam:6,sure:70}),seruvenYayilan({gri:3,aralik:1,toplam:8,sure:80}),seruvenYayilan({gri:3,aralik:1,adet:2,toplam:10,sure:65}),seruvenYayilan({gri:3,aralik:1,adet:2,toplam:12,sure:80}),
// 6-10: zamanla yayılır
seruvenYayilan({gri:2,saniye:8,toplam:8,sure:70}),seruvenYayilan({gri:3,saniye:6,toplam:10,sure:60}),seruvenYayilan({gri:3,saniye:5,toplam:12,sure:55}),seruvenYayilan({gri:4,saniye:5,toplam:16,sure:70}),seruvenYayilan({gri:4,saniye:4,toplam:14,sure:65}),
// 11-15: gri taşlar kilitli
seruvenYayilan({gri:1,aralik:2,kilit:true,toplam:3,sure:90}),seruvenYayilan({gri:1,aralik:1,kilit:true,toplam:4,sure:90}),seruvenYayilan({gri:2,aralik:2,kilit:true,toplam:5,sure:90}),seruvenYayilan({gri:2,aralik:1,kilit:true,toplam:6,sure:90}),seruvenYayilan({gri:2,aralik:1,kilit:true,toplam:8,sure:90}),
// 16-20: kilitli, zamanla yayılır, kelime hakkı
seruvenYayilan({gri:1,saniye:12,kilit:true,toplam:4,sure:90}),seruvenYayilan({gri:1,saniye:10,kilit:true,toplam:5,hak:8,sure:90}),seruvenYayilan({gri:2,saniye:12,kilit:true,toplam:6,hak:8,sure:90}),seruvenYayilan({gri:2,saniye:10,kilit:true,toplam:6,hak:8,sure:90}),seruvenYayilan({gri:2,saniye:8,kilit:true,toplam:8,hak:10,sure:90})
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

seruvenOyunu={kisim:k,seviye:s,tur:kisim.tur,ayar:ayar,hedefler:hedefler,bulunan:new Set(),toplam:0,tamam:0,kelimeSayaci:0,kelimeSayisi:0,gecen:0,kullanilan:[],olay:[]};

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

if(o.tur==="av"){
let n=0;
for(let i=0;i<a.hedef;i++){ if(seruvenAvKoy())n++; }
o.toplam=Math.max(a.toplam,n);
}
else if(o.tur==="bomba"){
let n=0;
for(let i=0;i<a.bomba;i++){ if(seruvenBombaKoy())n++; }
o.toplam=Math.max(a.toplam,n);
}
else if(o.tur==="yayilan"){
shuffleArray(seruvenBosYerler()).slice(0,a.gri).forEach(function(i){ wordTiles[i].gri=true; });
}

}

/* İşaretsiz, joker olmayan taşların yerleri */
function seruvenBosYerler(){
return wordTiles.map(function(t,i){ return i; }).filter(function(i){
let t=wordTiles[i];
return t.letter!=='★' && t.letter!==null && !seruvenIsaretli(t);
});
}

/* Yeni av: başka bir avla aynı harfte olmayan rastgele boş taşa (can: seviyedeki can; haric: kaçan avın eski taşı) */
function seruvenAvKoy(can,haric){
let avHarfleri=wordTiles.filter(function(t){ return t.av; }).map(function(t){ return t.letter; });
let yerler=seruvenBosYerler().filter(function(i){ return wordTiles[i]!==haric && !avHarfleri.includes(wordTiles[i].letter); });
if(!yerler.length)return false;
let t=wordTiles[yerler[Math.floor(Math.random()*yerler.length)]];
t.av=true;
t.life=can || seruvenOyunu.ayar.can;
return true;
}

function seruvenBombaKoy(){
let yerler=seruvenBosYerler();
if(!yerler.length)return false;
wordTiles[yerler[Math.floor(Math.random()*yerler.length)]].bomba=seruvenOyunu.ayar.sayac;
return true;
}

function seruvenTahtadaki(f){
return wordTiles.filter(f).length;
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
if(seruvenOyunu && seruvenOyunu.tur==="bomba" && typeof t.bomba==="number")return "<span class=\"bomba-sayac\">"+(seruvenOyunu.ayar.saniyeli ? "⏱️" : "💣")+t.bomba+"</span>";
return "";
}

/* Saniyede bir değişen taşlar ekranı yeniden çizmeden güncellenir (sürükleme bozulmasın) */
function seruvenTaslariGuncelle(){
wordTiles.forEach(function(t){
let el=document.querySelector('#wordCards .card[data-id="'+t.id+'"]');
if(!el)return;
el.classList.remove("hedef-harf","av-tasi","bomba-tasi","gri-tas");
let sinif=seruvenTasSinifi(t).trim();
if(sinif)el.classList.add(sinif);
let can=el.querySelector(".tile-life");
if(can)can.innerHTML=t.life;
let eski=el.querySelector(".bomba-sayac");
if(eski)eski.remove();
let ek=seruvenTasEki(t);
if(ek)el.insertAdjacentHTML("beforeend",ek);
});
}

/* Seviyenin kuralı tek cümleyle (seviye başında görünür) */
function seruvenKuralMetni(){
let o=seruvenOyunu;
let a=o.ayar;
let m;
if(o.tur==="hedef")m="Hedef kelimeleri yaz!";
else if(o.tur==="av")m="Kırmızı taşları 5+ harfli kelimelerde kullanıp avla!"+(o.toplam>a.hedef ? " Avlandıkça yenisi gelir." : "")+(a.kacar ? " Avlar "+a.kacar+" saniyede bir kaçar!" : "");
else if(o.tur==="bomba")m=(a.saniyeli ? "Bombalar saniyeyle patlıyor!" : "Her kelimede bomba sayacı azalır!")+" 5+ harfli kelimede kullanıp çöz."+(a.yeni ? " Yeni bombalar gelecek!" : "");
else m=(a.kilit ? "Gri taşlar kilitli: yanındaki taşı 5+ harfli kelimede kullanarak temizle!" : "Gri taşları 5+ harfli kelimelerde kullanıp temizle!")+(a.saniye ? " "+a.saniye+" saniyede bir yayılır." : " "+a.aralik+" kelimede bir yayılır.")+(a.toplam ? " "+a.toplam+" gri taş temizle." : "");
if(a.hak)m+=" Kelime hakkın: "+a.hak+".";
return m;
}

function seruvenIsaretli(t){
return !!(t.av || typeof t.bomba==="number" || t.gri);
}

function seruvenGriSayisi(){
return wordTiles.filter(function(t){ return t.gri; }).length;
}

function seruvenGorevCiz(){

let o=seruvenOyunu;
if(!o)return;
let a=o.ayar;

function satir(m){ return "<div class=\"seruven-hedef\">"+m+"</div>"; }
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
liste=wordTiles.filter(function(t){ return t.av; }).map(function(t){ return satir(t.letter+" ×"+t.life); }).join("");
let sirada=o.toplam-o.tamam-seruvenTahtadaki(function(t){ return t.av; });
if(sirada>0)liste+=satir("Sırada "+sirada+" av");
etiket="AVLANAN";
deger=o.tamam+"/"+o.toplam;
oran=o.toplam ? o.tamam/o.toplam : 1;
}
else if(o.tur==="bomba"){
baslik="BOMBALAR";
liste=wordTiles.filter(function(t){ return typeof t.bomba==="number"; }).map(function(t){ return satir(t.letter+(a.saniyeli ? " ⏱️" : " 💣")+t.bomba); }).join("");
let sirada=o.toplam-o.tamam-seruvenTahtadaki(function(t){ return typeof t.bomba==="number"; });
if(sirada>0)liste+=satir("Sırada "+sirada+" bomba");
etiket="ÇÖZÜLEN";
deger=o.tamam+"/"+o.toplam;
oran=o.toplam ? o.tamam/o.toplam : 1;
}
else{
let gri=seruvenGriSayisi();
baslik="GRİ TAŞLAR";
liste=satir(a.saniye ? (a.saniye-o.gecen%a.saniye)+" sn sonra yayılır" : (a.aralik-o.kelimeSayaci)+" kelime sonra yayılır");
if(a.kilit)liste+=satir("Kilitli: yanındaki taşı kullan");
if(a.toplam){
etiket="TEMİZLENEN";
deger=Math.min(o.tamam,a.toplam)+"/"+a.toplam;
oran=Math.min(1,o.tamam/a.toplam);
}
else{
etiket="GRİ TAŞ";
deger=gri;
oran=gri/7;
}
}

if(a.hak)liste+=satir("Kalan kelime: "+Math.max(0,a.hak-o.kelimeSayisi));

document.getElementById("seruvenGorevBaslik").innerHTML=baslik;
document.getElementById("seruvenHedefler").innerHTML=liste;
document.getElementById("wordTargetLabel").innerHTML=etiket;
document.getElementById("wordTarget").innerHTML=deger;
document.getElementById("wordTargetBar").style.width=Math.round(oran*100)+"%";

}

/* Yayılan Taş, kilitli: gri taş bir kelimede kullanılamaz */
function seruvenGriKilitli(t){
return !!(seruvenOyunu && seruvenOyunu.tur==="yayilan" && seruvenOyunu.ayar.kilit && t.gri);
}


/* ---------- Kelime yazılınca ---------- */

/* Harfler değişmeden önce: avlanan, çözülen bomba ve temizlenen gri taşlar belirlenir */
function seruvenKelimeOncesi(yerler,kelime){
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
o.tamam++;
o.olay.push("✨ Gri taş temizlendi!");
}
});
// Kilitli gri: kelimede kullanılan taşın yanındaki (sağ, sol, üst, alt) gri taşlar temizlenir
if(o.tur==="yayilan" && o.ayar.kilit && kelime.length>=5){
let temizlenen=0;
yerler.forEach(function(i){
seruvenKomsular(i).forEach(function(n){
if(wordTiles[n].gri){ wordTiles[n].gri=false; temizlenen++; o.tamam++; }
});
});
if(temizlenen)o.olay.push("✨ "+temizlenen+" gri taş temizlendi!");
}
}

function seruvenKomsular(i){
let SUTUN=4;
let l=[];
if(i-SUTUN>=0)l.push(i-SUTUN);
if(i+SUTUN<wordTiles.length)l.push(i+SUTUN);
if(i%SUTUN>0)l.push(i-1);
if(i%SUTUN<SUTUN-1 && i+1<wordTiles.length)l.push(i+1);
return l;
}

/* Geçerli kelimeden sonra (harfler değişti): görev ilerler, seviye biter ya da kaybedilir */
function seruvenKelime(kelime){

let o=seruvenOyunu;
if(!o || resultRecorded)return;
let a=o.ayar;
o.kelimeSayisi++;
let mesaj=o.olay.length ? o.olay.join(" ") : kelime+" geçerli, harfler yenilendi.";
let bitti=false;

if(o.tur==="hedef"){
if(o.hedefler.includes(kelime) && !o.bulunan.has(kelime)){
o.bulunan.add(kelime);
mesaj="🎯 "+kelime+" bulundu!";
}
if(o.bulunan.size===o.hedefler.length){ seruvenGorevCiz(); seruvenBitti(true); bitti=true; }
}
else if(o.tur==="av"){
// Avlandıkça yenisi gelir (toplam dolana kadar)
while(o.tamam+seruvenTahtadaki(function(t){ return t.av; })<o.toplam && seruvenAvKoy()){}
if(o.tamam>=o.toplam){ seruvenGorevCiz(); seruvenBitti(true); bitti=true; }
}
else if(o.tur==="bomba"){
let patladi=false;
if(!a.saniyeli){
wordTiles.forEach(function(t){
if(typeof t.bomba==="number" && !o.kullanilan.includes(t)){
t.bomba--;
if(t.bomba<=0)patladi=true;
}
});
}
if(patladi){ seruvenGorevCiz(); seruvenBitti(false,"Bomba patladı 💥"); bitti=true; }
else if(o.tamam>=o.toplam){ seruvenGorevCiz(); seruvenBitti(true); bitti=true; }
}
else if(o.tur==="yayilan"){
if(a.toplam ? o.tamam>=a.toplam : seruvenGriSayisi()===0){ seruvenGorevCiz(); seruvenBitti(true); bitti=true; }
else if(a.aralik){
o.kelimeSayaci++;
if(o.kelimeSayaci>=a.aralik){
o.kelimeSayaci=0;
let yayildi=false;
for(let n=0;n<a.adet;n++){ if(seruvenYay())yayildi=true; }
if(yayildi)mesaj+=" ⚠️ Gri taş yayıldı!";
}
if(seruvenHepsiGri()){ seruvenGorevCiz(); seruvenBitti(false,"Bütün taşlar griye döndü"); bitti=true; }
}
}

if(bitti)return;

document.getElementById("wordMessage").innerHTML=mesaj;
seruvenGorevCiz();

if(a.hak && o.kelimeSayisi>=a.hak)seruvenBitti(false,"Kelime hakkın bitti");

}

/* Saniyede bir: kaçan avlar, saniyeli bombalar, yeni bombalar, zamanla yayılan gri taşlar */
function seruvenSaniye(){

let o=seruvenOyunu;
if(!o || resultRecorded || o.tur==="hedef")return;
let a=o.ayar;
let gecen=turSuresi-time;
let degisti=false;

while(o.gecen<gecen && !resultRecorded){

o.gecen++;

if(o.tur==="av" && a.kacar && o.gecen%a.kacar===0){
let avlar=wordTiles.filter(function(t){ return t.av; });
if(avlar.length){
let kacan=avlar[Math.floor(Math.random()*avlar.length)];
kacan.av=false;
if(!seruvenAvKoy(kacan.life,kacan))kacan.av=true;
degisti=true;
}
}

if(o.tur==="bomba"){
if(a.saniyeli){
let patladi=false;
wordTiles.forEach(function(t){
if(typeof t.bomba==="number"){
t.bomba--;
if(t.bomba<=0)patladi=true;
}
});
degisti=true;
if(patladi){ seruvenTaslariGuncelle(); seruvenGorevCiz(); seruvenBitti(false,"Bomba patladı 💥"); return; }
}
if(a.yeni && o.gecen%a.yeni===0 && o.tamam+seruvenTahtadaki(function(t){ return typeof t.bomba==="number"; })<o.toplam){
if(seruvenBombaKoy()){
degisti=true;
document.getElementById("wordMessage").innerHTML="💣 Yeni bomba geldi!";
}
}
}

if(o.tur==="yayilan"){
if(a.saniye && o.gecen%a.saniye===0){
for(let n=0;n<a.adet;n++)seruvenYay();
document.getElementById("wordMessage").innerHTML="⚠️ Gri taş yayıldı!";
if(seruvenHepsiGri()){ seruvenTaslariGuncelle(); seruvenGorevCiz(); seruvenBitti(false,"Bütün taşlar griye döndü"); return; }
}
degisti=true;   // geri sayım yazısı her saniye değişir
}

}

if(degisti){
seruvenTaslariGuncelle();
seruvenGorevCiz();
}

}

function seruvenHepsiGri(){
return seruvenGriSayisi()>=wordTiles.filter(function(t){ return t.letter!=='★'; }).length;
}

/* Grilik bir gri taşın yanındaki temiz taşa geçer; yanında temiz taş yoksa rastgele bir temiz taşa */
function seruvenYay(){
let temiz=function(i){ return wordTiles[i].letter!=='★' && !wordTiles[i].gri; };
let adaylar=[];
wordTiles.forEach(function(t,i){
if(!t.gri)return;
seruvenKomsular(i).forEach(function(n){ if(temiz(n) && !adaylar.includes(n))adaylar.push(n); });
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
