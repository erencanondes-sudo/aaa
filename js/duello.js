/* Düellolar: Oyunlarım listeleri, İstekler, düello açma ve cevap, rastgele rakip, düello oyuncu listesi,
   düello ayrıntısı ve anlık sohbet. Bilgiler açılışta sunucudan gelir (sunucuDurumu). */

let duelloSohbeti=null;   // açık sohbet bağlantısı
let sohbetOyunu=null;     // açık sohbetin oyunu (bağlantı koparsa yeniden kurulur)
let sohbetYenidenDene=null;

/* Açılış bilgisini yeniler ve görünen listeleri çizer. Liste canlı bağlantıyla güncel tutulduğu için
   yalnızca sunucu bir değişiklik bildirince ya da bir işlemden sonra (zorla) sunucuya sorulur. */
function oyunlariYenile(zorla){

if(!currentUser || currentUser.isGuest)return Promise.resolve();

if(!zorla){
oyunListeleriniCiz();
return Promise.resolve();
}

return acilis().then(function(v){
sunucuDurumu=v;
currentUserFriends=v.arkadaslik.arkadaslar.map(function(a){ return a.username; });
oyunListeleriniCiz();
}).catch(function(e){
console.error("Oyunlar yenilenemedi:",e);
});

}

/* Girişten sonra canlı bağlantı açılır; sunucu "değişti" deyince yalnızca değişen oyunlar istenir */
function canliListeyiBaslat(){
listeyeBaglan(function(){ oyunlariYenile(true); });
}

/* Eski adlarla çağrılan yerler için */
function renderOngoingList(){ oyunlariYenile(); }
function renderHistoryList(){ oyunListeleriniCiz(); }
function renderChallengesList(){ oyunListeleriniCiz(); }
function updateChallengeBadge(){ oyunListeleriniCiz(); }

/* ---------- Yardımcılar ---------- */

function benBul(d){ return d.oyuncular.find(function(o){ return o.ben; }); }
function rakipBul(d){ return d.oyuncular.find(function(o){ return !o.ben; }); }
function turBul(o,i){ return o ? o.turlar.find(function(x){ return x.idx===i; }) : null; }

function siradakiTurum(d){

let ben=benBul(d);
if(!ben || ben.status!=="katildi" || d.oyun.status!=="suruyor")return null;

for(let i=0;i<d.oyun.acikOyun;i++){
let t=turBul(ben,i);
if(!t || !t.bitti)return {idx:i,basladi:!!t};
}
return null;

}

function kalanSaat(bitis){
return Math.max(0,Math.floor((bitis-Date.now())/3600000));
}

/* Kartların sırası (eski düzen): bekleyenler alta, yeniler üste */
function oyOrder(waiting,tsSeconds){
let minutes=Math.floor(Math.max(0,(tsSeconds||0)-1577836800)/60);
return (waiting ? 20000000 : 0)+Math.max(0,10000000-minutes);
}

/* Rakibin adı ve görünümü */
function rakipGorunumu(d){
let r=rakipBul(d);
let bilgisayar=d.oyun.opponent==="bilgisayar";
return {
ad:bilgisayar ? "Bilgisayar" : (r ? r.username : "?"),
avatar:bilgisayar ? "🤖" : ((r && r.avatar)||"👤"),
kelimeSayisi:bilgisayar ? null : (r ? r.kelimeSayisi||0 : 0),
bilgisayar:bilgisayar
};
}

function profilTiki(g,kaynak){
return g.bilgisayar ? "" : " onclick=\"viewUserProfile('"+g.ad+"','"+kaynak+"')\"";
}

/* Benim oynadığım oyunlardaki toplamlar (rakibin toplamı da yalnızca o oyunlardan) */
function duelloToplamlari(d){
let ben=benBul(d),r=rakipBul(d);
let benim=0,rakibin=0,oynadigim=0;
for(let i=0;i<d.oyun.format;i++){
let t=turBul(ben,i);
if(!t || !t.bitti)continue;
oynadigim++;
benim+=t.puan||0;
let rt=turBul(r,i);
if(rt && rt.bitti)rakibin+=rt.puan||0;
}
return {benim:benim,rakibin:rakibin,oynadigim:oynadigim};
}

/* ---------- Gizlenen kartlar (uzun basınca "Vazgeç") ---------- */

function gizliAnahtar(){ return "konfetiGizli_"+(currentUser ? currentUser.uid : ""); }

function gizliler(){
try{ return JSON.parse(localStorage.getItem(gizliAnahtar())||"{}"); }catch(e){ return {}; }
}

function gizliYaz(m){
try{ localStorage.setItem(gizliAnahtar(),JSON.stringify(m)); }catch(e){}
}

/* ---------- Listeler ---------- */

function devamKartiHtml(k,d){

let g=rakipGorunumu(d);
let ben=benBul(d),r=rakipBul(d);
let toplam=d.oyun.format;

let simdiki=0;
for(;simdiki<toplam;simdiki++){
let a=turBul(ben,simdiki),b=g.bilgisayar ? a : turBul(r,simdiki);
if(!(a && a.bitti && b && b.bitti))break;
}
if(simdiki>=toplam)simdiki=toplam-1;
let oynadim=!!(turBul(ben,simdiki) && turBul(ben,simdiki).bitti);
let sira=siradakiTurum(d);

let saat=kalanSaat(d.oyun.endsAt);
let durum=oynadim ? (simdiki+1)+". oyun ⏳ "+saat+" saat" : simdiki+"/"+toplam+" ⏳ "+saat+" saat";
let tik=profilTiki(g,"ongoing");

let h="<div class=\"oy-card\" style=\"order:"+oyOrder(!sira,Math.floor((d.oyun.createdAt||0)/1000))+"\" data-lp-id=\""+d.oyun.id+"\" data-lp-type=\"ongoing\">";
h+="<div class=\"oy-avatar-col\">";
h+="<div class=\"oy-avatar-ring\""+tik+"><div class=\"oy-avatar\">"+avatarHtml(g.avatar)+"</div></div>";
if(!g.bilgisayar)h+="<div class=\"oy-word-count\">"+g.kelimeSayisi+"</div>";
h+="</div>";
h+="<div class=\"oy-content\">";
h+="<div class=\"oy-card-header\">";
h+="<div class=\"oy-user-info\"><span class=\"clickable-name oy-username\""+tik+">"+g.ad+"</span></div>";
h+="<span class=\"oy-status\">"+durum+"</span>";
h+="</div>";

let oyna="";
if(sira)oyna="<button class=\"oy-btn "+(sira.basladi ? "oy-btn-continue" : "oy-btn-play")+"\" onclick=\"playChallenge('"+d.oyun.id+"')\"><i class=\"fa-solid fa-play\"></i> "+(sira.basladi ? "Devam Et" : "Oyna")+"</button>";

h+="<div class=\"oy-actions\">";
h+="<button class=\"oy-btn oy-btn-view\" onclick=\"openChallengeDetail('"+d.oyun.id+"',null,null,'ongoing')\"><i class=\"fa-solid fa-eye\"></i> Görüntüle</button>";
h+=oyna;
h+="<button class=\"oy-btn oy-btn-msg\" onclick=\"openChallengeDetail('"+d.oyun.id+"',null,null,'ongoing')\"><i class=\"fa-solid fa-comment-dots\"></i> Mesaj<span class=\"badge\" style=\"display:none;\">0</span></button>";
h+="</div>";
h+="</div>";
h+="</div>";
return h;

}

