/* Sunucuyla konuşma: istekler, açılış ve telefonda tutulan oyunlar, anlık bağlantı. */

const SUNUCU_ADRESI="https://konfeti.eren-can-ondes.workers.dev";

class SunucuHatasi extends Error{
constructor(kod,durum){
super(kod);
this.kod=kod;
this.durum=durum||0;
}
}

/* Firebase girişinin belgesi (her istekte gönderilir; Firebase kendisi yeniler).
   Firebase henüz yüklenmediyse son alınan belge kullanılır (Firebase'in belgesi 1 saat geçerlidir);
   o da yoksa ya da süresi dolduysa Firebase'in oturumu kontrol etmesi beklenir. */
async function girisBelgesi(){
if(!(auth && auth.currentUser) && !firebaseCevapVerdi){
let k=kayitliBelge();
if(k)return k;
await firebaseCevabiniBekle();
}
let u=auth && auth.currentUser;
if(!u)throw new SunucuHatasi("giris-gerekli",401);
let belge=await u.getIdToken();
belgeKaydet(u.uid,belge);
return belge;
}

function kayitliBelge(){
try{
let b=JSON.parse(localStorage.getItem("konfetiBelge")||"null");
if(b && b.uid===localStorage.getItem("konfetiSonGiris") && b.bitis>Date.now()+60000)return b.belge;
}catch(e){}
return null;
}

