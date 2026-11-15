/* Turnuvalar: günlük ve haftalık turnuva sayfası (oyunlar, ilk 100, sohbet, dünün ve geçen haftanın turnuvası),
   kişisel turnuvaya arkadaş daveti. Kişisel turnuvanın kendisi düello gibi Oyunlarım'da görünür. */

let acikTurnuva=null;   // sayfası açık olan günlük ya da haftalık turnuva

function showTournaments(){
joinWeeklyTournament();
}

function joinWeeklyTournament(){ turnuvayaKatil("haftalik"); }
function joinDailyTournament(){ turnuvayaKatil("gunluk"); }

/* Katılınca (zaten katıldıysa da) turnuvanın sayfası açılır */
function turnuvayaKatil(tur){

if(currentUser && currentUser.isGuest){
showMemberRequiredBanner();
return;
}

hideAllScreens();
document.getElementById("tournamentDetailScreen").style.display="block";
document.getElementById("tournamentDetailContent").innerHTML="<p style=\"color:#7b8fae;font-size:0.85em;\">Yükleniyor...</p>";
document.getElementById("tournamentLeaderboardSection").innerHTML="";
document.getElementById("tournamentSidePanel").innerHTML="";
document.getElementById("tournamentTopRow").innerHTML="";

sunucu("turnuva/katil",{tur:tur}).then(function(v){
acikTurnuva=v.oyun.oyun.id;
turnuvaSayfasiniCiz(v.oyun);
sohbetAc(acikTurnuva,"tournamentSidePanel");
}).catch(function(e){
document.getElementById("tournamentDetailContent").innerHTML="<p>"+hataMetni(e)+"</p>";
});

}

/* Tur bittikten sonra puan ve sıralama yenilenir */
function turnuvaSayfasiniYenile(id){

return sunucu("oyun/detay",{id:id}).then(function(v){
if(acikTurnuva===id)turnuvaSayfasiniCiz(v.oyun);
});

}