function gecmisKartiHtml(k,d){

let g=rakipGorunumu(d);
let t=duelloToplamlari(d);
let toplam=d.oyun.format;

let sonuc;
if(t.benim>t.rakibin)sonuc=toplam===1 ? "🎉 Kazandın" : "🎉 Seri kazanıldı";
else if(t.benim<t.rakibin)sonuc=toplam===1 ? "😔 Kaybettin" : "😔 Seri kaybedildi";
else sonuc=toplam===1 ? "🤝 Berabere" : "🤝 Seri berabere";

let meydanOku=g.bilgisayar ? "challengeComputerFromHistory()" : "challengeFromProfile('"+g.ad+"')";
let tik=profilTiki(g,"oyunlarim");

let h="<div class=\"oy-card\" style=\"order:"+oyOrder(false,Math.floor((d.oyun.endsAt||0)/1000))+"\" data-lp-id=\""+d.oyun.id+"\" data-lp-type=\"history\">";
h+="<div class=\"oy-avatar-col\">";
h+="<div class=\"oy-avatar-ring\""+tik+"><div class=\"oy-avatar\">"+avatarHtml(g.avatar)+"</div></div>";
if(!g.bilgisayar)h+="<div class=\"oy-word-count\">"+g.kelimeSayisi+"</div>";
h+="</div>";
h+="<div class=\"oy-content\">";
h+="<div class=\"oy-card-header\">";
h+="<div class=\"oy-user-info\"><span class=\"clickable-name oy-username\""+tik+">"+g.ad+"</span></div>";
h+="<span class=\"oy-status\">"+sonuc+" · "+t.benim+"-"+t.rakibin+"</span>";
h+="</div>";
h+="<div class=\"oy-actions\">";
h+="<button class=\"oy-btn oy-btn-view\" onclick=\"openChallengeDetail('"+d.oyun.id+"',null,null,'oyunlarim')\"><i class=\"fa-solid fa-eye\"></i> Görüntüle</button>";
h+="<button class=\"oy-btn oy-btn-brown\" onclick=\""+meydanOku+"\">⚔️ Meydan Oku</button>";
h+="<button class=\"oy-btn oy-btn-msg\" onclick=\"openChallengeDetail('"+d.oyun.id+"',null,null,'oyunlarim')\"><i class=\"fa-solid fa-comment-dots\"></i> Mesaj<span class=\"badge\" style=\"display:none;\">0</span></button>";
h+="</div>";
h+="</div>";
h+="</div>";
return h;

}

/* İstekler: gelen düello daveti (Kabul Et / Reddet) ya da gönderdiğim davet */
function istekKartiHtml(o){

let tik=" onclick=\"viewUserProfile('"+o.ad+"','istekler')\"";

let h="<div class=\"oy-card\" data-challenge-id=\""+o.id+"\" data-lp-id=\""+o.id+"\" data-lp-type=\""+(o.gelen ? "request" : "giden")+"\">";
h+="<div class=\"oy-avatar-ring\""+tik+"><div class=\"oy-avatar\">"+avatarHtml(o.avatar||"👤")+"</div></div>";
h+="<div class=\"oy-content\">";
h+="<div class=\"oy-card-header\">";
h+="<div class=\"oy-user-info\"><span class=\"clickable-name oy-username\""+tik+">"+o.ad+"</span></div>";

if(o.durum==="kabul")h+="<span class=\"oy-status\">✅ Kabul edildi</span>";
else if(o.durum==="bekliyor")h+="<span class=\"oy-status\">"+(o.gelen ? "📩 " : "⏳ ")+o.saat+" saat</span>";
else if(o.durum==="dustu")h+="<span class=\"oy-status\">⌛ Süresi doldu</span>";
else if(o.durum==="red")h+="<span class=\"oy-status\">🚫 Reddedildi</span>";

h+="</div>";

if(o.durum==="kabul"){
h+="<div class=\"oy-status\" style=\"text-align:left;white-space:normal;margin-top:2px;color:#2ecc71;font-weight:700;\">Oyunlarım menüsünden oynayabilirsin.</div>";
}
else if(o.durum==="bekliyor" && o.gelen){
h+="<div class=\"oy-actions\">";
h+="<button class=\"oy-btn oy-btn-accept\" onclick=\"respondChallenge('"+o.id+"',true)\">✅ Kabul Et</button>";
h+="<button class=\"oy-btn oy-btn-decline\" onclick=\"respondChallenge('"+o.id+"',false)\">❌ Reddet</button>";
h+="</div>";
}
else if(o.durum==="bekliyor"){
h+="<div class=\"oy-status\" style=\"text-align:left;white-space:normal;margin-top:2px;\">Kabul bekleniyor, "+o.saat+" saat içinde cevap verilmezse iptal olur.</div>";
}

h+="</div>";
h+="</div>";
return h;

}

