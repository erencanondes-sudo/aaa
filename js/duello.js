/* Düellolar: Oyunlarım listeleri, İstekler, düello açma ve cevap, rastgele rakip, düello oyuncu listesi,
   düello ayrıntısı ve anlık sohbet. Bilgiler açılışta sunucudan gelir (sunucuDurumu). */

let duelloSohbeti=null;   // açık sohbet bağlantısı

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

function siradakiTurum(d){

let ben=d.oyuncular.find(function(o){ return o.ben; });
if(!ben || ben.status!=="katildi" || d.oyun.status!=="suruyor")return null;

for(let i=0;i<d.oyun.acikOyun;i++){
let t=ben.turlar.find(function(x){ return x.idx===i; });
if(!t || !t.bitti)return {idx:i,basladi:!!t};
}
return null;

}

function kalanSureMetni(bitis){

let ms=Math.max(0,bitis-Date.now());
let saat=Math.floor(ms/3600000);
if(saat>=24)return Math.floor(saat/24)+" gün";
if(saat>=1)return saat+" saat";
return Math.max(1,Math.floor(ms/60000))+" dk";

}

function rakipBilgisi(d){

if(d.oyun.kind==="turnuva"){
let sayi=d.oyuncular.filter(function(o){ return o.status==="katildi"; }).length;
return {username:d.oyun.name||"Turnuva",avatar:"🏆",etiket:sayi+" oyuncu",turnuva:true};
}

let r=d.oyuncular.find(function(o){ return !o.ben; });
let etiket=d.oyun.opponent==="bilgisayar" ? "Bilgisayar" : (d.oyun.opponent==="rastgele" ? "Rastgele" : null);
if(r && currentUserFriends.includes(r.username))etiket="Arkadaş";
return {username:r ? r.username : "?",avatar:d.oyun.opponent==="bilgisayar" ? "🤖" : (r && r.avatar),etiket:etiket,turnuva:false};

}

function skorMetni(d){

let ben=d.oyuncular.find(function(o){ return o.ben; });
if(d.oyun.kind==="turnuva"){
let sirali=d.oyuncular.filter(function(o){ return o.status==="katildi"; }).sort(function(a,b){ return b.total-a.total; });
return (sirali.indexOf(ben)+1)+". sıra · "+ben.total+" puan";
}
let r=d.oyuncular.find(function(o){ return !o.ben; });
return ben.total+" – "+(r ? r.total : 0);

}

/* ---------- Listeler ---------- */

function oyunKartiHtml(k,d){

let r=rakipBilgisi(d);
let sira=siradakiTurum(d);
let bitti=k.bitti;
let profilTik=r.turnuva ? "" : " onclick=\"viewUserProfile('"+r.username+"','ongoing')\"";

let durum;
if(bitti){
let ben=d.oyuncular.find(function(o){ return o.ben; });
let enYuksek=Math.max.apply(null,d.oyuncular.map(function(o){ return o.total; }));
let kazandi=ben.total===enYuksek && d.oyuncular.filter(function(o){ return o.total===enYuksek; }).length===1;
durum=d.oyun.status==="reddedildi" ? "Reddedildi" : (d.oyun.status==="dustu" ? "Süresi doldu" : (kazandi ? "🏆 Kazandın" : "Bitti"));
}
else if(d.oyun.status==="bekliyor"){
durum="Cevap bekleniyor";
}
else{
durum=(sira ? "Sıra sende" : "Rakip bekleniyor")+" ⏳ "+kalanSureMetni(d.oyun.endsAt);
}

let h="<div class=\"oy-card\" data-oyun-id=\""+d.oyun.id+"\">";
h+="<div class=\"oy-avatar-col\"><div class=\"oy-avatar-ring\""+profilTik+"><div class=\"oy-avatar\">"+avatarHtml(r.avatar)+"</div></div></div>";
h+="<div class=\"oy-content\">";
h+="<div class=\"oy-card-header\">";
h+="<div class=\"oy-user-info\"><span class=\"clickable-name oy-username\""+profilTik+">"+r.username+"</span>"+(r.etiket ? " <span class=\"oy-type-label\">("+r.etiket+")</span>" : "")+"</div>";
h+="<span class=\"oy-status\">"+durum+"</span>";
h+="</div>";
h+="<div class=\"oy-score-line\">"+skorMetni(d)+(d.oyun.format>1 ? " · "+d.oyun.format+" oyun" : "")+"</div>";
h+="<div class=\"oy-actions\">";
h+="<button class=\"oy-btn oy-btn-view\" onclick=\"openChallengeDetail('"+d.oyun.id+"')\"><i class=\"fa-solid fa-eye\"></i> Görüntüle</button>";
if(sira)h+="<button class=\"oy-btn "+(sira.basladi ? "oy-btn-continue" : "oy-btn-play")+"\" onclick=\"playChallenge('"+d.oyun.id+"')\"><i class=\"fa-solid fa-play\"></i> "+(sira.basladi ? "Devam Et" : "Oyna")+"</button>";
if(bitti)h+="<button class=\"oy-btn oy-btn-delete\" onclick=\"deleteChallengeItem('"+d.oyun.id+"')\"><i class=\"fa-solid fa-trash\"></i> Sil</button>";
h+="</div>";
h+="</div>";
h+="</div>";
return h;

}

