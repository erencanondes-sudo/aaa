/* Sunucuyla konuşma: istekler, açılış ve telefonda tutulan oyunlar, anlık bağlantı.
   Sunucunun adresi Cloudflare'e ilk kez yüklendiğinde yazılacak. */

const SUNUCU_ADRESI="https://konfeti.ADRES.workers.dev";

class SunucuHatasi extends Error{
constructor(kod,durum){
super(kod);
this.kod=kod;
this.durum=durum||0;
}
}

/* Firebase girişinin belgesi (her istekte gönderilir; Firebase kendisi yeniler) */
async function girisBelgesi(){
let k=firebase.auth().currentUser;
if(!k)throw new SunucuHatasi("giris-gerekli",401);
return await k.getIdToken();
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

function hafizaAnahtari(){
let k=firebase.auth().currentUser;
return "konfetiOyunlar_"+(k ? k.uid : "");
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

function hafizaSil(){
try{ localStorage.removeItem(hafizaAnahtari()); }catch(e){}
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
return {profil:v.profil,liste:v.liste,oyunlar:h.oyunlar,giden:v.giden,acikOyuncular:v.acikOyuncular};
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

/* ---------- Anlık bağlantı (sohbet ve turnuvada kelimeler) ----------
   gelen: sunucudan her mesajda çağrılır ({t:"gecmis"|"mesaj"|"kelime"|"degisti"|"hata", ...}) */
async function oyunaBaglan(oyunId,gelen){
let adres=SUNUCU_ADRESI.replace(/^http/,"ws")+"/api/baglan?oyun="+encodeURIComponent(oyunId)+"&belge="+encodeURIComponent(await girisBelgesi());
let ws=new WebSocket(adres);
ws.onmessage=function(e){
try{ gelen(JSON.parse(e.data)); }catch(err){ console.error(err); }
};
return {
gonder:function(veri){ if(ws.readyState===1)ws.send(JSON.stringify(veri)); },
kapat:function(){ try{ ws.close(); }catch(e){} },
baglanti:ws
};
}