/* Kişisel turnuva kartı (devam eden, geçmiş ya da davet) */
function turnuvaKartiHtml(k,d,gecmis,davet){

let katilanlar=d.oyuncular.filter(function(o){ return o.status==="katildi"; });
let kurucu=katilanlar[0];
let baslik=d.oyun.name || ((kurucu ? kurucu.username : "?")+"'in Turnuvası");
let sira=siradakiTurum(d);
let tur=gecmis ? "tournament-past" : (davet ? "tournament-invite" : "tournament-ongoing");
let sira2=davet ? "" : " style=\"order:"+oyOrder(gecmis ? false : !sira,Math.floor(((gecmis ? d.oyun.endsAt : d.oyun.createdAt)||0)/1000))+"\"";

let h="<div class=\"oy-card\""+sira2+" data-lp-id=\""+d.oyun.id+"\" data-lp-type=\""+tur+"\">";
h+="<div class=\"oy-shield\"><div class=\"oy-shield-inner\"><span class=\"oy-swords\">🏆</span></div></div>";
h+="<div class=\"oy-content\">";
h+="<div class=\"oy-card-header\">";
h+="<div class=\"oy-user-info\"><span class=\"oy-username\">"+baslik+"</span></div>";
h+="<span class=\"oy-status\">"+katilanlar.length+" oyuncu · "+d.oyun.format+" oyun"+(gecmis||davet ? "" : " ⏳ "+kalanSaat(d.oyun.endsAt)+" saat")+"</span>";
h+="</div>";

if(davet){

if(kurucu)h+="<div class=\"oy-status\" style=\"text-align:left;white-space:normal;margin-top:2px;margin-bottom:8px;\">"+kurucu.username+" seni turnuvaya davet etti.</div>";
h+="<div class=\"oy-actions\">";
h+="<button class=\"oy-btn oy-btn-accept\" onclick=\"respondChallenge('"+d.oyun.id+"',true)\"><i class=\"fa-solid fa-trophy\"></i> Katıl</button>";
h+="<button class=\"oy-btn oy-btn-decline\" onclick=\"respondChallenge('"+d.oyun.id+"',false)\"><i class=\"fa-solid fa-xmark\"></i> Reddet</button>";
h+="</div>";

}
else{

let ben=benBul(d);
let kilitli=false;
for(let i=d.oyun.acikOyun;i<d.oyun.format;i++){ if(!(turBul(ben,i) && turBul(ben,i).bitti))kilitli=true; }

h+="<div class=\"oy-actions\">";
h+="<button class=\"oy-btn oy-btn-view\" onclick=\"kisiselTurnuvaAc('"+d.oyun.id+"')\"><i class=\"fa-solid fa-eye\"></i> Görüntüle</button>";
if(!gecmis){
if(sira)h+="<button class=\"oy-btn oy-btn-play\" onclick=\"playChallenge('"+d.oyun.id+"')\"><i class=\"fa-solid fa-play\"></i> Oyna</button>";
else h+="<button class=\"oy-btn oy-btn-play\" disabled><i class=\"fa-solid fa-check\"></i> "+(kilitli ? "Bugün tamam" : "Oynadın")+"</button>";
}
h+="<button class=\"oy-btn oy-btn-msg\" onclick=\"kisiselTurnuvaAc('"+d.oyun.id+"')\"><i class=\"fa-solid fa-comment-dots\"></i> Mesaj<span class=\"badge\" style=\"display:none;\">0</span></button>";
h+="</div>";

}

h+="</div>";
h+="</div>";
return h;

}

function oyunListeleriniCiz(){

if(!sunucuDurumu)return;

let gizli=gizliler();
let gizliYeni={};

let devam="",gecmis="",istekler="";
let tDevam="",tGecmis="",tDavet="";
let siraBende=0,gelenSayi=0;
let gecmisSayi=0,tGecmisSayi=0;

let liste=sunucuDurumu.liste.filter(function(k){ return k.kind==="duello" || k.kind==="turnuva"; });
liste.sort(function(a,b){ return (b.bitis||0)-(a.bitis||0); });

liste.forEach(function(k){

let d=sunucuDurumu.oyunlar[k.id];
if(!d)return;
if(gizli[k.id]){ gizliYeni[k.id]=true; return; }

let turnuva=k.kind==="turnuva";

if(yeniKabul[k.id] && !turnuva){
let g=rakipGorunumu(d);
istekler+=istekKartiHtml({id:d.oyun.id,ad:g.ad,avatar:g.avatar,gelen:true,durum:"kabul",saat:0});
return;
}

if(k.durum==="davetli"){
if(k.bitti)return;
gelenSayi++;
if(turnuva)tDavet+=turnuvaKartiHtml(k,d,false,true);
else{
let g=rakipGorunumu(d);
istekler+=istekKartiHtml({id:d.oyun.id,ad:g.ad,avatar:g.avatar,gelen:true,durum:"bekliyor",saat:kalanSaat(k.bitis)});
}
return;
}

if(k.bitti){
// Reddedilen ve süresi dolan davetler İstekler'de görünür; geçmişte yalnızca oynanmış oyunlar
if(d.oyun.status!=="bitti")return;
if(turnuva){ if(tGecmisSayi++<20)tGecmis+=turnuvaKartiHtml(k,d,true,false); }
else if(gecmisSayi++<20)gecmis+=gecmisKartiHtml(k,d);
return;
}

if(d.oyun.status==="bekliyor")return;   // gönderdiğim davet: İstekler'de
if(siradakiTurum(d))siraBende++;
if(turnuva)tDevam+=turnuvaKartiHtml(k,d,false,false);
else devam+=devamKartiHtml(k,d);

});

// Gönderdiğim istekler (kabul edilenler Oyunlarım'a geçer)
sunucuDurumu.giden.slice().sort(function(a,b){ return b.zaman-a.zaman; }).forEach(function(g){
if(g.durum==="kabul" || gizli[g.oyunId+":"+g.username]){ if(gizli[g.oyunId+":"+g.username])gizliYeni[g.oyunId+":"+g.username]=true; return; }
istekler+=istekKartiHtml({id:g.oyunId+":"+g.username,ad:g.username,avatar:g.avatar,gelen:false,durum:g.durum,saat:kalanSaat(g.zaman+7*86400000)});
});

gizliYaz(gizliYeni);

let yaz=function(id,html,bos){
let el=document.getElementById(id);
if(el)el.innerHTML=html || bos;
};

yaz("oyTourOngoing",tDevam,"");
yaz("oyTourPast",tGecmis,"");
yaz("oyTourInvites",tDavet,"");
yaz("ongoingList",devam,"<p>Şu an oynamayı bekleyen bir oyunun yok.</p>");
yaz("historyList",gecmis,"<p>Henüz oynanmış bir oyun yok.</p>");
yaz("challengesList",istekler,"<p>Bekleyen bir meydan okuma isteğin yok.</p>");

rozetYaz("ongoingBadge",siraBende);
rozetYaz("tabBadge",gelenSayi);
rozetYaz("gamesBadge",0);
rozetYaz("historyBadge",siraBende+gelenSayi);

}

function rozetYaz(id,sayi){

let el=document.getElementById(id);
if(!el)return;
el.innerHTML=sayi;
el.style.display=sayi>0 ? "flex" : "none";

}

