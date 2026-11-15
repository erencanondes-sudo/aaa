/* Düello ve kişisel turnuva turu: harfler sunucunun verdiği tohumdan, oyunun ortak kurallarıyla (shared/oyun.js)
   telefonda üretilir. Puanı telefon hesaplar; tur sonunda puan ve kelimeler sunucuya gider.
   Kelime kaydı yalnızca çıkış hakkından dönüşte tahtayı yeniden kurmak için tutulur. */

let aktifMotor=null;   // {oyunId, idx, tahta, sira, hamleler, duraklatildi}

/* Sunucudan turu başlatır (ya da çıkış hakkından döner) ve tahtayı hazırlar */
async function duelloTuruHazirla(oyunId,idx){

let v=await sunucu("tur/basla",{id:oyunId,idx:idx});
let O=window.KonfetiOyun;

let sira=new O.HarfSirasi(v.tohum,v.zorluk);
let tahta=new O.Tahta(await O.acilisTahtasi(v.acilisTohumu,v.zorluk,v.turnuva),sira);

// Çıkıştan dönüşte o ana kadarki kelimeler aynı sırayla yeniden oynanır
for(let h of v.hamleler){
await sira.hazirla(8);
tahta.kelimeYaz(h.yerler,h.joker,DICTIONARY);
}
await sira.hazirla(8);

aktifMotor={oyunId:oyunId,idx:idx,tahta:tahta,sira:sira,hamleler:v.hamleler.slice(),duraklatildi:false,cikisHakki:v.cikisHakki};
return v.kalanSaniye;

}

/* Tahtadaki taşlar ekrandaki karolara yazılır. Her karonun id'si tahtadaki yerini gösterir;
   karıştırınca yalnızca ekrandaki sıra değişir. Joker her zaman sağ altta durur. */
function motorTahtayiUygula(){

let taslar=aktifMotor.tahta.taslar;
wordTiles.forEach(function(t){
t.letter=taslar[t.id].harf;
t.life=taslar[t.id].can;
});

let j=wordTiles.findIndex(function(t){ return t.letter==="★"; });
if(j!==-1 && j!==7){
let a=wordTiles[7];
wordTiles[7]=wordTiles[j];
wordTiles[j]=a;
}

}

function motorKarolari(){
return aktifMotor.tahta.taslar.map(function(t,i){
return {letter:t.harf,used:false,id:i,life:t.can};
});
}

/* Geçerli kelime: kurallar dosyası taşların canını düşürür, biten taşların yerine yenisini koyar.
   Değişen karoların id'leri döner. */
function motorKelimeYaz(){

let yerler=wordSequence.map(function(s){ return wordTiles[s.index].id; });
let jokerAdim=wordSequence.find(function(s){ return s.isJoker; });
let joker=jokerAdim ? jokerAdim.value : null;

let sonuc=aktifMotor.tahta.kelimeYaz(yerler,joker,DICTIONARY);
if(!sonuc.tamam)return null;

aktifMotor.hamleler.push({yerler:yerler,joker:joker});
motorTahtayiUygula();

// Sıradaki kelime için taşlar önceden hazırlanır
aktifMotor.sira.hazirla(8);

return sonuc.degisen;

}

/* Tur bitti: puan ve bulunan kelimeler sunucuya gider */
function duelloTuruBitir(puan){

let m=aktifMotor;
aktifMotor=null;

return sunucu("tur/bitir",{id:m.oyunId,idx:m.idx,puan:puan,kelimeler:Array.from(m.tahta.bulunanlar),kalanSaniye:time}).then(function(v){

if(currentUser){
currentUser.wordScoreSum=(currentUser.wordScoreSum||0)+v.puan;
currentUser.wordScoreCount=(currentUser.wordScoreCount||0)+1;
}
return oyunAyrintisi(m.oyunId);

}).catch(function(e){

console.error("Tur kaydedilemedi:",e);
showTopNotification(hataMetni(e));

});

}

/* Turdan çıkış: turda bir kez süre durur. İkinci çıkışta süre işlemeye devam eder. */
function duelloTuruCik(){

if(!aktifMotor || aktifMotor.duraklatildi || !aktifMotor.cikisHakki)return Promise.resolve(false);

let m=aktifMotor;
return sunucu("tur/duraklat",{id:m.oyunId,idx:m.idx,hamleler:m.hamleler,puan:score,kelimeler:Array.from(m.tahta.bulunanlar)}).then(function(v){
if(v.duraklatildi){
m.duraklatildi=true;
m.cikisHakki=false;
}
return v.duraklatildi;
}).catch(function(){ return false; });

}

/* Tahtayı ekrana koyar: yeni turda harfler dağıtılır, çıkıştan dönüşte tahta olduğu gibi gelir */
function motorTuruGoster(yeniTur){

wordHistory=[];
wordSequence=[];
wordTiles=motorKarolari();
wordFound=new Set(aktifMotor.tahta.bulunanlar);
score=aktifMotor.tahta.puan;

wordBaseLetters=wordTiles.filter(function(t){ return t.letter!=="★"; }).map(function(t){ return t.letter; });
let jokerSayisi=wordTiles.filter(function(t){ return t.letter==="★"; }).length;
wordAchievable=Array.from(new Set([...computeAchievableWords(wordBaseLetters,jokerSayisi),...wordFound]));

document.getElementById("loading").style.display="none";
document.getElementById("wordGameContent").style.display="block";
document.getElementById("wordNewGameBtn").style.display="none";
document.getElementById("wordScoreValue").innerHTML=score;

playClickSoundNewgame();

if(yeniTur){
animateWordInitialDeal(wordTiles,wordAchievable.length,function(){ startWordTimerTick(); });
}
else{
renderWordCards();
updateWordTarget();
document.getElementById("wordMessage").innerHTML="Harflerden kelime türetiniz!";
startWordTimerTick();
}

}
