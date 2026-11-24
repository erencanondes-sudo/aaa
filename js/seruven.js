/* Kelime Serüveni: kısımlar, seviyeler, ilerleme (yalnızca bu telefonda) ve seviye oyunu.
   Seviyeler Çetrefilli oyun ekranında oynanır; hedef kelimeler js/seruven-kelimeler.js içinde. */

const SERUVEN_KISIMLARI=[
{ad:"Hedef Kelimeler",seviyeler:SERUVEN_HEDEF_KELIMELER},
{ad:"Harf Avı",seviyeler:null},
{ad:"Bomba Taşları",seviyeler:null},
{ad:"Yayılan Taş",seviyeler:null},
{ad:"Yakında",seviyeler:null}
];
const SERUVEN_SEVIYE_SAYISI=20;
const SERUVEN_RASTGELE_SEVIYE=20;   // kısım bitince oynanan rastgele oyun (21. oyun)
const SERUVEN_RASTGELE_SURE=120;

let seruvenAcikKisim=0;
let seruvenSirasi=null;


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
h+="<div class=\"seruven-kart-ad\">"+kisim.ad+(bitti ? " <i class=\"fa-solid fa-check seruven-tik\"></i>" : "")+"</div>";

if(hazir){
h+="<div class=\"seruven-kart-ilerleme\"><div class=\"bar-bg\"><div class=\"bar-fill-blue\" style=\"width:"+yuzde+"%;\"></div></div><span>"+gecilen+" / "+SERUVEN_SEVIYE_SAYISI+"</span></div>";
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
let madalya="";
if(toplam>=80)madalya="🥇 Altın";
else if(toplam>=50)madalya="🥈 Gümüş";
else if(toplam>=1)madalya="🥉 Bronz";

document.getElementById("seruvenOzet").innerHTML="<div class=\"seruven-ozet\"><div><b>Toplam İlerleme</b> "+toplam+" / "+enCok+"</div>"
+"<div class=\"bar-bg\"><div class=\"bar-fill-blue\" style=\"width:"+Math.round(toplam/enCok*100)+"%;\"></div></div>"
+(madalya ? "<div class=\"seruven-madalya\">"+madalya+"</div>" : "")+"</div>";

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
h+="<button class=\"menu-card full-card new\" style=\"margin-top:1em;\" onclick=\"seruvenOyna("+k+","+SERUVEN_RASTGELE_SEVIYE+")\"><div class=\"icon-circle\">🎲</div><div class=\"menu-copy\"><b>Rastgele Oyun</b><span>Rastgele 2 kelime</span></div><div class=\"arrow\">›</div></button>";
}

document.getElementById("seruvenSeviyeler").innerHTML=h;

}


/* ---------- Seviye oyunu ---------- */