/* ---------- Kartı uzun basınca: biten oyunda Sil, diğerlerinde Vazgeç ---------- */

let longPressTimer=null;

function initLongPressHandlers(){

document.addEventListener("touchstart",handleLongPressStart,{passive:true});
document.addEventListener("mousedown",handleLongPressStart);
document.addEventListener("touchend",cancelLongPress);
document.addEventListener("touchmove",cancelLongPress);
document.addEventListener("mouseup",cancelLongPress);
document.addEventListener("mouseleave",cancelLongPress);

}

function handleLongPressStart(e){

let cardEl=e.target.closest(".oy-card[data-lp-id]");
if(!cardEl)return;

longPressTimer=setTimeout(function(){
showCardActionOverlay(cardEl);
longPressTimer=null;
},550);

}

function cancelLongPress(){

if(longPressTimer){
clearTimeout(longPressTimer);
longPressTimer=null;
}

}

function showCardActionOverlay(cardEl){

if(cardEl.querySelector(".oy-lp-overlay"))return;

let type=cardEl.getAttribute("data-lp-type");
let id=cardEl.getAttribute("data-lp-id");

let isDirect=(type==="history" || type==="tournament-past");
let actionLabel=isDirect ? "🗑️ Sil" : "🚫 Vazgeç";
let actionColor=isDirect ? "#e74c3c" : "#e67e22";

let overlay=document.createElement("div");
overlay.className="oy-lp-overlay";
overlay.style.cssText="position:absolute;inset:0;background:rgba(15,23,42,0.55);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;gap:8px;z-index:5;border-radius:inherit;";

let actionBtn=document.createElement("button");
actionBtn.textContent=actionLabel;
actionBtn.style.cssText="background:"+actionColor+";color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:700;font-size:12px;";
actionBtn.onclick=function(ev){
ev.stopPropagation();
handleCardAction(type,id,cardEl);
};

let cancelBtn=document.createElement("button");
cancelBtn.textContent="İptal";
cancelBtn.style.cssText="background:#334155;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:700;font-size:12px;";
cancelBtn.onclick=function(ev){
ev.stopPropagation();
overlay.remove();
};

overlay.appendChild(actionBtn);
overlay.appendChild(cancelBtn);

if(getComputedStyle(cardEl).position==="static")cardEl.style.position="relative";

cardEl.appendChild(overlay);

setTimeout(function(){

function outsideHandler(ev){
if(!overlay.contains(ev.target)){
overlay.remove();
document.removeEventListener("click",outsideHandler);
document.removeEventListener("touchstart",outsideHandler);
}
}

document.addEventListener("click",outsideHandler);
document.addEventListener("touchstart",outsideHandler);

},50);

}

function handleCardAction(type,id,cardEl){

if(type==="history" || type==="tournament-past")deleteChallengeItem(id);
else{
// Süren oyun ve istekler yalnızca bu telefonda gizlenir
let m=gizliler();
m[id]=true;
gizliYaz(m);
}

animateCardRemoval(cardEl,function(){ oyunListeleriniCiz(); });

}

function animateCardRemoval(cardEl,onDone){

if(!cardEl){
if(onDone)onDone();
return;
}

let startHeight=cardEl.offsetHeight;

cardEl.style.overflow="hidden";
cardEl.style.maxHeight=startHeight+"px";
cardEl.style.transition="max-height 0.7s ease, opacity 0.6s ease, transform 0.6s ease, margin 0.7s ease, padding 0.7s ease";

requestAnimationFrame(function(){
requestAnimationFrame(function(){
cardEl.style.opacity="0";
cardEl.style.transform="translateY(-8px) scale(0.98)";
cardEl.style.maxHeight="0px";
cardEl.style.marginTop="0px";
cardEl.style.marginBottom="0px";
cardEl.style.paddingTop="0px";
cardEl.style.paddingBottom="0px";
});
});

setTimeout(function(){
cardEl.remove();
if(onDone)onDone();
},720);

}

initLongPressHandlers();

/* Biten oyunu kendi listemden siler (sunucuda) */
function deleteChallengeItem(id){

sunucu("oyun/gizle",{id:id}).then(function(){
sunucuDurumu.liste=sunucuDurumu.liste.filter(function(k){ return k.id!==id; });
delete sunucuDurumu.oyunlar[id];
oyunListeleriniCiz();
}).catch(function(e){
showTopNotification(hataMetni(e));
});

}

function challengeComputerFromHistory(){

pendingOpponentChoice={type:"computer",opponent:"Bilgisayar"};
showModalChallengeStart();

}

/* ---------- Düello açma ve cevap ---------- */

function createChallenge(gamesCount,inModal){
if(waitForDictionary(createChallenge,this,arguments))return;

let rakip=pendingChallenge.type==="computer" ? "bilgisayar" : "arkadas";
let username=pendingChallenge.opponent;
if(rakip!=="bilgisayar")bildirimIzniIste();

sunucu("oyun/duello",{rakip:rakip,username:username,format:gamesCount}).then(function(v){

let bicim=gamesCount===1 ? "tek oyunluk" : gamesCount+" oyunluk";
let mesaj=rakip==="bilgisayar"
? "🤖 Bilgisayara karşı "+bicim+" düello başladı!<br>Oyunlarım menüsünden oynayabilirsin."
: "Düello daveti "+username+" kullanıcısına gönderildi! ("+bicim+")<br>Kabul ettiğinde Oyunlarım'da görünecek.";

if(rakip==="bilgisayar")bilgisayarOyunlariniGonder(v);
else oyunlariYenile(true);
duelloGonderildiGoster(mesaj,inModal);

}).catch(function(e){

duelloGonderildiGoster(hataMetni(e),inModal);

});

}

/* Bilgisayar bütün oyunlarını düello açılırken oynar (eskisi gibi); hesap telefonda yapılır */
async function bilgisayarOyunlariniGonder(v){

try{
let turlar=[];
for(let i=0;i<v.tohumlar.length;i++){
turlar.push(await window.KonfetiOyun.bilgisayarOyna(v.tohumlar[i],v.zorluk,DICTIONARY));
}
await sunucu("oyun/bilgisayar",{id:v.id,turlar:turlar});
}
catch(e){
console.error("Bilgisayarın oyunları gönderilemedi:",e);
}
oyunlariYenile(true);

}