function davetKartiHtml(k,d){

let r=rakipBilgisi(d);
let davetEden=k.kind==="turnuva" ? (d.oyuncular.find(function(o){ return o.status==="katildi"; })||{}).username : r.username;
let tur=k.kind==="turnuva" ? (d.oyun.name ? d.oyun.name+" turnuvası" : "Turnuva") : "Düello";
let bicim=d.oyun.format===1 ? "1 oyun" : d.oyun.format+" oyun";

let h="<div class=\"oy-card\" data-oyun-id=\""+d.oyun.id+"\">";
h+="<div class=\"oy-avatar-col\"><div class=\"oy-avatar-ring\"><div class=\"oy-avatar\">"+avatarHtml(r.avatar)+"</div></div></div>";
h+="<div class=\"oy-content\">";
h+="<div class=\"oy-card-header\"><div class=\"oy-user-info\"><span class=\"oy-username\">"+(davetEden||"?")+"</span></div><span class=\"oy-status\">"+tur+" · "+bicim+" ⏳ "+kalanSureMetni(k.bitis)+"</span></div>";
h+="<div class=\"oy-actions\">";
h+="<button class=\"oy-btn-accept\" onclick=\"respondChallenge('"+d.oyun.id+"',true)\">Kabul</button>";
h+="<button class=\"oy-btn-decline\" onclick=\"respondChallenge('"+d.oyun.id+"',false)\">Reddet</button>";
h+="</div>";
h+="</div>";
h+="</div>";
return h;

}

function gidenKartiHtml(g){

let durumlar={bekliyor:"⏳ Bekliyor",kabul:"✅ Kabul edildi",red:"❌ Reddedildi",dustu:"⌛ Süresi doldu"};
let tur=g.kind==="turnuva" ? "Turnuva daveti" : "Düello daveti";

let h="<div class=\"oy-card\">";
h+="<div class=\"oy-avatar-col\"><div class=\"oy-avatar-ring\" onclick=\"viewUserProfile('"+g.username+"','istekler')\"><div class=\"oy-avatar\">"+avatarHtml(g.avatar)+"</div></div></div>";
h+="<div class=\"oy-content\">";
h+="<div class=\"oy-card-header\"><div class=\"oy-user-info\"><span class=\"clickable-name oy-username\" onclick=\"viewUserProfile('"+g.username+"','istekler')\">"+g.username+"</span></div><span class=\"oy-status\">"+durumlar[g.durum]+"</span></div>";
h+="<div class=\"oy-score-line\">"+tur+"</div>";
h+="</div>";
h+="</div>";
return h;

}