const GUN_ADLARI=["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];

function turnuvaSayfasiniCiz(d){

let g=d.oyun;
let haftalik=g.kind==="haftalik";
let bitti=g.status!=="suruyor" || Date.now()>=g.endsAt;

let title=document.getElementById("tournamentDetailTitle");
title.innerHTML=haftalik ? "📅 Haftalık Turnuva" : "☀️ Günlük Turnuva";
title.style.display="block";

let h="<div class=\"td-card td-timer-card\">";
h+="<span class=\"td-trophy-icon\">🏆</span>";
h+="<span class=\"td-timer-subtitle\">"+(haftalik ? "7 günlük" : "Bugünün turnuvası")+"</span>";
if(bitti)h+="<span class=\"td-timer-title\">Sona erdi</span>";
else{
let ms=g.endsAt-Date.now();
h+="<span class=\"td-timer-title\">Kalan süre</span>";
h+="<div class=\"td-timer-clock\">"+(haftalik ? Math.floor(ms/86400000)+"<span class=\"td-timer-unit\">gün</span> " : "")+Math.floor((ms%86400000)/3600000)+"<span class=\"td-timer-unit\">saat</span> "+Math.floor((ms%3600000)/60000)+"<span class=\"td-timer-unit\">dk</span></div>";
}
h+="</div>";

h+="<div class=\"td-days-list\">";
h+="<button class=\"td-lastweek-btn\" onclick=\"gecmisTurnuva('"+g.kind+"')\">"+(haftalik ? "Geçen Haftanın Turnuvası" : "Dünün Turnuvası")+"</button>";

let benimTurlar=d.ben ? d.ben.turlar : [];
for(let i=0;i<g.format;i++){
let ad=haftalik ? GUN_ADLARI[i] : "Bugünün oyunu";
let t=benimTurlar.find(function(x){ return x.idx===i; });
if(t && t.bitti){
h+="<button class=\"td-day-card played\" disabled><div class=\"td-day-icon-circle\">✓</div><div class=\"td-day-label\">"+ad+" · "+t.puan+"</div></button>";
}
else if(i>=g.acikOyun || bitti){
h+="<button class=\"td-day-card locked\"><div class=\"td-day-icon-circle\">🔒</div><div class=\"td-day-label\">"+ad+"</div></button>";
}
else{
h+="<button class=\"td-day-card playable\" onclick=\"turnuvaTuruOyna('"+g.id+"',"+i+")\"><div class=\"td-day-icon-circle\"><div class=\"td-day-triangle\"></div></div><div class=\"td-day-label\">"+ad+(t ? " · devam et" : "")+"</div><div class=\"td-day-arrow\">›</div></button>";
}
}
h+="</div>";

document.getElementById("tournamentDetailContent").innerHTML=h;

// İlk 100
let b="<div class=\"td-section-title\">İLK 100 · "+d.oyuncuSayisi+" oyuncu</div>";
b+="<div class=\"td-leaderboard-list\">";
if(!d.siralama.length)b+="<p style=\"color:#7b8fae;font-size:0.85em;\">Henüz kimse oynamadı.</p>";
let benListede=false;
d.siralama.forEach(function(o,i){
if(o.ben)benListede=true;
let derece=i===0 ? "td-rank-1" : (i===1 ? "td-rank-2" : (i===2 ? "td-rank-3" : ""));
b+="<div class=\"td-leaderboard-item"+(o.ben ? " td-me" : "")+"\">";
b+="<div class=\"td-user-info-group\"><div class=\"td-rank-badge "+derece+"\">"+(i+1)+"</div><div class=\"td-avatar\">"+avatarHtml(o.avatar)+"</div>";
b+="<div class=\"td-user-details\"><span class=\"td-user-name\" onclick=\"viewUserProfile('"+o.username+"','oyunlarim')\">"+o.username+"</span></div></div>";
b+="<div class=\"td-score-info\">Puan <span class=\"td-score-number\">"+o.total+"</span></div>";
b+="</div>";
});
b+="</div>";
if(d.ben && !benListede)b+="<p class=\"td-not-in-list\">İlk 100'de değilsin · Puanın: "+d.ben.total+"</p>";

document.getElementById("tournamentLeaderboardSection").innerHTML=b;

}

/* Günlük ve haftalık turnuvada bir oyun: harfler sunucudan gelir */
function turnuvaTuruOyna(id,idx){
if(waitForDictionary(turnuvaTuruOyna,this,arguments))return;

hideAllScreens();
document.getElementById("playArea").style.display="block";
document.getElementById("wordGameContent").style.display="none";
document.getElementById("loading").style.display="flex";

sunucuTuruHazirla(id,idx).then(function(r){

activeChallengeId=id;
activeChallengeSide=null;
activeChallengeGameIndex=idx;
activeChallengeIsComputer=false;
newGame({motor:true,yeniTur:r.yeni,resumeTime:r.kalan});

}).catch(function(e){

showTopNotification(hataMetni(e));
goHome();

});

}

/* Dünün günlük ya da geçen haftanın haftalık turnuvası (daha eskileri silinir) */
function gecmisTurnuva(tur){

sunucu("turnuva/gecmis",{tur:tur}).then(function(v){
if(!v.turnuvalar.length){
showTopNotification(tur==="haftalik" ? "Geçen hafta turnuvaya katılmadın." : "Dün turnuvaya katılmadın.");
return;
}
gecmisTurnuvaAc(v.turnuvalar[0].id);
}).catch(function(e){
showTopNotification(hataMetni(e));
});

}

function gecmisTurnuvaAc(id){

hideAllScreens();
document.getElementById("tournamentDetailScreen").style.display="block";
document.getElementById("tournamentSidePanel").innerHTML="";
acikTurnuva=id;

sunucu("oyun/detay",{id:id}).then(function(v){
turnuvaSayfasiniCiz(v.oyun);
// Silinmeyen turnuvalarda sohbet açık
sohbetAc(id,"tournamentSidePanel");
}).catch(function(e){
document.getElementById("tournamentDetailContent").innerHTML="<p>"+hataMetni(e)+"</p>";
});

}

/* ---------- Kişisel turnuvaya arkadaş daveti ---------- */

function openTournamentInvite(id){

let d=sunucuDurumu && sunucuDurumu.oyunlar[id];
let icerde=d ? d.oyuncular.map(function(o){ return o.username; }) : [];
let arkadaslar=(sunucuDurumu ? sunucuDurumu.arkadaslik.arkadaslar : []).filter(function(a){ return icerde.indexOf(a.username)===-1; });

let h="<p class=\"screen-title\" style=\"margin-top:0;\">Arkadaş Davet Et</p>";
if(!arkadaslar.length)h+="<p>Davet edilecek arkadaşın yok.</p>";
arkadaslar.forEach(function(a){
h+="<button class=\"menu-card white\" style=\"margin-top:8px;\" onclick=\"sendTournamentInviteTo('"+id+"','"+a.username+"',this)\"><div class=\"icon-circle\">"+avatarHtml(a.avatar)+"</div><div class=\"menu-copy\"><b>"+a.username+"</b></div><div class=\"arrow\">›</div></button>";
});
openDetailModal(h);

}

function sendTournamentInviteTo(id,username,btn){

btn.disabled=true;
sunucu("turnuva/davet",{id:id,username:username}).then(function(){
btn.outerHTML="<div class=\"already-friend\">✓ "+username+" davet edildi</div>";
oyunlariYenile(true);
}).catch(function(e){
btn.disabled=false;
showTopNotification(hataMetni(e));
});

}