function duelloGonderildiGoster(mesaj,inModal){

if(inModal){

let html="<div id=\"modalChallengeEnvelope\" class=\"envelope-anim\" style=\"font-size:60px;margin:10px 0;text-align:center;\">✉️</div>";
html+="<p class=\"screen-title\">"+mesaj+"</p>";
html+="<button class=\"menu-card full-card purple\" style=\"margin-top:16px;\" onclick=\"closeDetailModal();goToHistoryFromChallengeDone();\"><div class=\"icon-circle\">🎮</div><div class=\"menu-copy\"><b>Oyunlarım</b><span>Devam eden oyunların</span></div><div class=\"arrow\">›</div></button>";
document.getElementById("detailModalContent").innerHTML=html;
zarfUcur(document.getElementById("modalChallengeEnvelope"));

}
else{

hideAllScreens();
document.getElementById("challengeDoneScreen").style.display="block";
document.getElementById("challengeDoneText").innerHTML=mesaj;
zarfUcur(document.getElementById("challengeEnvelope"));

}

playChallengeSentSound();

}

function zarfUcur(zarf){

zarf.classList.remove("flying-fast","flying-loop");
void zarf.offsetWidth;
zarf.classList.add("flying-fast");
zarf.addEventListener("animationend",function ilkUcus(){
zarf.removeEventListener("animationend",ilkUcus);
zarf.classList.remove("flying-fast");
zarf.classList.add("flying-loop");
});

}

let yeniKabul={};   // kabul ettiğim davetler 10 saniye İstekler'de "kabul edildi" olarak kalır

function respondChallenge(id,accept){

if(accept){
bildirimIzniIste();
yeniKabul[id]=true;
oyunListeleriniCiz();
setTimeout(function(){
delete yeniKabul[id];
oyunListeleriniCiz();
},10000);
}

sunucu("oyun/cevap",{id:id,kabul:accept}).catch(function(e){
delete yeniKabul[id];
showTopNotification(hataMetni(e));
}).then(function(){
oyunlariYenile(true);
});

}

/* ---------- Rastgele rakip ---------- */

function openChallengeRandom(){

hideAllScreens();
document.getElementById("randomWaitScreen").style.display="block";
syncRandomWaitScreenState();
syncChallengeListJoinButton();
renderChallengeListUsers();

}

function syncRandomWaitScreenState(){

if(sunucuDurumu && sunucuDurumu.rastgeleBekliyor)showRandomWaitingState();
else resetRandomModeButton();

}

function selectRandomMode(){

if(sunucuDurumu && sunucuDurumu.rastgeleBekliyor){
// Beklerken basılırsa bekleme iptal edilir
sunucu("oyun/rastgele-iptal").then(function(){
sunucuDurumu.rastgeleBekliyor=false;
resetRandomModeButton();
});
return;
}

showRandomWaitingState();
bildirimIzniIste();

sunucu("oyun/rastgele").then(function(v){

if(v.id){
sunucuDurumu.rastgeleBekliyor=false;
resetRandomModeButton();
showTopNotification("Rakip bulundu! Düellon başladı.");
oyunlariYenile(true);
}
else{
sunucuDurumu.rastgeleBekliyor=true;
}

}).catch(function(e){

resetRandomModeButton();
showTopNotification(hataMetni(e));

});

}

/* ---------- Düello oyuncu listesi (gece hazırlanan listeden 50 kişi) ---------- */

function acikOyuncular(){

return (sunucuDurumu ? sunucuDurumu.acikOyuncular : []).map(function(u){
return {username:u.username,avatarEmoji:u.avatar,country:u.country,successPct:u.basari};
});

}

function syncChallengeListJoinButton(){

let btn=document.getElementById("challengeListJoinBtn");
let label=document.getElementById("challengeListJoinBtnLabel");
if(!btn || !label || !sunucuDurumu || !sunucuDurumu.profil)return;

if(sunucuDurumu.profil.duelOpen){
label.innerHTML="Listeden Çık";
btn.classList.add("pale-blue");
btn.classList.remove("blue");
}
else{
label.innerHTML="Listeye Katıl";
btn.classList.add("blue");
btn.classList.remove("pale-blue");
}

}

function toggleChallengeList(){

if(!sunucuDurumu || !sunucuDurumu.profil)return;
let acik=!sunucuDurumu.profil.duelOpen;

sunucu("profil/duello-acik",{acik:acik}).then(function(){
sunucuDurumu.profil.duelOpen=acik;
syncChallengeListJoinButton();
duelloListesiAyariniCiz();
showTopNotification(acik ? "Listeye katıldın. Liste her gece yenilenir." : "Listeden çıktın.");
}).catch(function(e){
showTopNotification(hataMetni(e));
});

}

/* Rastgele düello ekranındaki liste: 50 kişinin hepsi */
function renderChallengeListUsers(){

let listEl=document.getElementById("challengeListUsersList");
let loadMoreEl=document.getElementById("challengeListLoadMore");
if(!listEl)return;
if(loadMoreEl)loadMoreEl.style.display="none";

let kisiler=acikOyuncular();
listEl.innerHTML=kisiler.length ? kisiler.map(buildChallengeListUserHtml).join("") : "<p style=\"color:#7b8fae;font-size:0.85em;\">Listede henüz kimse yok.</p>";

}

/* Ana sayfadaki kaydırmalı liste: ilk 15 kişi, sonunda "Devamını gör" */
function renderHomeChallengeListCarousel(){

let containerEl=document.getElementById("homeChallengeListCarousel");
let scrollEl=document.getElementById("homeClcScroll");
if(!containerEl || !scrollEl)return;

let kisiler=acikOyuncular().slice(0,15);

if(!kisiler.length){
containerEl.style.display="none";
scrollEl.innerHTML="";
return;
}

containerEl.style.display="block";
scrollEl.innerHTML=kisiler.map(function(u,i){ return buildHomeClcCardHtml(u,clcPalette[i%clcPalette.length]); }).join("")
+"<div class=\"clc-more-card\" onclick=\"openChallengeRandom()\"><span>Devamını gör<br>&gt;&gt;</span></div>";

scrollEl.onscroll=updateHomeClcArrow;
updateHomeClcArrow();

}

/* ---------- Düello ayrıntısı ---------- */

let acikAyrinti=null;