function oyunListeleriniCiz(){

if(!sunucuDurumu)return;

let devam="",gecmis="",istekler="";
let siraBende=0,gelenSayi=0;

let liste=sunucuDurumu.liste.filter(function(k){ return k.kind==="duello" || k.kind==="turnuva"; });
liste.sort(function(a,b){ return (b.bitis||0)-(a.bitis||0); });

liste.forEach(function(k){

let d=sunucuDurumu.oyunlar[k.id];
if(!d)return;

if(k.durum==="davetli"){
if(!k.bitti){
istekler+=davetKartiHtml(k,d);
gelenSayi++;
}
}
else if(k.bitti){
gecmis+=oyunKartiHtml(k,d);
}
else{
// Sırası bende olanlar üstte
let kart=oyunKartiHtml(k,d);
if(siradakiTurum(d)){
devam=kart+devam;
siraBende++;
}
else devam+=kart;
}

});

let giden=sunucuDurumu.giden.slice().sort(function(a,b){ return b.zaman-a.zaman; });
let gidenHtml=giden.map(gidenKartiHtml).join("");

let el;
if((el=document.getElementById("ongoingList")))el.innerHTML=devam || "<p>Şu an oynamayı bekleyen bir oyunun yok.</p>";
if((el=document.getElementById("historyList")))el.innerHTML=gecmis || "<p>Henüz biten bir oyunun yok.</p>";
if((el=document.getElementById("challengesList"))){
el.innerHTML=(istekler ? "<p class=\"screen-title\">Gelen İstekler</p>"+istekler : "")
+(gidenHtml ? "<p class=\"screen-title\">Gönderdiğim İstekler</p>"+gidenHtml : "")
|| "<p>Bekleyen bir isteğin yok.</p>";
}

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

/* Biten oyunu kendi listemden siler */
function deleteChallengeItem(id){

sunucu("oyun/gizle",{id:id}).then(function(){
sunucuDurumu.liste=sunucuDurumu.liste.filter(function(k){ return k.id!==id; });
delete sunucuDurumu.oyunlar[id];
oyunListeleriniCiz();
}).catch(function(e){
showTopNotification(hataMetni(e));
});

}

/* ---------- Düello açma ve cevap ---------- */

function createChallenge(gamesCount,inModal){

let rakip=pendingChallenge.type==="computer" ? "bilgisayar" : "arkadas";
let username=pendingChallenge.opponent;

sunucu("oyun/duello",{rakip:rakip,username:username,format:gamesCount}).then(function(v){

let bicim=gamesCount===1 ? "tek oyunluk" : gamesCount+" oyunluk";
let mesaj=rakip==="bilgisayar"
? "🤖 Bilgisayara karşı "+bicim+" düello başladı!<br>Oyunlarım menüsünden oynayabilirsin."
: "Düello daveti "+username+" kullanıcısına gönderildi! ("+bicim+")<br>Kabul ettiğinde Oyunlarım'da görünecek.";

oyunlariYenile(true);
duelloGonderildiGoster(mesaj,inModal);

}).catch(function(e){

duelloGonderildiGoster(hataMetni(e),inModal);

});

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

function respondChallenge(id,accept){

sunucu("oyun/cevap",{id:id,kabul:accept}).then(function(){
if(accept)showTopNotification("Davet kabul edildi. Oyunlarım'dan oynayabilirsin.");
return oyunlariYenile(true);
}).catch(function(e){
showTopNotification(hataMetni(e));
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
document.getElementById("challengeDetailSidePanel").innerHTML="";
document.getElementById("challengeDetailBottomSection").innerHTML="";

let kayitli=sunucuDurumu && sunucuDurumu.oyunlar[id];
if(kayitli)ayrintiCiz(kayitli);

// Kelimeler ve güncel durum için ayrıntı her açılışta yenilenir
oyunAyrintisi(id).then(function(d){
if(acikAyrinti===id)ayrintiCiz(d);
}).catch(function(e){
document.getElementById("challengeDetailContent").innerHTML="<p style=\"color:#7b8fae;font-size:0.85em;\">"+hataMetni(e)+"</p>";
});

let d=kayitli;
if(!d || d.oyun.opponent!=="bilgisayar")sohbetAc(id);

}

function ayrintiCiz(d){

let r=rakipBilgisi(d);
document.getElementById("challengeDetailTitle").innerHTML=r.turnuva ? r.username : r.username+" ile Düello";

let oyuncular=d.oyuncular.filter(function(o){ return o.status==="katildi"; });
let h="<table class=\"td-score-table\"><tr><th>Oyun</th>";
oyuncular.forEach(function(o){ h+="<th>"+(o.ben ? "Sen" : o.username)+"</th>"; });
h+="</tr>";

for(let i=0;i<d.oyun.format;i++){
let acik=i<d.oyun.acikOyun;
h+="<tr><td>"+(i+1)+(acik ? "" : " 🔒")+"</td>";
oyuncular.forEach(function(o){
let t=o.turlar.find(function(x){ return x.idx===i; });
let hucre=t && t.bitti ? t.puan : (t ? "⏳" : "–");
// Kelimeler yalnızca ikimiz de o oyunu bitirdiysek görünür
if(t && t.kelimeler)hucre="<span class=\"td-score-words\" onclick=\"kelimeleriGoster('"+d.oyun.id+"','"+(o.ben ? "" : o.username)+"',"+i+")\">"+t.puan+" 🔤</span>";
h+="<td>"+hucre+"</td>";
});
h+="</tr>";
}

h+="<tr class=\"td-total-row\"><td>Toplam</td>";
oyuncular.forEach(function(o){ h+="<td>"+o.total+"</td>"; });
h+="</tr></table>";

let sira=siradakiTurum(d);
h+="<div class=\"oy-actions\" style=\"margin-top:12px;\">";
if(sira)h+="<button class=\"oy-btn oy-btn-play\" onclick=\"playChallenge('"+d.oyun.id+"')\"><i class=\"fa-solid fa-play\"></i> "+(sira.basladi ? "Devam Et" : (sira.idx+1)+". Oyunu Oyna")+"</button>";
if(d.oyun.kind==="duello" && d.oyun.opponent!=="bilgisayar")h+="<button class=\"oy-btn oy-btn-brown\" onclick=\"openChallengeAddFriend('"+d.oyun.id+"')\">➕ Arkadaş Ekle</button>";
if(d.oyun.kind==="turnuva" && d.oyun.status==="suruyor")h+="<button class=\"oy-btn oy-btn-brown\" onclick=\"openTournamentInvite('"+d.oyun.id+"')\">➕ Arkadaş Davet Et</button>";
h+="</div>";

if(d.oyun.status==="suruyor")h+="<p class=\"td-remaining\">⏳ "+kalanSureMetni(d.oyun.endsAt)+" kaldı</p>";

document.getElementById("challengeDetailContent").innerHTML=h;

}

function kelimeleriGoster(id,username,idx){

let d=sunucuDurumu.oyunlar[id];
let o=d.oyuncular.find(function(x){ return username ? x.username===username : x.ben; });
let t=o && o.turlar.find(function(x){ return x.idx===idx; });
if(!t || !t.kelimeler)return;

let kelimeler=t.kelimeler.slice().sort(function(a,b){ return b.length-a.length; });
openDetailModal("<p class=\"screen-title\" style=\"margin-top:0;\">"+(o.ben ? "Senin" : o.username)+" · "+(idx+1)+". oyun</p><p>"+(kelimeler.join(", ")||"Kelime yok")+"</p>");

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
panel.innerHTML="<div class=\"sohbet-mesajlar\" id=\"sohbetMesajlar\"><p style=\"color:#7b8fae;font-size:0.85em;\">Bağlanıyor...</p></div>"
+"<div class=\"sohbet-yaz\"><input id=\"sohbetYazi\" maxlength=\"100\" placeholder=\"Mesaj yaz...\" onkeydown=\"if(event.key==='Enter')sohbetGonder()\"><button onclick=\"sohbetGonder()\"><i class=\"fa-solid fa-paper-plane\"></i></button></div>";

oyunaBaglan(id,function(v){

let kutu=document.getElementById("sohbetMesajlar");
if(!kutu)return;

if(v.t==="gecmis"){
kutu.innerHTML=v.mesajlar.length ? v.mesajlar.map(mesajHtml).join("") : "<p class=\"sohbet-bos\" style=\"color:#7b8fae;font-size:0.85em;\">Henüz mesaj yok.</p>";
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
else if(v.t==="hata"){
showTopNotification(hataMetni({kod:v.hata}));
}

}).then(function(b){ duelloSohbeti=b; }).catch(function(e){
panel.innerHTML="<p style=\"color:#7b8fae;font-size:0.85em;\">"+hataMetni(e)+"</p>";
});

}

function sohbetKapat(){

if(duelloSohbeti){
duelloSohbeti.kapat();
duelloSohbeti=null;
}

}

function mesajHtml(m){

let saat=new Date(m.zaman);
let zaman=("0"+saat.getHours()).slice(-2)+":"+("0"+saat.getMinutes()).slice(-2);
// Mesaj metni sayfaya yazı olarak eklenir (HTML olarak değil)
let metin=String(m.metin).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
return "<div class=\"sohbet-mesaj"+(m.ben ? " ben" : "")+"\"><b>"+(m.ben ? "Sen" : m.ad)+"</b> "+metin+" <span class=\"sohbet-zaman\">"+zaman+"</span></div>";

}

function sohbetGonder(){

let kutu=document.getElementById("sohbetYazi");
let metin=kutu.value.trim();
if(!metin || !duelloSohbeti)return;
duelloSohbeti.gonder({t:"mesaj",metin:metin});
kutu.value="";

}
