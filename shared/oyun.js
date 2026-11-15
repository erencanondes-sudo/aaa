/* Konfeti oyun kuralları: telefon ve sunucu bu dosyayı birlikte kullanır.
   Harfler gizli bir tohumdan hesaplanır; aynı tohum ve aynı zorluk her zaman aynı harfleri verir. */

export const TUR_SURESI = 120;
export const JOKER = "★";
export const JOKER_CAN = 9;
export const JOKER_IHTIMAL = 0.15;
export const KALAN_SANIYE_PUANI = 2;

export const HARF_TABLOSU = {
A:{freq:127,min:1,max:5}, B:{freq:20,min:1,max:4}, C:{freq:16,min:1,max:3}, Ç:{freq:15,min:1,max:4},
D:{freq:22,min:1,max:4}, E:{freq:84,min:1,max:5}, F:{freq:11,min:1,max:3}, G:{freq:13,min:1,max:2},
Ğ:{freq:6,min:1,max:2}, H:{freq:14,min:1,max:3}, I:{freq:42,min:1,max:4}, İ:{freq:73,min:1,max:5},
J:{freq:2,min:1,max:2}, K:{freq:68,min:1,max:5}, L:{freq:67,min:1,max:5}, M:{freq:54,min:1,max:5},
N:{freq:45,min:1,max:5}, O:{freq:26,min:1,max:4}, Ö:{freq:8,min:1,max:3}, P:{freq:15,min:1,max:3},
R:{freq:54,min:1,max:5}, S:{freq:39,min:1,max:5}, Ş:{freq:21,min:1,max:4}, T:{freq:50,min:1,max:5},
U:{freq:31,min:1,max:4}, Ü:{freq:22,min:1,max:3}, V:{freq:12,min:1,max:3}, Y:{freq:22,min:1,max:4},
Z:{freq:22,min:1,max:4}
};

export const SESLILER = ["A","E","I","İ","O","Ö","U","Ü"];
const SESSIZLER = Object.keys(HARF_TABLOSU).filter(function(h){ return !SESLILER.includes(h); });
const TUM_HARFLER = Object.keys(HARF_TABLOSU);

/* Zorluk 0 = bugünkü tablo; 100'e doğru zor harflerin sıklığı kademeli artar, 100'de iki katı olur */
export const ZOR_HARFLER = ["Ğ","J","F","V","Ö","G","H","C","P"];

const PUAN_TABLOSU = {2:10,3:15,4:25,5:55,6:70,7:85,8:100};

export function kelimePuani(kelime){
return PUAN_TABLOSU[kelime.length] || 0;
}

function harfAgirligi(harf,zorluk){
let agirlik=HARF_TABLOSU[harf].freq;
if(ZOR_HARFLER.includes(harf))agirlik*=1+zorluk/100;
return agirlik;
}

/* ---------- Tohumdan sayı ---------- */

const kodlayici=new TextEncoder();

/* tohum + akış adı + sıra numarası -> 0 ile 1 arası sayı (SHA-256) */
async function sayi(tohum,akis,sira){
let ozet=await crypto.subtle.digest("SHA-256",kodlayici.encode(tohum+"|"+akis+"|"+sira));
let v=new DataView(ozet).getUint32(0);
return v/4294967296;
}

export function yeniTohum(){
let b=new Uint8Array(16);
crypto.getRandomValues(b);
return Array.from(b,function(x){ return x.toString(16).padStart(2,"0"); }).join("");
}

/* Turnuvada açılıştan sonraki harfler oyuncuya özel tohumdan gelir */
export async function oyuncuTohumu(tohum,uid){
let ozet=await crypto.subtle.digest("SHA-256",kodlayici.encode(tohum+"|oyuncu|"+uid));
return Array.from(new Uint8Array(ozet).slice(0,16),function(x){ return x.toString(16).padStart(2,"0"); }).join("");
}

function agirlikliSec(r,havuz,zorluk){
let toplam=0;
havuz.forEach(function(h){ toplam+=harfAgirligi(h,zorluk); });
let x=r*toplam;
for(let i=0;i<havuz.length;i++){
let w=harfAgirligi(havuz[i],zorluk);
if(x<w)return havuz[i];
x-=w;
}
return havuz[havuz.length-1];
}

function canSec(r,harf){
let e=HARF_TABLOSU[harf];
return Math.floor(r*(e.max-e.min+1))+e.min;
}

/* ---------- Harf sırası ----------
   Üç ayrı sıra vardır: serbest (bütün harfler), sesli ve sessiz.
   Joker zarı serbest sıranın her adımı için ayrıca atılır. */

const SIRA_HAVUZU = { serbest:TUM_HARFLER, sesli:SESLILER, sessiz:SESSIZLER };
const ONBELLEK_ADIM = 24;