function openChallengeDetail(id,mySide,otherName,source){

returnToScreen=source||"ongoing";
acikAyrinti=id;

hideAllScreens();
document.getElementById("challengeDetailScreen").style.display="block";
document.getElementById("challengeDetailContent").innerHTML="<p style=\"color:#7b8fae;font-size:0.85em;\">Yükleniyor...</p>";
document.getElementById("challengeDetailBottomSection").innerHTML="";

let kayitli=sunucuDurumu && sunucuDurumu.oyunlar[id];
if(kayitli)ayrintiCiz(kayitli);

// Kelimeler ve güncel durum için ayrıntı her açılışta yenilenir
oyunAyrintisi(id).then(function(d){
if(acikAyrinti===id)ayrintiCiz(d);
}).catch(function(e){
document.getElementById("challengeDetailContent").innerHTML="<p style=\"color:#7b8fae;font-size:0.85em;\">"+hataMetni(e)+"</p>";
});

sohbetAc(id);

}

function ayrintiCiz(d){

let g=rakipGorunumu(d);
let ben=benBul(d),r=rakipBul(d);
let myAvatar=(currentUser && currentUser.avatarEmoji)||"👤";

document.getElementById("challengeDetailTitle").innerHTML="<span class=\"cd-title-avatar\">"+avatarHtml(g.avatar)+"</span><span class=\"cd-title-text\">"+g.ad+" ile Düello</span>";

let top="";
let kalanMs=d.oyun.endsAt-Date.now();
let bitti=d.oyun.status!=="suruyor" || kalanMs<=0;

top+="<div class=\"td-card td-timer-card\">";
top+="<span class=\"td-trophy-icon\">🏆</span>";
top+="<span class=\"td-timer-subtitle\">Düello</span>";
if(bitti){
top+="<span class=\"td-timer-title\">Süre doldu</span>";
}
else{
top+="<span class=\"td-timer-title\">Kalan süre</span>";
top+="<div class=\"td-timer-clock\">"+Math.floor(kalanMs/3600000)+"<span class=\"td-timer-unit\">saat</span> "+Math.floor((kalanMs%3600000)/60000)+"<span class=\"td-timer-unit\">dk</span></div>";
}
top+="</div>";

let hepsiBitti=true;
for(let i=0;i<d.oyun.format;i++){
let a=turBul(ben,i),b=g.bilgisayar ? a : turBul(r,i);
if(!(a && a.bitti && b && b.bitti))hepsiBitti=false;
}
let sira=siradakiTurum(d);

if(hepsiBitti || d.oyun.status==="bitti"){
top+="<button class=\"td-day-card played\" disabled><div class=\"td-day-icon-circle\">✓</div><div class=\"td-day-label\">Tamamlandı</div></button>";
}
else if(!sira){
top+="<button class=\"td-day-card played\" disabled><div class=\"td-day-icon-circle\">✓</div><div class=\"td-day-label\">Oynadın</div></button>";
}
else{
top+="<button class=\"td-day-card playable\" onclick=\"playChallenge('"+d.oyun.id+"')\"><div class=\"td-day-icon-circle\"><div class=\"td-day-triangle\"></div></div><div class=\"td-day-label\">"+(sira.basladi ? "Devam Et" : "Oyna")+"</div><div class=\"td-day-arrow\">›</div></button>";
}

// Arkadaş düellosu turnuvaya çevrilebilir (bitmemiş ve süresi dolmamış)
if(d.oyun.opponent==="arkadas" && !hepsiBitti && !bitti){
top+="<button class=\"td-btn-purple td-btn-row\" onclick=\"openChallengeAddFriend('"+d.oyun.id+"')\"><span>Arkadaş<br>Ekle</span><span class=\"td-play-icon\">👤+</span></button>";
}

document.getElementById("challengeDetailContent").innerHTML=top;

let t=duelloToplamlari(d);
let ortBen=t.oynadigim ? Math.round(t.benim/t.oynadigim) : 0;
let ortRakip=t.oynadigim ? Math.round(t.rakibin/t.oynadigim) : 0;

let satirlar=[
{ad:currentUser.username,avatar:myAvatar,puan:t.benim,ort:ortBen},
{ad:g.ad,avatar:g.avatar,puan:t.rakibin,ort:ortRakip}
];
satirlar.sort(function(a,b){ return b.puan-a.puan; });

let alt="<div class=\"td-section-title\">SIRALAMA</div>";
alt+="<div class=\"td-leaderboard-list\">";
satirlar.forEach(function(s,idx){
alt+="<div class=\"td-leaderboard-item\">";
alt+="<div class=\"td-user-info-group\">";
alt+="<div class=\"td-rank-badge "+(idx===0 ? "td-rank-1" : "td-rank-2")+"\">"+(idx+1)+"</div>";
alt+="<div class=\"td-avatar\">"+avatarHtml(s.avatar)+"</div>";
alt+="<div class=\"td-user-details\"><span class=\"td-user-name\">"+s.ad+"</span><span style=\"display:block;font-size:max(9.5px, calc(7px / var(--k)));color:#7b8fae;font-weight:600;\">"+t.oynadigim+"/"+d.oyun.format+" ort. "+s.ort+"</span></div>";
alt+="</div>";
alt+="<div class=\"td-score-info\">Puan <span class=\"td-score-number\">"+s.puan+"</span></div>";
alt+="</div>";
});
alt+="</div>";

alt+="<div class=\"td-section-title\">OYUN BİLGİSİ</div>";

for(let i=0;i<d.oyun.format;i++){

let bt=turBul(ben,i),rt=turBul(r,i);
let benOynadi=!!(bt && bt.bitti),rakipOynadi=!!(rt && rt.bitti);

alt+="<div class=\"td-card\" style=\"text-align:left;\">";
alt+="<div style=\"font-weight:800;font-size:11.5px;color:#fff;margin-bottom:3px;\">"+(i+1)+". Oyun</div>";

if(!benOynadi){
alt+="<div style=\"font-size:10.5px;color:#7b8fae;\">Henüz oynamadın.</div>";
}
else{

alt+="<div style=\"font-size:10.5px;color:#d1d5db;\">Harfler: "+(bt.harfler && bt.harfler.length ? bt.harfler.join(", ") : "-")+"</div>";
alt+="<div style=\"font-size:10.5px;color:#d1d5db;margin-top:3px;\">Senin Puanın: <b style=\"color:#fff;\">"+bt.puan+"</b></div>";

if(rakipOynadi)alt+="<div style=\"font-size:10.5px;color:#d1d5db;\">Rakip Puanı: <b style=\"color:#fff;\">"+rt.puan+"</b></div>";
else alt+="<div style=\"font-size:10.5px;color:#7b8fae;\">Rakip henüz oynamadı.</div>";

let benimKelimeler=bt.kelimeler||[];
if(benimKelimeler.length)alt+="<div style=\"font-size:10.5px;color:#d1d5db;margin-top:3px;\">Senin Bulduğun Kelimeler: "+benimKelimeler.join(", ")+"</div>";

// Rakibin kelimelerinden en fazla benim bulduğum kadarı görünür
if(rakipOynadi && rt.kelimeler && rt.kelimeler.length){
let gosterilen=rt.kelimeler.slice(0,benimKelimeler.length);
if(gosterilen.length)alt+="<div style=\"font-size:10.5px;color:#d1d5db;\">Rakibin Bulduğu Kelimeler: "+gosterilen.join(", ")+"</div>";
}

}

alt+="</div>";

}

document.getElementById("challengeDetailBottomSection").innerHTML=alt;

}