function belgeKaydet(uid,belge){
try{
let icerik=JSON.parse(atob(belge.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
localStorage.setItem("konfetiBelge",JSON.stringify({uid:uid,belge:belge,bitis:icerik.exp*1000}));
}catch(e){}
}

async function sunucu(islem,govde){
let yanit;
try{
yanit=await fetch(SUNUCU_ADRESI+"/api/"+islem,{
method:"POST",
headers:{"authorization":"Bearer "+(await girisBelgesi()),"content-type":"application/json"},
body:JSON.stringify(govde||{})
});
}
catch(e){
if(e instanceof SunucuHatasi)throw e;
throw new SunucuHatasi("baglanti-yok");
}
let veri={};
try{ veri=await yanit.json(); }catch(e){}
if(!yanit.ok || veri.hata)throw new SunucuHatasi(veri.hata||"sunucu-hatasi",yanit.status);
return veri;
}

/* Sunucunun hata kodlarının oyuncuya gösterilecek hâli */
const HATA_METINLERI={
"baglanti-yok":"İnternet bağlantısı yok.",
"sunucu-hatasi":"Bir sorun oluştu, biraz sonra tekrar dene.",
"giris-gerekli":"Tekrar giriş yapman gerekiyor.",
"ad-gecersiz":"Kullanıcı adı 3–15 karakter olmalı; yalnızca küçük harf, rakam ve alt çizgi kullanılabilir.",
"ad-uygunsuz":"Bu kullanıcı adı kullanılamaz.",
"ad-alinmis":"Bu kullanıcı adı zaten alınmış.",
"ad-ayda-bir":"Kullanıcı adı ayda bir kez değiştirilebilir.",
"profil-var":"Bu hesabın zaten bir profili var.",
"avatar-gecersiz":"Bu simge kullanılamaz.",
"kullanici-yok":"Kullanıcı bulunamadı.",
"kendin":"Kendine istek gönderemezsin.",
"engelli":"Bu kullanıcıyla etkileşim kuramazsın.",
"arkadas-siniri":"En fazla 100 arkadaşın olabilir.",
"istek-siniri":"Cevap bekleyen çok fazla isteğin var.",
"devam-eden-siniri":"Aynı anda en fazla 20 oyunun olabilir.",
"giden-davet-siniri":"Cevap bekleyen çok fazla davetin var.",
"karsi-davet-siniri":"Bu oyuncunun çok fazla bekleyen daveti var.",
"zaten-davet-var":"Bu oyuncuya zaten bir davetin var.",
"arkadas-degil":"Yalnızca arkadaşlarını davet edebilirsin.",
"turnuva-dolu":"Turnuva dolu.",
"zaten-turnuvada":"Bu oyuncu zaten turnuvada.",
"oyun-yok":"Oyun bulunamadı.",
"oyun-bitti":"Oyunun süresi doldu.",
"davet-yok":"Davet artık geçerli değil.",
"tur-bitti":"Bu oyunu zaten oynadın.",
"tur-kapali":"Bu oyun henüz açılmadı.",
"cok-hizli":"Biraz yavaş.",
"mesaj-gecersiz":"Mesaj en fazla 100 karakter olabilir.",
"istek-yok":"Bu istek artık geçerli değil.",
"format-gecersiz":"Geçersiz oyun biçimi.",
"sikayet-siniri":"Bugün daha fazla şikâyet gönderemezsin.",
"profil-yok":"Profil bulunamadı."
};

function hataMetni(e){
let kod=e && (e.kod||e.message);
return HATA_METINLERI[kod] || HATA_METINLERI["sunucu-hatasi"];
}

/* ---------- Telefonda tutulan oyunlar ----------
   Her oyunun son alınan ayrıntısı ve sürüm numarası saklanır; açılışta yalnızca değişenler istenir. */

const HAFIZA_SURUMU=1;

/* Firebase henüz yüklenmediyse son giriş yapan kullanıcının hafızası */
function hafizaUid(){
let k=auth && auth.currentUser;
if(k)return k.uid;
try{ return localStorage.getItem("konfetiSonGiris")||""; }catch(e){ return ""; }
}

function hafizaAnahtari(){
return "konfetiOyunlar_"+hafizaUid();
}

/* Son açılış bilgisi (oyunlar hariç; onlar ayrı tutulur): telefon açılınca sunucuyu beklemeden gösterilir */
function kayitliDurum(){
try{
let d=JSON.parse(localStorage.getItem("konfetiDurum_"+hafizaUid())||"null");
if(!d)return null;
d.oyunlar=hafizaOku().oyunlar;
return d;
}catch(e){ return null; }
}

function hafizaOku(){
try{
let h=JSON.parse(localStorage.getItem(hafizaAnahtari())||"null");
if(h && h.surum===HAFIZA_SURUMU)return h;
}catch(e){}
return {surum:HAFIZA_SURUMU,oyunlar:{}};
}

function hafizaYaz(h){
try{ localStorage.setItem(hafizaAnahtari(),JSON.stringify(h)); }catch(e){}
}

/* Açılış: profil, oyun listesi (değişen oyunların ayrıntısıyla), giden davetler, düello oyuncu listesi.
   Bir oyun açılamazsa ya da liste hafızayla uyuşmazsa bütün oyunlar baştan istenir. */
async function acilis(hepsi){
let h=hepsi ? {surum:HAFIZA_SURUMU,oyunlar:{}} : hafizaOku();
let bilinen={};
Object.keys(h.oyunlar).forEach(function(id){ bilinen[id]=h.oyunlar[id].oyun.surum; });

let v=await sunucu("acilis",{bilinen:bilinen});

v.oyunlar.forEach(function(d){ h.oyunlar[d.oyun.id]=d; });

// Listede olmayan oyunlar hafızadan çıkar
let listede={};
v.liste.forEach(function(k){ listede[k.id]=true; });
Object.keys(h.oyunlar).forEach(function(id){ if(!listede[id])delete h.oyunlar[id]; });

// Listede olup ayrıntısı olmayan düello varsa hafıza bozulmuş demektir: bir kez baştan iste
let eksik=v.liste.some(function(k){ return k.kind==="duello" && !h.oyunlar[k.id]; });
if(eksik && !hepsi)return acilis(true);

hafizaYaz(h);
try{ localStorage.setItem("konfetiDurum_"+hafizaUid(),JSON.stringify(Object.assign({},v,{oyunlar:undefined}))); }catch(e){}
v.oyunlar=h.oyunlar;
return v;
}

/* Tek oyunun güncel ayrıntısı (oyuna girildiğinde) */
async function oyunAyrintisi(id){
let v=await sunucu("oyun/detay",{id:id});
let h=hafizaOku();
h.oyunlar[id]=v.oyun;
hafizaYaz(h);
if(typeof sunucuDurumu!=="undefined" && sunucuDurumu)sunucuDurumu.oyunlar[id]=v.oyun;
return v.oyun;
}

/* ---------- Oyun listemin canlı bağlantısı ----------
   Rakip oynayınca, davet gelince ya da cevaplanınca sunucu haber verir; telefon yalnızca değişeni ister.
   Bağlantı koparsa birkaç saniye sonra yeniden kurulur. */
let listeBaglantisi=null;
let listeYenidenDene=null;

async function listeyeBaglan(degisti){
listedenKop();
let adres=SUNUCU_ADRESI.replace(/^http/,"ws")+"/api/baglan?liste=1&belge="+encodeURIComponent(await girisBelgesi());
let ws=new WebSocket(adres);
listeBaglantisi=ws;
ws.onmessage=function(e){
try{ if(JSON.parse(e.data).t==="degisti")degisti(); }catch(err){}
};
ws.onclose=function(){
if(listeBaglantisi!==ws)return;
listeBaglantisi=null;
// Açılmadan koparsa da kendiliğinden yeniden kurulur
listeYenidenDene=setTimeout(function(){ if(currentUser && !currentUser.isGuest)listeyeBaglan(degisti).then(degisti); },5000);
};
}

function listedenKop(){
clearTimeout(listeYenidenDene);
if(listeBaglantisi){
let ws=listeBaglantisi;
listeBaglantisi=null;
try{ ws.close(); }catch(e){}
}
}

/* ---------- Anlık bağlantı (sohbet ve turnuvada kelimeler) ----------
   gelen: sunucudan her mesajda çağrılır ({t:"gecmis"|"mesaj"|"kelime"|"degisti"|"hata", ...}) */
async function oyunaBaglan(oyunId,gelen){
let adres=SUNUCU_ADRESI.replace(/^http/,"ws")+"/api/baglan?oyun="+encodeURIComponent(oyunId)+"&belge="+encodeURIComponent(await girisBelgesi());
let ws=new WebSocket(adres);
let bekleyen=[];
ws.onopen=function(){
bekleyen.forEach(function(m){ ws.send(m); });
bekleyen=[];
};
ws.onmessage=function(e){
try{ gelen(JSON.parse(e.data)); }catch(err){ console.error(err); }
};
return {
// Bağlantı henüz açılmadıysa mesaj açılınca gönderilir
gonder:function(veri){ if(ws.readyState===1)ws.send(JSON.stringify(veri)); else if(ws.readyState===0)bekleyen.push(JSON.stringify(veri)); },
kapat:function(){ try{ ws.close(); }catch(e){} },
baglanti:ws
};
}