function seruvenOyna(k,s){

let hedefler;
let sure;
if(s===SERUVEN_RASTGELE_SEVIYE){
hedefler=SERUVEN_RASTGELE[Math.floor(Math.random()*SERUVEN_RASTGELE.length)].slice();
sure=SERUVEN_RASTGELE_SURE;
}
else{
let sev=SERUVEN_KISIMLARI[k].seviyeler[s];
hedefler=sev.havuz[Math.floor(Math.random()*sev.havuz.length)].slice();
sure=sev.sure;
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

seruvenOyunu={kisim:k,seviye:s,hedefler:hedefler,bulunan:new Set()};
seruvenSirasi={sesli:[],sessiz:[],serbest:[]};

newGame({seruven:true,sure:sure});

}

/* Açılış tahtası: hedef kelimelerden hiçbiri hemen yazılamasın, gerisi rastgele */
function seruvenTahtasi(){
let d;
let deneme=0;
do{
d=generateWordGameData();
deneme++;
} while(deneme<50 && seruvenOyunu.hedefler.some(function(w){ return window.KonfetiOyun.kurulabilir(w,d.baseLetters,1); }));
return d;
}

/* Oyun ekranından çıkılınca seviye bırakılır */
function seruvenBirak(){
clearInterval(timer);
gameActive=false;
resultRecorded=true;
seruvenOyunu=null;
}


/* ---------- Harf sırası: sesli, sessiz ve serbest sıra (serbestte joker zarı da önceden atılır) ---------- */

function seruvenSiradakiTas(tur){
let l=seruvenSirasi[tur];
if(!l.length){
let harfler=Object.keys(LETTER_TABLE);
if(tur==="sesli")harfler=VOWELS;
else if(tur==="sessiz")harfler=harfler.filter(function(h){ return !VOWELS.includes(h); });
let harf=pickWeightedLetter(harfler);
l.push({harf:harf,can:randomLifeForLetter(harf),zar:letterRandom()});
}
return l[0];
}

function seruvenTasCoz(tas,tur,jokerVar){
if(tur==="serbest" && !jokerVar && tas.zar<0.15)return {harf:'★',can:9};
return {harf:tas.harf,can:tas.can};
}

function seruvenHarfAl(tur,jokerVar){
let tas=seruvenSiradakiTas(tur);
seruvenSirasi[tur].shift();
return seruvenTasCoz(tas,tur,jokerVar);
}

/* Sıradaki harfler: üstte bir sesli, altta bir sessiz harfin canı biterse gelecek harf
   (tahtadaki sesli/sessiz sayısına göre zorunlu sıradan ya da serbest sıradan) */
function seruvenSiradakiCiz(){
if(!seruvenOyunu)return;
let harfler=wordTiles.filter(function(t){ return t.letter!=='★'; }).map(function(t){ return t.letter; });
let sesli=harfler.filter(function(h){ return VOWELS.includes(h); }).length;
let sessiz=harfler.length-sesli;
let jokerVar=wordTiles.some(function(t){ return t.letter==='★'; });
function tahmin(kalanSesli,kalanSessiz){
let tur=(kalanSesli<2) ? "sesli" : ((kalanSessiz<3) ? "sessiz" : "serbest");
return seruvenTasCoz(seruvenSiradakiTas(tur),tur,jokerVar).harf;
}
document.getElementById("seruvenSiradakiSesli").innerHTML=tahmin(sesli-1,sessiz);
document.getElementById("seruvenSiradakiSessiz").innerHTML=tahmin(sesli,sessiz-1);
}


/* ---------- Hedef kelimeler ---------- */

function seruvenHedefCiz(){
if(!seruvenOyunu)return;
let o=seruvenOyunu;
document.getElementById("seruvenHedefler").innerHTML=o.hedefler.map(function(w){
let bulundu=o.bulunan.has(w);
return "<div class=\"seruven-hedef"+(bulundu ? " bulundu" : "")+"\">"+(bulundu ? "✓ " : "")+w+"</div>";
}).join("");
document.getElementById("wordTarget").innerHTML=o.bulunan.size+"/"+o.hedefler.length;
document.getElementById("wordTargetBar").style.width=Math.round(o.bulunan.size/o.hedefler.length*100)+"%";
}

/* Geçerli bir kelime yazıldı: hedefse işaretlenir, hepsi bulununca seviye biter */
function seruvenKelime(kelime){
let o=seruvenOyunu;
if(!o || resultRecorded)return;
if(!o.hedefler.includes(kelime) || o.bulunan.has(kelime)){
document.getElementById("wordMessage").innerHTML=kelime+" geçerli, harfler yenilendi.";
return;
}
o.bulunan.add(kelime);
document.getElementById("wordMessage").innerHTML="🎯 "+kelime+" bulundu!";
seruvenHedefCiz();
if(o.bulunan.size===o.hedefler.length)seruvenBitti(true);
}


/* ---------- Seviye sonu ---------- */

function seruvenBitti(kazandi){

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

h="<p class=\"screen-title\">Süre bitti ⏱️</p>";
h+="<p>"+o.bulunan.size+" / "+o.hedefler.length+" kelime bulundu.</p>";
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