/* ---------- Kişisel turnuva sayfası ---------- */

let acikKisiselTurnuva=null;

function kisiselTurnuvaAc(id){

returnToScreen="ongoing";
acikKisiselTurnuva=id;
acikTurnuva=null;

hideAllScreens();
document.getElementById("tournamentDetailScreen").style.display="block";
document.getElementById("tournamentDetailContent").innerHTML="<p>Yükleniyor...</p>";
document.getElementById("tournamentTopRow").innerHTML="";
document.getElementById("tournamentLeaderboardSection").innerHTML="";
document.getElementById("tournamentDetailScreen").classList.remove("td-custom");

let kayitli=sunucuDurumu && sunucuDurumu.oyunlar[id];
if(kayitli)kisiselTurnuvaCiz(kayitli);

oyunAyrintisi(id).then(function(d){
if(acikKisiselTurnuva===id)kisiselTurnuvaCiz(d);
}).catch(function(e){
document.getElementById("tournamentDetailContent").innerHTML="<p>"+hataMetni(e)+"</p>";
});

sohbetAc(id,"tournamentSidePanel");

}

function kisiselTurnuvaCiz(d){

let katilanlar=d.oyuncular.filter(function(o){ return o.status==="katildi"; });
let kurucu=katilanlar[0];
let ben=benBul(d);
let katildim=ben && ben.status==="katildi";
let kalanMs=d.oyun.endsAt-Date.now();
let bitti=d.oyun.status!=="suruyor" || kalanMs<=0;

let title=document.getElementById("tournamentDetailTitle");
title.innerHTML=d.oyun.name ? "🏆 "+d.oyun.name : (kurucu ? kurucu.username : "?")+"'in Turnuvası";

document.getElementById("tournamentDetailScreen").classList.add("td-custom");

let top="<div class=\"td-card td-timer-card\">";
top+="<span class=\"td-trophy-icon\">🏆</span>";
top+="<span class=\"td-timer-subtitle\">"+d.oyun.format+" oyunluk</span>";
if(bitti){
top+="<span class=\"td-timer-title\">Sona erdi</span>";
}
else{
top+="<span class=\"td-timer-title\">Kalan süre</span>";
top+="<div class=\"td-timer-clock\">"+Math.floor(kalanMs/86400000)+"<span class=\"td-timer-unit\">gün</span> "+Math.floor((kalanMs%86400000)/3600000)+"<span class=\"td-timer-unit\">saat</span> "+Math.floor((kalanMs%3600000)/60000)+"<span class=\"td-timer-unit\">dk</span></div>";
}
top+="</div>";
top+="<div class=\"td-top-right\">";
if(katildim && !bitti)top+="<button class=\"td-top-card td-top-invite\" onclick=\"openTournamentInvite('"+d.oyun.id+"')\"><span class=\"td-top-card-icon\">👤+</span><span>Arkadaş Ekle</span></button>";
top+="<div class=\"td-top-card td-top-orange\"></div>";
top+="</div>";
document.getElementById("tournamentTopRow").innerHTML=top;

let sol="";
if(katildim && !bitti){
for(let i=0;i<d.oyun.format;i++){
let oynadi=!!(turBul(ben,i) && turBul(ben,i).bitti);
let acik=i<d.oyun.acikOyun;
let etiket=(d.oyun.format===1 ? "Oyna" : (i+1)+". Oyun")+(oynadi ? " ✓" : (acik ? "" : " 🔒"));
sol+="<button class=\"td-btn-green\" "+(oynadi||!acik ? "disabled" : "")+" onclick=\"playChallenge('"+d.oyun.id+"')\"><span>"+etiket+"</span>"+(oynadi||!acik ? "" : "<span class=\"td-play-icon\">▶</span>")+"</button>";
}
}
document.getElementById("tournamentDetailContent").innerHTML=sol;

let sirali=katilanlar.slice().sort(function(a,b){ return b.total-a.total; });
let tablo="<div class=\"td-section-title\">SIRALAMA</div>";
tablo+="<div class=\"td-leaderboard-list\">";
sirali.forEach(function(p,idx){
let oynanan=p.turlar.filter(function(t){ return t.bitti; }).length;
let ort=oynanan>0 ? Math.round(p.total/oynanan) : 0;
let rankClass=idx===0?"td-rank-1":(idx===1?"td-rank-2":(idx===2?"td-rank-3":""));
tablo+="<div class=\"td-leaderboard-item\">";
tablo+="<div class=\"td-user-info-group\">";
tablo+="<div class=\"td-rank-badge "+rankClass+"\">"+(idx+1)+"</div>";
tablo+="<div class=\"td-avatar\">"+avatarHtml(p.avatar||"👤")+"</div>";
tablo+="<div class=\"td-user-details\">";
tablo+="<span class=\"td-user-name\" onclick=\"viewUserProfile('"+p.username+"','oyunlarim')\">"+p.username+"</span>";
tablo+="<span class=\"td-user-subtext\">"+oynanan+"/"+d.oyun.format+" ort.puan:"+ort+"</span>";
tablo+="</div>";
tablo+="</div>";
tablo+="<div class=\"td-score-info\">Puan <span class=\"td-score-number\">"+p.total+"</span></div>";
tablo+="</div>";
});
tablo+="</div>";
document.getElementById("tournamentLeaderboardSection").innerHTML=tablo;

}

/* Düellodan kişisel turnuva: biçim seçilir, düellodaki rakip davet edilir */
function openChallengeAddFriend(id){

let html="<p class=\"screen-title\" style=\"margin-top:0;\">Turnuva aç</p><p>Bu düellodan bir turnuva açılır; sonra arkadaşlarını davet edebilirsin.</p>";
[[1,"1 Oyun","24 saat"],[3,"3 Oyun","48 saat"],[7,"7 Oyun","1 hafta, her gece bir oyun açılır"]].forEach(function(b){
html+="<button class=\"menu-card new\" style=\"margin-top:8px;\" onclick=\"createTournamentFromDuel('"+id+"',"+b[0]+")\"><div class=\"menu-copy\"><b>"+b[1]+"</b><span>"+b[2]+"</span></div><div class=\"arrow\">›</div></button>";
});
openDetailModal(html);

}