export class HarfSirasi {

constructor(tohum,zorluk){
this.tohum=tohum;
this.zorluk=zorluk;
this.liste={serbest:[],sesli:[],sessiz:[]};
this.zar=[];
this.konum={serbest:0,sesli:0,sessiz:0};
}

/* Her sıradan en az "adet" kadar taş hazır olsun (önceden hesaplanır, oyun sırasında bekleme olmaz) */
async hazirla(adet){
for(let ad of ["serbest","sesli","sessiz"]){
let l=this.liste[ad];
while(l.length<this.konum[ad]+adet){
let i=l.length;
let harf=agirlikliSec(await sayi(this.tohum,ad,i),SIRA_HAVUZU[ad],this.zorluk);
let can=canSec(await sayi(this.tohum,ad+"-can",i),harf);
l.push({harf:harf,can:can});
}
}
while(this.zar.length<this.konum.serbest+adet){
this.zar.push(await sayi(this.tohum,"joker",this.zar.length));
}
}

yeterli(){
return ["serbest","sesli","sessiz"].every((ad)=>this.liste[ad].length-this.konum[ad]>=8) && this.zar.length-this.konum.serbest>=8;
}

/* Serbest sıradan bir adım: joker gelebilir */
serbestAl(jokerVar){
let i=this.konum.serbest++;
if(!jokerVar && this.zar[i]<JOKER_IHTIMAL)return {harf:JOKER,can:JOKER_CAN};
return this.liste.serbest[i];
}

al(ad){
return this.liste[ad][this.konum[ad]++];
}

durum(){
return {konum:Object.assign({},this.konum)};
}

}

/* Turnuvada telefonun elindeki sıra: sunucunun önceden gönderdiği birkaç taştan oluşur.
   HarfSirasi ile aynı şekilde çalışır; taş biterse null döner ve telefon sunucunun cevabını bekler. */
export class OndenSira {

constructor(){
this.liste={serbest:[],sesli:[],sessiz:[]};
this.zar=[];
}

/* veri: {serbest:[...], sesli:[...], sessiz:[...], zar:[...]} (sıradaki taşlar, baştan) */
yenile(veri){
this.liste={serbest:veri.serbest.slice(),sesli:veri.sesli.slice(),sessiz:veri.sessiz.slice()};
this.zar=veri.zar.slice();
}

serbestAl(jokerVar){
if(!this.liste.serbest.length)return null;
let tas=this.liste.serbest.shift();
let zar=this.zar.shift();
if(!jokerVar && zar<JOKER_IHTIMAL)return {harf:JOKER,can:JOKER_CAN};
return tas;
}

al(ad){
return this.liste[ad].length ? this.liste[ad].shift() : null;
}

}

/* Sunucu tarafı: sıradaki birkaç taşı telefona göndermek için */
export function ondenVeri(sira,adet){
let veri={zar:sira.zar.slice(sira.konum.serbest,sira.konum.serbest+adet)};
for(let ad of ["serbest","sesli","sessiz"])veri[ad]=sira.liste[ad].slice(sira.konum[ad],sira.konum[ad]+adet);
return veri;
}

/* ---------- Açılış tahtası ----------
   2 sesli + 3 sessiz + 2 serbest + joker (joker her zaman sağ altta, 8. yerde) */
export async function acilisTahtasi(tohum,zorluk,turnuva){
let harfler=[];
let sira=0;
for(let i=0;i<2;i++)harfler.push(agirlikliSec(await sayi(tohum,"acilis",sira++),SESLILER,zorluk));
for(let i=0;i<3;i++)harfler.push(agirlikliSec(await sayi(tohum,"acilis",sira++),SESSIZLER,zorluk));
for(let i=0;i<2;i++)harfler.push(agirlikliSec(await sayi(tohum,"acilis",sira++),TUM_HARFLER,zorluk));

// karıştır
for(let i=harfler.length-1;i>0;i--){
let j=Math.floor((await sayi(tohum,"karistir",i))*(i+1));
[harfler[i],harfler[j]]=[harfler[j],harfler[i]];
}

let taslar=[];
for(let i=0;i<harfler.length;i++){
taslar.push({harf:harfler[i],can:canSec(await sayi(tohum,"acilis-can",i),harfler[i])});
}

// Turnuvada en az 4 harfin canı 1 olur (hangi 4 harf olduğu da tohumdan gelir)
if(turnuva){
let yerler=[0,1,2,3,4,5,6];
for(let i=yerler.length-1;i>0;i--){
let j=Math.floor((await sayi(tohum,"acilis-can1",i))*(i+1));
[yerler[i],yerler[j]]=[yerler[j],yerler[i]];
}
yerler.slice(0,4).forEach(function(y){ taslar[y].can=1; });
}

taslar.push({harf:JOKER,can:JOKER_CAN});
return taslar;
}