function createTournamentFromDuel(id,format){

document.getElementById("detailModalContent").innerHTML="<p>Turnuva açılıyor...</p>";
bildirimIzniIste();

sunucu("turnuva/ac",{kaynak:id,format:format}).then(function(){
document.getElementById("detailModalContent").innerHTML="<p class=\"screen-title\">Turnuva açıldı 🎉</p><p>Oyunlarım'dan oynayabilir, arkadaşlarını davet edebilirsin.</p>";
oyunlariYenile(true);
}).catch(function(e){
document.getElementById("detailModalContent").innerHTML="<p>"+hataMetni(e)+"</p>";
});

}

/* ---------- Anlık sohbet ---------- */

function sohbetAc(id,panelId){

sohbetKapat();

let panel=document.getElementById(panelId||"challengeDetailSidePanel");
sohbetRenkli=(panelId==="tournamentSidePanel");
panel.innerHTML="<div class=\"td-chat-header\">SOHBET</div>"
+"<div id=\"sohbetMesajlar\" class=\"td-chat-messages\"><p style=\"color:#7b8fae;font-size:0.85em;\">Yükleniyor...</p></div>"
+"<div class=\"td-chat-input-container\"><input type=\"text\" id=\"sohbetYazi\" maxlength=\"100\" placeholder=\"Mesajını yaz...\" class=\"td-chat-input\" onkeydown=\"if(event.key==='Enter')sohbetGonder()\"><button class=\"td-chat-send\" onclick=\"sohbetGonder()\">&#10148;</button></div>";

sohbetOyunu=id;
sohbetBaglan(id);

}

/* Sunucu her bağlantıda mesaj geçmişinin tamamını gönderir; yeniden bağlanınca arada gelenler de görünür */
function sohbetBaglan(id){

let b=null;

oyunaBaglan(id,function(v){

let kutu=document.getElementById("sohbetMesajlar");
if(!kutu)return;

if(v.t==="gecmis"){
kutu.innerHTML=v.mesajlar.length ? v.mesajlar.map(mesajHtml).join("") : "<p class=\"sohbet-bos\" style=\"color:#7b8fae;font-size:0.85em;\">"+(sohbetRenkli ? "Henüz mesaj yok." : "Henüz mesaj yok, ilk mesajı sen yaz.")+"</p>";
kutu.scrollTop=kutu.scrollHeight;
}
else if(v.t==="mesaj"){
let bos=kutu.querySelector(".sohbet-bos");
if(bos)bos.remove();
kutu.insertAdjacentHTML("beforeend",mesajHtml(v.mesaj));
kutu.scrollTop=kutu.scrollHeight;
}
else if(v.t==="degisti" && acikAyrinti===id){
// Rakip oynadı: ayrıntı yenilenir
oyunAyrintisi(id).then(function(d){ if(acikAyrinti===id)ayrintiCiz(d); });
}
else if(v.t==="degisti" && acikKisiselTurnuva===id){
oyunAyrintisi(id).then(function(d){ if(acikKisiselTurnuva===id)kisiselTurnuvaCiz(d); });
}
else if(v.t==="hata"){
showTopNotification(hataMetni({kod:v.hata}));
}

},function(){
// Bağlantı koptu: ekran açıksa 3 saniye sonra, arka plandaysa öne gelince yeniden kurulur
if(!b || duelloSohbeti!==b)return;
duelloSohbeti=null;
if(document.visibilityState==="visible")sohbetYenidenDene=setTimeout(sohbetiYenile,3000);
}).then(function(x){
if(sohbetOyunu!==id){ x.kapat(); return; }
b=x;
duelloSohbeti=x;
}).catch(function(e){
let kutu=document.getElementById("sohbetMesajlar");
if(kutu)kutu.innerHTML="<p style=\"color:#7b8fae;font-size:0.85em;\">"+hataMetni(e)+"</p>";
});

}

/* Bağlantı yenilenir; arada rakip oynadıysa ayrıntı da yenilenir */
function sohbetiYenile(){

clearTimeout(sohbetYenidenDene);
let id=sohbetOyunu;
let kutu=document.getElementById("sohbetMesajlar");
if(!id || !kutu || kutu.offsetParent===null)return;

if(duelloSohbeti){
let eski=duelloSohbeti;
duelloSohbeti=null;
eski.kapat();
}
sohbetBaglan(id);

if(acikAyrinti===id)oyunAyrintisi(id).then(function(d){ if(acikAyrinti===id)ayrintiCiz(d); });
else if(acikKisiselTurnuva===id)oyunAyrintisi(id).then(function(d){ if(acikKisiselTurnuva===id)kisiselTurnuvaCiz(d); });

}

document.addEventListener("visibilitychange",function(){
if(document.visibilityState==="visible" && sohbetOyunu)sohbetiYenile();
});

function sohbetKapat(){

clearTimeout(sohbetYenidenDene);
sohbetOyunu=null;
if(duelloSohbeti){
duelloSohbeti.kapat();
duelloSohbeti=null;
}

}

let sohbetRenkli=false;   // turnuvada her oyuncunun adı ayrı renkte

function mesajHtml(m){

let saat=new Date(m.zaman);
let zaman=("0"+saat.getHours()).slice(-2)+":"+("0"+saat.getMinutes()).slice(-2);
let ad=m.ben ? currentUser.username : m.ad;
let renk=sohbetRenkli ? getTournamentChatUserColor(ad) : (m.ben ? "#0088ff" : "#7b8fae");
// Mesaj metni sayfaya yazı olarak eklenir (HTML olarak değil)
let metin=String(m.metin).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
return "<div class=\"td-chat-msg\"><div><span class=\"td-chat-user\" style=\"color:"+renk+";\">"+ad+":</span><span class=\"td-chat-text\">"+metin+"</span></div><span class=\"td-chat-time\">"+zaman+"</span></div>";

}

function sohbetGonder(){

let kutu=document.getElementById("sohbetYazi");
let metin=kutu.value.trim();
if(!metin || !duelloSohbeti)return;
duelloSohbeti.gonder({t:"mesaj",metin:metin});
kutu.value="";

}