/* ---------- Tahta ----------
   Bir kelime yazılınca kullanılan taşların canı 1 azalır; canı biten taşın yerine sıradan yeni taş gelir. */
export class Tahta {

constructor(taslar,sira){
this.taslar=taslar.map(function(t){ return {harf:t.harf,can:t.can}; });
this.sira=sira;
this.bulunanlar=new Set();
this.puan=0;
}

harfler(){
return this.taslar.filter(function(t){ return t.harf!==JOKER; }).map(function(t){ return t.harf; });
}

/* yerler: kullanılan taşların sırası (seçilme sırasıyla); jokerHarfi: joker hangi harfin yerine geçtiyse
   sozluk: kelime listesi (Set). Geçerliyse puanı ekler ve tahtayı günceller. */
kelimeYaz(yerler,jokerHarfi,sozluk){

if(!Array.isArray(yerler) || yerler.length<2)return {tamam:false,sebep:"kisa"};
if(new Set(yerler).size!==yerler.length)return {tamam:false,sebep:"tekrar-tas"};
if(yerler.some((y)=>!(y>=0 && y<this.taslar.length)))return {tamam:false,sebep:"yer"};

let jokerKullanildi=false;
let kelime="";
for(let y of yerler){
let t=this.taslar[y];
if(t.harf===JOKER){
if(!jokerHarfi || !HARF_TABLOSU[jokerHarfi])return {tamam:false,sebep:"joker"};
kelime+=jokerHarfi;
jokerKullanildi=true;
}
else kelime+=t.harf;
}

if(jokerKullanildi && kelime.length<5)return {tamam:false,sebep:"joker-kisa"};
if(this.bulunanlar.has(kelime))return {tamam:false,sebep:"bulundu",kelime:kelime};
if(!sozluk.has(kelime))return {tamam:false,sebep:"sozlukte-yok",kelime:kelime};

this.bulunanlar.add(kelime);
let puan=kelimePuani(kelime);
this.puan+=puan;

let degisen=[];

for(let y of yerler){

let t=this.taslar[y];
t.can--;
if(t.can>0)continue;

let digerleri=this.taslar.filter(function(d,i){ return i!==y && d.harf!==JOKER; }).map(function(d){ return d.harf; });
let sesliSayisi=digerleri.filter(function(h){ return SESLILER.includes(h); }).length;
let sessizSayisi=digerleri.length-sesliSayisi;
let jokerVar=this.taslar.some(function(d,i){ return d.harf===JOKER && i!==y; });

let yeni;
if(sesliSayisi<2)yeni=this.sira.al("sesli");
else if(sessizSayisi<3)yeni=this.sira.al("sessiz");
else yeni=this.sira.serbestAl(jokerVar);

// Telefondaki önden sıra bittiyse yeni taşı sunucu gönderecek
if(!yeni){
this.taslar[y]={harf:null,can:0};
degisen.push(y);
continue;
}

this.taslar[y]={harf:yeni.harf,can:yeni.can};
degisen.push(y);

}

// Joker her zaman sağ alttaki (8.) yerde durur
let jokerYeri=this.taslar.findIndex(function(t){ return t.harf===JOKER; });
if(jokerYeri!==-1 && jokerYeri!==7){
[this.taslar[7],this.taslar[jokerYeri]]=[this.taslar[jokerYeri],this.taslar[7]];
degisen.push(7,jokerYeri);
}

return {tamam:true,kelime:kelime,puan:puan,degisen:degisen};

}

}

/* ---------- Sunucu kontrolü ----------
   Telefonun gönderdiği kelime kaydını aynı tohumla baştan oynatır, puanı yeniden hesaplar. */
export async function oyunuKontrolEt(o){
// o: {tohum, zorluk, turnuva, acilisTohumu, hamleler:[{yerler,joker}], kalanSaniye, sozluk}
let acilis=await acilisTahtasi(o.acilisTohumu || o.tohum,o.zorluk,!!o.turnuva);
let sira=new HarfSirasi(o.tohum,o.zorluk);
let tahta=new Tahta(acilis,sira);
let kelimeler=[];

for(let h of o.hamleler){
await sira.hazirla(8);
let sonuc=tahta.kelimeYaz(h.yerler,h.joker,o.sozluk);
if(!sonuc.tamam)return {gecerli:false,sebep:sonuc.sebep,kelimeler:kelimeler};
kelimeler.push(sonuc.kelime);
}

let kalan=Math.max(0,Math.min(TUR_SURESI,Math.floor(o.kalanSaniye||0)));
return {gecerli:true,kelimeler:kelimeler,puan:tahta.puan+KALAN_SANIYE_PUANI*kalan};
}
