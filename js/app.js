
/* Koyu/Açık mod: sayfa ilk çizilmeden önce kaydedilmiş tercih uygulanıyor */
(function(){
let savedTheme=localStorage.getItem("konfetiTheme")||"light";
if(savedTheme==="dark"){
document.body.classList.add("dark-mode");
}
})();

function updateThemeToggleUI(mode){

let lightBtn=document.getElementById("themeLightBtn");
let darkBtn=document.getElementById("themeDarkBtn");

if(!lightBtn || !darkBtn)return;

lightBtn.classList.toggle("active",mode!=="dark");
darkBtn.classList.toggle("active",mode==="dark");

}

function applyThemeMode(mode){

if(mode==="dark"){
document.body.classList.add("dark-mode");
}
else{
document.body.classList.remove("dark-mode");
}

updateThemeToggleUI(mode);

}

function setTheme(mode){

localStorage.setItem("konfetiTheme",mode);
applyThemeMode(mode);

}

(function(){

let gameEl=document.querySelector(".game");
let playAreaEl=document.getElementById("playArea");

function syncPlayingClass(){

if(playAreaEl.style.display==="none" || playAreaEl.style.display===""){
gameEl.classList.remove("playing");
}
else{
gameEl.classList.add("playing");
}

}

syncPlayingClass();

new MutationObserver(syncPlayingClass).observe(playAreaEl,{attributes:true,attributeFilter:["style"]});

let adBannerEl=document.getElementById("fakeAdBanner");
let adMenuScreenIds=["homeScreen","historyScreen","profileScreen","friendsScreen","settingsScreen","infoScreen","gameTypeScreen","tournamentDetailScreen","challengeTypeScreen","randomWaitScreen","challengeFriendScreen","challengeFormatScreen","challengeDoneScreen","challengeDetailScreen"];

function deviceHasSystemNavBar(){

try{

let testEl=document.createElement("div");
testEl.style.position="fixed";
testEl.style.bottom="0";
testEl.style.height="0";
testEl.style.paddingBottom="env(safe-area-inset-bottom)";
document.body.appendChild(testEl);

let safeAreaVal=parseFloat(getComputedStyle(testEl).paddingBottom) || 0;

document.body.removeChild(testEl);

// Büyük bir safe-area değeri klasik 3 tuşlu/çubuklu gezinmeyi işaret eder.
// Jest (gesture) navigasyonunda bazı cihaz/tarayıcılarda (ör. Samsung Internet)
// küçük ama sıfırdan farklı bir değer dönebiliyor; bunu "çubuk var" saymamak
// için eşik yükseltildi.
if(safeAreaVal>30){
return true;
}

if(window.screen && window.screen.height && window.innerHeight){

let fark=window.screen.height-window.innerHeight;

if(fark>60){
return true;
}

}

return false;

}catch(e){

return false;

}

}

let hasSystemNavBar=deviceHasSystemNavBar();

function updateSystemNavBarDetection(){

hasSystemNavBar=deviceHasSystemNavBar();
syncAdBanner();

}

window.addEventListener("resize",updateSystemNavBarDetection);
window.addEventListener("orientationchange",function(){
setTimeout(updateSystemNavBarDetection,300);
});
window.addEventListener("load",function(){
setTimeout(updateSystemNavBarDetection,300);
});

function refreshOnlineDependentScreens(){

let historyScreenEl=document.getElementById("historyScreen");
if(historyScreenEl && historyScreenEl.style.display!=="none"){
renderOngoingList();
renderHistoryList();
renderChallengesList();
}

}

window.addEventListener("online",refreshOnlineDependentScreens);
window.addEventListener("offline",refreshOnlineDependentScreens);

let adCachedTop=null;

let adVariants=[

function(){
return '<div style="width:100%;height:100%;background:linear-gradient(135deg,#192a56,#0c2461);box-sizing:border-box;padding:12px;color:white;position:relative;">'+
'<div style="font-size:10px;opacity:0.75;letter-spacing:1px;">REKLAM</div>'+
'<div style="font-size:19px;font-weight:bold;margin-top:22px;">🏦 Güvenli Bankacılık</div>'+
'<div style="font-size:13px;margin-top:6px;opacity:0.9;">%0 faizle hesap aç, hediye kazan.</div>'+
'<div style="position:absolute;bottom:12px;right:16px;background:#fbc531;color:#192a56;font-weight:bold;font-size:12px;padding:6px 14px;border-radius:20px;">HESAP AÇ</div>'+
'</div>';
},

function(){
return '<div style="width:100%;height:100%;position:relative;background:linear-gradient(135deg,#0097e6,#00a8ff);">'+
'<video src="ad-video-hotel.mp4" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display=\'none\';document.getElementById(\'adVideoFallback\').style.display=\'flex\';"></video>'+
'<div id="adVideoFallback" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;flex-direction:column;color:white;text-align:center;position:absolute;top:0;left:0;">'+
'<div style="font-size:32px;">🏖️</div>'+
'<div style="font-size:16px;font-weight:bold;margin-top:6px;">Tatil Fırsatı</div>'+
'<div style="font-size:12px;opacity:0.9;margin-top:4px;">Deniz Manzaralı Odalar</div>'+
'</div>'+
'<div style="position:absolute;bottom:10px;right:14px;background:rgba(0,0,0,0.5);color:white;font-size:10px;padding:3px 8px;border-radius:10px;">REKLAM</div>'+
'</div>';
},

function(){
return '<div class="ad-anim-bg" style="width:100%;height:100%;background:linear-gradient(120deg,#f39c12,#e67e22,#2ecc71,#f39c12);box-sizing:border-box;padding:12px;color:white;position:relative;overflow:hidden;">'+
'<div style="font-size:10px;opacity:0.8;letter-spacing:1px;">REKLAM</div>'+
'<div class="ad-anim-float" style="position:absolute;top:22px;right:60px;font-size:30px;">₿</div>'+
'<div class="ad-anim-float2" style="position:absolute;top:15px;right:16px;font-size:26px;">💰</div>'+
'<div class="ad-anim-float" style="position:absolute;bottom:14px;left:14px;font-size:24px;">📈</div>'+
'<div class="ad-anim-float2" style="position:absolute;top:8px;left:110px;font-size:22px;">🚀</div>'+
'<div class="ad-anim-shake" style="position:absolute;top:34px;left:50px;font-size:18px;font-weight:bold;white-space:nowrap;text-align:left;">Kripto ile Kazan!</div>'+
'<div class="ad-anim-pulse" style="position:absolute;bottom:12px;right:16px;background:white;color:#e67e22;font-weight:bold;font-size:13px;padding:7px 16px;border-radius:20px;">YATIRIM YAP</div>'+
'</div>';
}

];

let adChosenIndex=null;

function fillRandomAd(){

if(adChosenIndex===null){
adChosenIndex=Math.floor(Math.random()*adVariants.length);
}

let contentEl=document.getElementById("fakeAdBannerContent");
contentEl.innerHTML=adVariants[adChosenIndex]();

let videoEl=contentEl.querySelector("video");
if(videoEl){
videoEl.load();
videoEl.play().catch(function(){});
}

}

function positionAdBanner(){

if(adCachedTop!==null){
adBannerEl.style.top=adCachedTop+"px";
adBannerEl.style.height="100px";
adBannerEl.style.width="320px";
return;
}

let gameRect=document.querySelector(".game").getBoundingClientRect();
let headerEl=document.getElementById("globalHeader");
let headerRect=headerEl.getBoundingClientRect();

adCachedTop=headerRect.bottom-gameRect.top;

adBannerEl.style.top=adCachedTop+"px";
adBannerEl.style.height="100px";
adBannerEl.style.width="320px";

}


/* ===== EKRAN ÖLÇEĞİ (zoom) =====
   Referans: kullanılabilir yükseklik 806.2 px (oran 8.062).
   B1 (100 px) sabit; geri kalan her şey aynı çarpanla ölçeklenir.
   Çarpan = (kullanılabilir yükseklik - 100) / referanstaki ölçeklenen toplam */
const UI_REF_SCALABLE=706.2;
const UI_REF_NAV=56;
const UI_AD_HEIGHT=100;
const UI_K_MIN=0.7;
const UI_K_MAX=1.35;
const UI_ZOOM_IDS=["detailModalOverlay","wordScoreBanner","bottomNav"];
const UI_FIXED_AD_IDS=["fakeAdBanner","wordTopAdBanner"];

window.uiK=1; // global: oyun içi kodlar da kullanıyor
let uiScaleWidth=0;

function measureUsableHeight(){

let probe=document.createElement("div");
probe.style.cssText="position:fixed;left:0;width:0;visibility:hidden;pointer-events:none;top:env(safe-area-inset-top, 0px);bottom:env(safe-area-inset-bottom, 0px);";
document.body.appendChild(probe);
let h=probe.getBoundingClientRect().height;
document.body.removeChild(probe);

return h || window.innerHeight;

}

function applyUiScale(){

let usable=measureUsableHeight();
let total=hasSystemNavBar ? (UI_REF_SCALABLE-UI_REF_NAV) : UI_REF_SCALABLE;

let k=(usable-UI_AD_HEIGHT)/total;
k=Math.min(UI_K_MAX,Math.max(UI_K_MIN,k));
k=Math.round(k*1000)/1000;

uiScaleWidth=window.innerWidth;

document.documentElement.style.setProperty("--k",k);

let gameEl=document.querySelector(".game");
if(gameEl)gameEl.style.zoom=k;

UI_ZOOM_IDS.forEach(function(id){
let el=document.getElementById(id);
if(el)el.style.zoom=k;
});

UI_FIXED_AD_IDS.forEach(function(id){
let el=document.getElementById(id);
if(el)el.style.zoom=1/k;
});

if(k!==uiK){
uiK=k;
adCachedTop=null;
if(adBannerEl && adBannerEl.style.display!=="none"){
positionAdBanner();
}
}

}

function isEditingText(){

let a=document.activeElement;
return !!a && (a.tagName==="INPUT" || a.tagName==="TEXTAREA" || a.isContentEditable);

}

// Klavye açılınca (yalnızca yükseklik değişir, bir yazı alanı odaktadır) çarpan değişmez.
window.addEventListener("resize",function(){
if(window.innerWidth!==uiScaleWidth || !isEditingText()){
applyUiScale();
}
});
window.addEventListener("orientationchange",function(){
setTimeout(applyUiScale,350);
});
window.addEventListener("load",function(){
setTimeout(applyUiScale,350);
});

applyUiScale();


function syncAdBanner(){

let anyMenuVisible=adMenuScreenIds.some(function(id){
let el=document.getElementById(id);
return el.style.display!=="none" && el.style.display!=="";
});

let spacerEl=document.getElementById("adBannerSpacer");
let bottomNavEl=document.getElementById("bottomNav");

if(anyMenuVisible){

if(adBannerEl.style.display==="none"){
fillRandomAd();
positionAdBanner();
adBannerEl.style.display="block";
}
else if(adCachedTop===null){
positionAdBanner();
}

spacerEl.style.display="block";

if(!hasSystemNavBar){
bottomNavEl.classList.add("bn-visible");
}

}
else{

adBannerEl.style.display="none";
spacerEl.style.display="none";
bottomNavEl.classList.remove("bn-visible");

}

}

adMenuScreenIds.forEach(function(id){
let el=document.getElementById(id);
new MutationObserver(syncAdBanner).observe(el,{attributes:true,attributeFilter:["style"]});
});

})();


const wordTopAdVariants=[
function(){
return "<div style=\"width:100%;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0 12px;box-sizing:border-box;background:linear-gradient(135deg,#0984e3,#00cec9);color:#fff;font-weight:bold;font-size:13px;\"><span>📱 Uygulamayı Değerlendir</span><span style=\"background:#fff;color:#0984e3;padding:5px 10px;border-radius:8px;font-size:12px;\">Puan Ver</span></div>";
},
function(){
return "<div style=\"width:100%;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0 12px;box-sizing:border-box;background:linear-gradient(135deg,#e17055,#fdcb6e);color:#fff;font-weight:bold;font-size:13px;\"><span>🎁 Arkadaşını Davet Et</span><span style=\"background:#fff;color:#e17055;padding:5px 10px;border-radius:8px;font-size:12px;\">Davet Et</span></div>";
},
function(){
return "<div style=\"width:100%;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0 12px;box-sizing:border-box;background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;font-weight:bold;font-size:13px;\"><span>🏆 Turnuvalara Katıl</span><span style=\"background:#fff;color:#6c5ce7;padding:5px 10px;border-radius:8px;font-size:12px;\">Katıl</span></div>";
}
];

let wordTopAdChosenIndex=null;

function fillWordTopAd(){

if(wordTopAdChosenIndex===null){
wordTopAdChosenIndex=Math.floor(Math.random()*wordTopAdVariants.length);
}

document.getElementById("wordTopAdBannerContent").innerHTML=wordTopAdVariants[wordTopAdChosenIndex]();

}


function syncWordTopAdBanner(){

let bannerEl=document.getElementById("wordTopAdBanner");
let spacerEl=document.getElementById("wordTopAdBannerSpacer");
let titleEl=document.getElementById("mainTitle");

bannerEl.style.display="none";
spacerEl.style.display="none";
titleEl.style.marginTop="";

}

new MutationObserver(syncWordTopAdBanner).observe(document.getElementById("wordGameContent"),{attributes:true,attributeFilter:["style"]});
new MutationObserver(syncWordTopAdBanner).observe(document.getElementById("playArea"),{attributes:true,attributeFilter:["style"]});

const firebaseConfig={
apiKey:"AIzaSyD9IQO8387frW2ujk5QPAEiwicHaGongS8",
authDomain:"eren-63abb.firebaseapp.com",
projectId:"eren-63abb",
storageBucket:"eren-63abb.firebasestorage.app",
messagingSenderId:"750087041131",
appId:"1:750087041131:web:070444f7eacdfbd88f812e",
measurementId:"G-W1BJ8P6GQ8"
};

let firebaseReady=false;
let kayitSuruyor=false;
let sunucuDurumu=null;   // son açılışın sonucu: liste, oyunlar, giden davetler, arkadaşlar, düello oyuncu listesi
let auth=null;

try{

if(typeof firebase==="undefined"){
throw new Error("Firebase kütüphanesi yüklenemedi (script engellenmiş olabilir).");
}

firebase.initializeApp(firebaseConfig);
auth=firebase.auth();
firebaseReady=true;

// Analytics (aktif kullanıcı, ülke, cihaz vb. otomatik toplanır). Reklam engelleyici kütüphaneyi engellerse uygulama etkilenmez.
try{
if(firebase.analytics){
firebase.analytics();
}
}catch(e){
console.warn("Analytics başlatılamadı:",e);
}


auth.onAuthStateChanged(function(user){

if(user){
if(!kayitSuruyor)girisSonrasi();
}
else{
document.getElementById("sessionCheckScreen").style.display="none";
document.getElementById("authScreen").style.display="block";
}

});

}
catch(e){

console.error("Firebase başlatılamadı:",e);

document.getElementById("sessionCheckScreen").style.display="none";
document.getElementById("authScreen").style.display="block";

}

let timer;
let time=120;
let score=0;
let resultRecorded=false;
let gameActive=false;
let gameEndTime=null;


let currentUser=null;
let currentUserFriends=[];


function showLoginForm(){

document.getElementById("registerForm").style.display="none";
document.getElementById("forgotPasswordForm").style.display="none";
document.getElementById("loginForm").style.display="block";

}


function showRegisterForm(){

document.getElementById("loginForm").style.display="none";
document.getElementById("forgotPasswordForm").style.display="none";
document.getElementById("registerForm").style.display="block";

}


function showForgotPasswordForm(){

document.getElementById("loginForm").style.display="none";
document.getElementById("registerForm").style.display="none";
document.getElementById("forgotEmail").value="";
document.getElementById("forgotError").innerHTML="";
document.getElementById("forgotError").style.color="";
document.getElementById("forgotPasswordForm").style.display="block";

}


function sendPasswordReset(){

let errorEl=document.getElementById("forgotError");

if(!firebaseReady){
errorEl.style.color="";
errorEl.innerHTML="Bağlantı kurulamadı. Bu dosyayı indirip normal bir tarayıcı sekmesinde açmayı dene.";
return;
}

let email=document.getElementById("forgotEmail").value.trim();

if(!email){
errorEl.style.color="";
errorEl.innerHTML="Lütfen e-posta adresini gir.";
return;
}

errorEl.style.color="#27ae60";
errorEl.innerHTML="Gönderiliyor...";

withTimeout(auth.sendPasswordResetEmail(email),15000).then(function(){

errorEl.style.color="#27ae60";
errorEl.innerHTML="Sıfırlama bağlantısı e-postana gönderildi. Gelen kutunu (ve spam klasörünü) kontrol et.";

}).catch(function(e){

errorEl.style.color="";
errorEl.innerHTML=firebaseErrorMessage(e);

});

}


function firebaseErrorMessage(e){

let code=e.code || "";

if(code==="auth/email-already-in-use")return "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.";
if(code==="auth/invalid-email")return "Geçersiz e-posta adresi.";
if(code==="auth/weak-password")return "Şifre en az 6 karakter olmalı.";
if(code==="auth/user-not-found" || code==="auth/wrong-password" || code==="auth/invalid-credential")return "E-posta veya şifre hatalı.";
if(code==="timeout")return "Bağlantı zaman aşımına uğradı. İnternetini kontrol et veya bu dosyayı bir web sitesi olarak barındırmayı dene.";

return "Bir hata oluştu: "+e.message;

}


function withTimeout(promise,ms){

return Promise.race([

promise,

new Promise(function(resolve,reject){
setTimeout(function(){
reject({code:"timeout",message:"Bağlantı zaman aşımına uğradı. İnternetini kontrol et."});
},ms);
})

]);

}


function registerUser(){

let errorEl=document.getElementById("authError");

if(!firebaseReady){
errorEl.innerHTML="Bağlantı kurulamadı. Bu dosyayı indirip normal bir tarayıcı sekmesinde açmayı dene.";
return;
}

let name=document.getElementById("regName").value.trim();
let email=document.getElementById("regEmail").value.trim();
let username=document.getElementById("regUsername").value.trim().toLowerCase();
let country=document.getElementById("regCountry").value;
let password=document.getElementById("regPassword").value;
let passwordConfirm=document.getElementById("regPasswordConfirm").value;

if(!name || !email || !username || !country || !password || !passwordConfirm){
errorEl.innerHTML="Lütfen tüm alanları doldurun.";
return;
}

if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
errorEl.innerHTML="Geçerli bir e-posta adresi girin.";
return;
}

if(username.length<3){
errorEl.innerHTML="Kullanıcı adı en az 3 karakter olmalı.";
return;
}

if(password.length<6){
errorEl.innerHTML="Şifre en az 6 karakter olmalı.";
return;
}

if(password!==passwordConfirm){
errorEl.innerHTML="Şifreler eşleşmiyor.";
return;
}

errorEl.innerHTML="Kayıt oluşturuluyor...";

document.getElementById("registerBtn").disabled=true;

kayitSuruyor=true;

withTimeout(auth.createUserWithEmailAndPassword(email,password),15000).then(function(cred){

return sunucu("profil/olustur",{username:username,name:name,country:country}).then(function(){

kayitSuruyor=false;
return girisSonrasi();

}).catch(function(e){

// Profil oluşmadıysa Firebase hesabı da silinir; oyuncu aynı e-postayla tekrar deneyebilir
return cred.user.delete().catch(function(){}).then(function(){ throw e; });

});

}).catch(function(e){

kayitSuruyor=false;
document.getElementById("registerBtn").disabled=false;
errorEl.innerHTML=(e instanceof SunucuHatasi) ? hataMetni(e) : firebaseErrorMessage(e);

});

}


function loginUser(){

let errorEl=document.getElementById("loginError");

if(!firebaseReady){
errorEl.style.color="";
errorEl.innerHTML="Bağlantı kurulamadı. Bu dosyayı indirip normal bir tarayıcı sekmesinde açmayı dene.";
return;
}

let email=document.getElementById("loginEmail").value.trim();
let password=document.getElementById("loginPassword").value;

if(!email || !password){
errorEl.style.color="";
errorEl.innerHTML="Lütfen e-posta ve şifreni gir.";
return;
}

errorEl.style.color="#27ae60";
errorEl.innerHTML="Giriş yapılıyor...";

document.getElementById("loginBtn").disabled=true;

// Giriş başarılı olunca açılışı oturum dinleyicisi yapar
withTimeout(auth.signInWithEmailAndPassword(email,password),15000).catch(function(e){

document.getElementById("loginBtn").disabled=false;
errorEl.style.color="";
errorEl.innerHTML=firebaseErrorMessage(e);

});

}


/* Firebase girişi tamam: sunucudan açılış bilgisi alınır.
   İnternet yoksa son kaydedilen profille devam edilir. */
async function girisSonrasi(){

let uid=auth.currentUser.uid;
let kayitliAnahtar="konfetiProfil_"+uid;

try{

sunucuDurumu=await acilis();
document.getElementById("sessionCheckScreen").style.display="none";

if(!sunucuDurumu.profil){
// Kayıt yarıda kalmış: profil yok
await auth.signOut();
document.getElementById("authScreen").style.display="block";
document.getElementById("loginError").innerHTML="Kaydın tamamlanmamış, lütfen yeniden üye ol.";
return;
}

try{ localStorage.setItem(kayitliAnahtar,JSON.stringify(sunucuDurumu.profil)); }catch(e){}
onLoginSuccess(uid,sunucuDurumu.profil);

}
catch(e){

console.error("Açılış bilgisi alınamadı:",e);
document.getElementById("sessionCheckScreen").style.display="none";

let kayitli=null;
try{ kayitli=JSON.parse(localStorage.getItem(kayitliAnahtar)||"null"); }catch(err){}

if(kayitli)onLoginSuccess(uid,kayitli);
else document.getElementById("authScreen").style.display="block";

document.getElementById("loginBtn").disabled=false;

}

}


function onLoginSuccess(uid,profile){

profile=profile||{};

let isGuest=!uid;

currentUser={uid:uid,isGuest:isGuest,name:profile.name||"",username:profile.username||"",email:(!isGuest && auth.currentUser) ? (auth.currentUser.email||"") : "",country:profile.country||null,avatarEmoji:profile.avatar||"👤",challengeCount:profile.challengeCount||0,challengeWins:profile.challengeWins||0,wordScoreSum:profile.wordScoreSum||0,wordScoreCount:profile.wordScoreCount||0,foundWordsCount:profile.foundWordsCount||0,usernameChangedAt:profile.usernameChangedAt||null};
currentUserFriends=(sunucuDurumu && sunucuDurumu.arkadaslik) ? sunucuDurumu.arkadaslik.arkadaslar.map(function(a){ return a.username; }) : [];


document.getElementById("authScreen").style.display="none";
document.getElementById("homeScreen").style.display="block";
document.body.classList.add("home-active");

setBottomNavActive("home");

let firstName=isGuest ? "misafir" : ((profile.name||"").trim().split(/\s+/)[0]||"");

document.getElementById("welcomeText").innerHTML="Hoş geldin, "+firstName+" 👋";
document.getElementById("homeAvatarIcon").innerHTML=avatarHtml(currentUser.avatarEmoji);

renderHomeStats();
renderHomeChallengeListCarousel();

if(!isGuest){
oyunListeleriniCiz();
canliListeyiBaslat();
}

burstHomeConfetti();

}


function continueAsGuest(){

document.getElementById("sessionCheckScreen").style.display="none";
onLoginSuccess(null,{});

}


function showMemberRequiredBanner(){

let html="";

html+="<div style=\"text-align:center;padding:6px 4px 2px 4px;\">";
html+="<div style=\"font-size:34px;margin-bottom:8px;\">⚠️</div>";
html+="<p style=\"font-size:16px;font-weight:800;color:#192a56;margin:0 0 16px 0;\">Üye girişi yapmanız gerekiyor</p>";
html+="<button class=\"menu-card new\" style=\"margin:0 auto 14px auto;\" onclick=\"goToSignupFromBanner()\">";
html+="<div class=\"menu-copy\" style=\"text-align:center;\"><b>Üye Ol</b></div>";
html+="</button>";
html+="<p style=\"font-size:12.5px;color:#57606f;line-height:1.5;margin:0;\">Üye girişi yaparak düello oyunlarına ve turnuvalara katılarak diğer kişilerle oynayabilir ve sohbet edebilirsin</p>";
html+="</div>";

openDetailModal(html);

}


function goToSignupFromBanner(){

hideDetailModal();

if(window.history.state && window.history.state.modal){
window.history.replaceState({app:true},"","");
}

hideAllScreens();
document.getElementById("authScreen").style.display="block";
showRegisterForm();

}


function requireMemberNav(el,callback){

if(currentUser && currentUser.isGuest){
showMemberRequiredBanner();
return;
}

requireOnlineNav(el,callback);

}


function burstHomeConfetti(){

launchMemConfetti("extra",false);
scheduleClcIntro();

}


let pendingChallenge={opponent:null,type:null};
let activeChallengeId=null;
let activeChallengeIsComputer=false;
let activeChallengeSide=null;
let activeChallengeGameIndex=null;
let returnToScreen=null;

const SCREEN_IDS=["homeScreen","profileScreen","otherProfileScreen","friendsScreen","settingsScreen","infoScreen","challengeDetailScreen","gameTypeScreen","challengeTypeScreen","randomWaitScreen","challengeFriendScreen","challengeFormatScreen","challengeDoneScreen","historyScreen","tournamentDetailScreen","playArea","authScreen"];

let screenNavStack=[];
let suppressScreenPush=false;

const RANDOM_OPPONENTS=["Rakip_Ece","Rakip_Kaan","Rakip_Zeynep","Rakip_Mert","Rakip_Elif","Rakip_Deniz"];

const COUNTRY_LIST=[
{code:"TR",name:"Türkiye"},
{code:"DE",name:"Almanya"},
{code:"US",name:"Amerika Birleşik Devletleri"},
{code:"AZ",name:"Azerbaycan"},
{code:"BE",name:"Belçika"},
{code:"BG",name:"Bulgaristan"},
{code:"CA",name:"Kanada"},
{code:"CN",name:"Çin"},
{code:"DK",name:"Danimarka"},
{code:"EG",name:"Mısır"},
{code:"FI",name:"Finlandiya"},
{code:"FR",name:"Fransa"},
{code:"GE",name:"Gürcistan"},
{code:"GR",name:"Yunanistan"},
{code:"NL",name:"Hollanda"},
{code:"IN",name:"Hindistan"},
{code:"IQ",name:"Irak"},
{code:"IR",name:"İran"},
{code:"ES",name:"İspanya"},
{code:"SE",name:"İsveç"},
{code:"CH",name:"İsviçre"},
{code:"IT",name:"İtalya"},
{code:"JP",name:"Japonya"},
{code:"KZ",name:"Kazakistan"},
{code:"QA",name:"Katar"},
{code:"KE",name:"Kenya"},
{code:"KG",name:"Kırgızistan"},
{code:"KW",name:"Kuveyt"},
{code:"HU",name:"Macaristan"},
{code:"MD",name:"Moldova"},
{code:"NO",name:"Norveç"},
{code:"UZ",name:"Özbekistan"},
{code:"PK",name:"Pakistan"},
{code:"PL",name:"Polonya"},
{code:"PT",name:"Portekiz"},
{code:"RO",name:"Romanya"},
{code:"RU",name:"Rusya"},
{code:"SA",name:"Suudi Arabistan"},
{code:"RS",name:"Sırbistan"},
{code:"SY",name:"Suriye"},
{code:"TJ",name:"Tacikistan"},
{code:"TM",name:"Türkmenistan"},
{code:"UA",name:"Ukrayna"},
{code:"GB",name:"Birleşik Krallık"},
{code:"AE",name:"Birleşik Arap Emirlikleri"},
{code:"AU",name:"Avustralya"},
{code:"AT",name:"Avusturya"},
{code:"BA",name:"Bosna Hersek"},
{code:"BR",name:"Brezilya"},
{code:"CY",name:"Kıbrıs"},
{code:"CZ",name:"Çekya"},
{code:"AL",name:"Arnavutluk"},
{code:"MK",name:"Kuzey Makedonya"},
{code:"IE",name:"İrlanda"},
{code:"IL",name:"İsrail"},
{code:"JO",name:"Ürdün"},
{code:"KR",name:"Güney Kore"},
{code:"LB",name:"Lübnan"},
{code:"MA",name:"Fas"},
{code:"MX",name:"Meksika"},
{code:"MY",name:"Malezya"},
{code:"NZ",name:"Yeni Zelanda"},
{code:"SG",name:"Singapur"},
{code:"SK",name:"Slovakya"},
{code:"SI",name:"Slovenya"},
{code:"TN",name:"Tunus"},
{code:"ZA",name:"Güney Afrika"},
{code:"OTHER",name:"Diğer"},
{code:"XX",name:"Belirtmek istemiyorum"}
];

function countryFlagEmoji(code){

if(!code)return "";

if(code==="XX")return "🏳️";
if(code==="OTHER")return "🌐";

if(code.length!==2)return "";

let base=127397;

return String.fromCodePoint(code.charCodeAt(0)+base,code.charCodeAt(1)+base);

}


function getCountryName(code){

let found=COUNTRY_LIST.find(function(c){ return c.code===code; });
return found ? found.name : "";

}


(function populateCountrySelect(){

let sel=document.getElementById("regCountry");
if(!sel)return;

COUNTRY_LIST.forEach(function(c){
let opt=document.createElement("option");
opt.value=c.code;
opt.textContent=c.name;
sel.appendChild(opt);
});

})();


function recordGameEnd(result,finalScore){

gameActive=false;

stopWordTargetConfettiRain();

// Düello turu: kelime kaydı sunucuya gider, puanı sunucu onaylar
if(aktifMotor){
resultRecorded=true;
activeChallengeId=null;
activeChallengeIsComputer=false;
activeChallengeSide=null;
activeChallengeGameIndex=null;
duelloTuruBitir(finalScore);
return;
}


resultRecorded=true;

}


function hideAllScreens(){

let playAreaEl=document.getElementById("playArea");

// Oyun ekranından çıkış: düello turunda bir kez süre durur; ikinci çıkışta süre işlemeye devam eder
if(playAreaEl && playAreaEl.style.display==="block" && aktifMotor && gameActive && !resultRecorded){
let m=aktifMotor;
duelloTuruCik().then(function(durdu){
if(durdu && aktifMotor===m){
clearInterval(timer);
gameActive=false;
aktifMotor=null;
activeChallengeId=null;
activeChallengeGameIndex=null;
}
});
}

if(!suppressScreenPush){

for(let i=0;i<SCREEN_IDS.length;i++){

let el=document.getElementById(SCREEN_IDS[i]);

if(el.style.display && el.style.display!=="none"){

let gameElForPush=document.querySelector(".game");
screenNavStack.push({id:SCREEN_IDS[i],display:el.style.display,scrollTop:gameElForPush?gameElForPush.scrollTop:0});
window.history.pushState({app:true},"","");

break;

}

}

}

document.getElementById("homeScreen").style.display="none";
document.body.classList.remove("home-active");
document.getElementById("profileScreen").style.display="none";
document.getElementById("otherProfileScreen").style.display="none";
document.getElementById("friendsScreen").style.display="none";
document.getElementById("settingsScreen").style.display="none";
document.getElementById("infoScreen").style.display="none";
document.getElementById("challengeDetailScreen").style.display="none";
document.getElementById("gameTypeScreen").style.display="none";
document.getElementById("challengeTypeScreen").style.display="none";
document.getElementById("randomWaitScreen").style.display="none";
document.getElementById("challengeFriendScreen").style.display="none";
document.getElementById("challengeFormatScreen").style.display="none";
document.getElementById("challengeDoneScreen").style.display="none";
document.getElementById("historyScreen").style.display="none";
document.getElementById("tournamentDetailScreen").style.display="none";
document.getElementById("playArea").style.display="none";
document.getElementById("authScreen").style.display="none";

// Ekrandan çıkınca düello sohbeti kapanır
sohbetKapat();

}


function setBottomNavActive(name){

document.querySelectorAll(".bn-item").forEach(function(el){
el.classList.remove("active");
});

let el=document.querySelector(".bn-"+name);
if(el)el.classList.add("active");

}


const SCREEN_PARENT_MAP={
historyScreen:"home",
profileScreen:"home",
friendsScreen:"home",
settingsScreen:"home",
infoScreen:"home",
tournamentDetailScreen:"home"
};

function syncBottomNavForScreen(screenId){

if(screenId==="homeScreen")setBottomNavActive("home");
else if(screenId==="historyScreen")setBottomNavActive("games");
else if(screenId==="tournamentDetailScreen")setBottomNavActive("tournament");
else if(screenId==="friendsScreen")setBottomNavActive("profile");
else{
document.querySelectorAll(".bn-item").forEach(function(el){
el.classList.remove("active");
});
}

}


function bottomNavBack(){

let currentScreenId=null;

for(let i=0;i<SCREEN_IDS.length;i++){
let el=document.getElementById(SCREEN_IDS[i]);
if(el.style.display && el.style.display!=="none"){
currentScreenId=SCREEN_IDS[i];
break;
}
}

if(currentScreenId==="homeScreen"){
window.close();
return;
}

let parent=SCREEN_PARENT_MAP[currentScreenId];

if(parent==="home"){
goHome();
return;
}

window.history.back();

}


function animatedNav(el,callback){

el.classList.add("menu-card-pressed");

setTimeout(function(){
el.classList.remove("menu-card-pressed");
callback();
},200);

}


let topNotifQueue=[];
let topNotifActive=[];
let topNotifPlaying=false;

function showTopNotification(text){

topNotifQueue.push(text);

if(topNotifQueue.length>10){
topNotifQueue.shift();
}

processTopNotifQueue();

}

function processTopNotifQueue(){

if(topNotifPlaying)return;
if(topNotifQueue.length===0)return;

topNotifPlaying=true;

let text=topNotifQueue.shift();

let container=document.getElementById("topNotifContainer");

if(!container){
topNotifPlaying=false;
return;
}

let banner=document.createElement("div");
banner.className="top-notif-banner";
banner.innerHTML=text;
container.appendChild(banner);

topNotifActive.push(banner);

if(topNotifActive.length>10){
let oldest=topNotifActive.shift();
if(oldest.parentNode){
oldest.parentNode.removeChild(oldest);
}
}

requestAnimationFrame(function(){
requestAnimationFrame(function(){
banner.classList.add("show");
});
});

setTimeout(function(){

banner.classList.remove("show");
banner.classList.add("hide");

setTimeout(function(){

if(banner.parentNode){
banner.parentNode.removeChild(banner);
}

let idx=topNotifActive.indexOf(banner);
if(idx>-1)topNotifActive.splice(idx,1);

},400);

},3500);

setTimeout(function(){
topNotifPlaying=false;
processTopNotifQueue();
},400);

}


function requireOnlineNav(el,callback){

if(!navigator.onLine){
showTopNotification("📡 İnternet bağlantısı olmadığı için devam edilemiyor.");
return;
}

animatedNav(el,callback);

}


function goHome(){

setBottomNavActive("home");

revealSessionToken++;

hideScoreBannerNow();
stopWordTargetConfettiRain();
stopAllSounds();
clearAllConfetti();

if(gameActive && !resultRecorded && !activeChallengeId){

time=0;

let finalScore=computeFinalWordScore(score,wordAchievable.length,wordShowListBonus);

if(score>=300){
recordGameEnd("win",finalScore);
}
else{
recordGameEnd("timeout",finalScore);
}

gameActive=false;
clearInterval(timer);

}

if(!activeChallengeId){
activeChallengeId=null;
activeChallengeIsComputer=false;
activeChallengeSide=null;
activeChallengeGameIndex=null;
}

hideAllScreens();

document.getElementById("homeScreen").style.display="block";
document.body.classList.add("home-active");

screenNavStack=[];

renderHomeStats();
updateChallengeBadge();
renderHomeChallengeListCarousel();

}


function goBackFromDetail(){

let dest=returnToScreen;
returnToScreen=null;

if(dest==="istekler"){
showHistory();
switchHistoryTab("challenges");
}
else if(dest==="ongoing"){
showHistory();
switchHistoryTab("ongoing");
}
else if(dest==="oyunlarim"){
showHistory();
}
else if(dest==="friends"){
showFriends();
}
else{
goHome();
}

}


function openGameTypeChoice(){

hideAllScreens();
document.getElementById("gameTypeScreen").style.display="block";

}


let expandedTournamentDay={};
let lastRenderedTournament=null;


let activeTournamentRoundIndex=null;


let tournamentStatusData=null;


let activeTournamentChatId=null;

const TOURNAMENT_CHAT_COLORS=["#00d2ff","#ff6b6b","#ffd93d","#6bff8a","#c77dff","#ff9f43","#4ecdc4","#ff5da2","#a0e426","#7f9cf5"];
let tournamentChatUserColors={};
let tournamentChatColorIndex=0;


let pendingOpponentChoice=null;


function openChallengeType(){

hideAllScreens();
document.getElementById("challengeTypeScreen").style.display="block";

}


function openChallengeFriend(){

document.getElementById("challengeUsername").value="";
document.getElementById("challengeFriendError").innerHTML="";

hideAllScreens();
document.getElementById("challengeFriendScreen").style.display="block";

let listEl=document.getElementById("challengeFriendsList");

if(currentUserFriends.length===0){
listEl.innerHTML="<p>Henüz bir arkadaşın yok.</p>";
return;
}

// Arkadaşlar açılışta sunucudan avatarlarıyla gelir
let arkadaslar=(sunucuDurumu && sunucuDurumu.arkadaslik) ? sunucuDurumu.arkadaslik.arkadaslar : [];

listEl.innerHTML=arkadaslar.map(function(r){
return "<button class=\"menu-card white\" style=\"margin-top:8px;\" onclick=\"document.getElementById('challengeUsername').value='"+r.username+"';\"><div class=\"icon-circle\">"+avatarHtml(r.avatar)+"</div><div class=\"menu-copy\"><b>"+r.username+"</b></div><div class=\"arrow\">›</div></button>";
}).join("");

}


function confirmChallengeFriend(){

let username=document.getElementById("challengeUsername").value.trim().toLowerCase();

if(!username){

document.getElementById("challengeFriendError").innerHTML="Lütfen bir kullanıcı adı gir.";
return;

}

if(username===currentUser.username){

document.getElementById("challengeFriendError").innerHTML="Kendine meydan okuyamazsın.";
return;

}

pendingChallenge={opponent:username,type:"friend"};

hideAllScreens();
document.getElementById("challengeFormatScreen").style.display="flex";

}


function challengeFromProfile(username,profileFrom){

if(username===currentUser.username){
alert("Kendine meydan okuyamazsın.");
return;
}

pendingOpponentChoice={type:"friend",opponent:username,profileFrom:profileFrom||null};

showModalChallengeStart();

}


function showModalChallengeStart(){

pendingChallenge={opponent:pendingOpponentChoice.opponent,type:pendingOpponentChoice.type};

openDetailModal("<p>Yükleniyor...</p>","challenge-modal");
showModalFormatPicker();

}


function modalBackCardHtml(onclickJs){

return "<button class=\"modal-back-btn\" onclick=\""+onclickJs+"\">‹ Geri</button>";

}


function modalFirstStepBack(){

if(pendingOpponentChoice && pendingOpponentChoice.profileFrom){
viewUserProfile(pendingOpponentChoice.opponent,pendingOpponentChoice.profileFrom);
}
else{
closeDetailModal();
}

}


function showModalFormatPicker(){

let html="";

html+="<p class=\"screen-title\" style=\"margin-top:0;\">Kaç oyunluk meydan okuma göndermek istersin?</p>";
html+="<button class=\"menu-card full-card new\" style=\"margin-top:16px;\" onclick=\"createChallenge(1,true)\"><div class=\"icon-circle\">1️⃣</div><div class=\"menu-copy\"><b>Tek Oyun</b><span>24 saat içinde oynanır</span></div><div class=\"arrow\">›</div></button>";
html+="<button class=\"menu-card full-card orange\" style=\"margin-top:14px;\" onclick=\"createChallenge(3,true)\"><div class=\"icon-circle\">3️⃣</div><div class=\"menu-copy\"><b>3 Oyun</b><span>48 saat içinde oynanır</span></div><div class=\"arrow\">›</div></button>";
html+="<button class=\"menu-card full-card red\" style=\"margin-top:14px;\" onclick=\"createChallenge(7,true)\"><div class=\"icon-circle\">7️⃣</div><div class=\"menu-copy\"><b>7 Oyun</b><span>1 hafta, her gece bir oyun açılır</span></div><div class=\"arrow\">›</div></button>";
html+=modalBackCardHtml("modalFirstStepBack()");

document.getElementById("detailModalContent").innerHTML=html;

}


let randomQueueUnsubscribe=null;


function getRandomModeCardHtml(waiting){

let title="Çetrefilli";

if(waiting){
title+=" - Eşleşme Bekleniyor...";
}

return "<div class=\"icon-circle\">💥</div><div class=\"menu-copy\"><b>"+title+"</b><span>Harf can sistemi</span></div><div class=\"arrow\">›</div>";

}


function buildChallengeListUserHtml(u){

return "<div class=\"oy-card\">"
+"<div class=\"oy-avatar-col\">"
+"<div class=\"oy-avatar-ring\" onclick=\"viewUserProfile('"+u.username+"','challengeList')\"><div class=\"oy-avatar\">"+avatarHtml(u.avatarEmoji)+"</div></div>"
+"<div class=\"oy-word-count\">"+(typeof u.successPct==="number" ? "%"+u.successPct : "–")+"</div>"
+"</div>"
+"<div class=\"oy-content\">"
+"<div class=\"oy-card-header\">"
+"<div class=\"oy-user-info\"><span class=\"clickable-name oy-username\" onclick=\"viewUserProfile('"+u.username+"','challengeList')\">"+u.username+"</span></div>"
+"</div>"
+"<div class=\"oy-actions\">"
+"<button class=\"oy-btn oy-btn-view\" onclick=\"viewUserProfile('"+u.username+"','challengeList')\"><i class=\"fa-solid fa-eye\"></i> Görüntüle</button>"
+"<button class=\"oy-btn oy-btn-brown\" onclick=\"challengeFromProfile('"+u.username+"')\">⚔️ Meydan Oku</button>"
+"</div>"
+"</div>"
+"</div>";

}


function shuffleArray(arr){

let a=arr.slice();

for(let i=a.length-1;i>0;i--){
let j=Math.floor(Math.random()*(i+1));
let tmp=a[i];
a[i]=a[j];
a[j]=tmp;
}

return a;

}


let clcPalette=["#f0f7ff","#f0fdf4","#fff1f2","#f5f3ff","#fefce8"];

function buildHomeClcCardHtml(u,bgColor){

let flag=countryFlagEmoji(u.country);

return "<div class=\"clc-card\" style=\"background:"+bgColor+";--clc-bg:"+bgColor+";\" onclick=\"viewUserProfile('"+u.username+"','home')\">"
+"<div class=\"clc-avatar\">"+avatarHtml(u.avatarEmoji)+"</div>"
+"<div class=\"clc-username-wrap\">"+(flag ? "<span class=\"clc-flag\">"+flag+"</span>" : "")+"<span class=\"clc-username\">"+u.username+"</span></div>"
+"<div class=\"clc-level\">"+(typeof u.successPct==="number" ? "%"+u.successPct : "–")+"</div>"
+"<button class=\"clc-challenge-btn\" onclick=\"event.stopPropagation();challengeFromProfile('"+u.username+"')\"><span>⚔️</span> Meydan Oku</button>"
+"</div>";

}


function updateHomeClcArrow(){

let scrollEl=document.getElementById("homeClcScroll");
let arrowEl=document.querySelector("#homeClcPanel .clc-scroll-arrow");

if(!scrollEl || !arrowEl)return;

let atEnd=scrollEl.scrollLeft+scrollEl.clientWidth>=scrollEl.scrollWidth-4;

arrowEl.classList.toggle("clc-arrow-hidden",atEnd);

}


/* Panel2 profil resmi animasyonları: ekranda görünen kartlar sırayla, her seferinde rastgele bir animasyon (bir öncekiyle aynı olmaz) */
const CLC_AVATAR_ANIMATIONS=[
// 1 - 360 derece dön
[{transform:"rotate(0deg) scale(1)"},{transform:"rotate(360deg) scale(1.05)"},{transform:"rotate(360deg) scale(1)"}],
// 2 - Küçülüp büyü
[{transform:"scale(1)"},{transform:"scale(.70)"},{transform:"scale(1.18)"},{transform:"scale(1)"}],
// 3 - Kararıp aydınlan
[{transform:"scale(1)",filter:"brightness(1)"},{transform:"scale(.95)",filter:"brightness(.12)"},{transform:"scale(1.05)",filter:"brightness(1.7)"},{transform:"scale(1)",filter:"brightness(1)"}],
// 4 - Sallan
[{transform:"rotate(0deg)"},{transform:"rotate(-12deg)"},{transform:"rotate(12deg)"},{transform:"rotate(-8deg)"},{transform:"rotate(8deg)"},{transform:"rotate(0deg)"}],
// 5 - Nabız
[{transform:"scale(1)"},{transform:"scale(1.13)"},{transform:"scale(1)"},{transform:"scale(1.10)"},{transform:"scale(1)"}],
// 6 - Yukarı çıkıp yerine otur
[{transform:"translateY(0) scale(1)"},{transform:"translateY(-18px) scale(1.05)"},{transform:"translateY(4px) scale(.98)"},{transform:"translateY(0) scale(1)"}],
// 7 - Sağa sola hareket
[{transform:"translateX(0)"},{transform:"translateX(-14px)"},{transform:"translateX(14px)"},{transform:"translateX(-8px)"},{transform:"translateX(0)"}],
// 8 - Parlama
[{transform:"scale(1)",filter:"brightness(1)"},{transform:"scale(1.06)",filter:"brightness(2)"},{transform:"scale(1.02)",filter:"brightness(1.3)"},{transform:"scale(1)",filter:"brightness(1)"}],
// 9 - Dönerek büyü
[{transform:"rotate(0deg) scale(1)"},{transform:"rotate(160deg) scale(.78)"},{transform:"rotate(320deg) scale(1.14)"},{transform:"rotate(360deg) scale(1)"}],
// 10 - Titreşim + büyüme
[{transform:"translate(0,0) scale(1)"},{transform:"translate(-5px,2px) scale(1.05)"},{transform:"translate(5px,-2px) scale(1.08)"},{transform:"translate(-4px,1px) scale(1.04)"},{transform:"translate(0,0) scale(1)"}]
];

let clcReviveLastIndex=-1;
let clcLastAnimation=-1;
let clcReviveTimer=null;
let clcIntroScheduled=false;
let clcIntroDone=false;

function clcScheduleNext(ms){
clearTimeout(clcReviveTimer);
clcReviveTimer=setTimeout(clcReviveNext,ms);
}

// Açılışta (konfeti yağmuru bitmek üzereyken) ilk 3 kartın profil resmi birlikte döner; sadece bir kez
function clcIntroSpin(attempt){

if(clcIntroDone)return;

let scrollEl=document.getElementById("homeClcScroll");
let cards=scrollEl ? Array.prototype.slice.call(scrollEl.querySelectorAll(".clc-card")).slice(0,3) : [];

// Kartlar henüz yüklenmediyse kısa aralıklarla birkaç kez daha dene
if(!cards.length){
if(attempt<6){
setTimeout(function(){ clcIntroSpin(attempt+1); },500);
}
else{
clcIntroDone=true;
clcScheduleNext(10000);
}
return;
}

clcIntroDone=true;

let reduceMotion=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if(!reduceMotion){
cards.forEach(function(card){
let avatar=card.querySelector(".clc-avatar");
if(avatar && avatar.animate)avatar.animate(CLC_AVATAR_ANIMATIONS[0],{duration:800,easing:"ease-in-out"});
});
}

clcLastAnimation=0;
clcReviveLastIndex=cards.length-1;

// Sonrasında 10 sn'de bir rastgele animasyon
clcScheduleNext(10000);

}

function scheduleClcIntro(){
if(clcIntroScheduled)return;
clcIntroScheduled=true;
// Konfeti parçaları 1,8 - 3,2 sn arası düşüyor; 2,6 sn civarı yağmur bitmek üzere
setTimeout(function(){ clcIntroSpin(0); },2600);
}

function clcReviveNext(){

// Varsayılan: 1 sn sonra tekrar dene (ana sayfa kapalıysa, uygulama arka plandaysa vb.)
let nextDelay=1000;

let homeEl=document.getElementById("homeScreen");
let scrollEl=document.getElementById("homeClcScroll");
let reduceMotion=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if(homeEl && homeEl.style.display!=="none" && !document.hidden && scrollEl && !reduceMotion){

let box=scrollEl.getBoundingClientRect();
let cards=Array.prototype.slice.call(scrollEl.querySelectorAll(".clc-card"));

// Sadece ekranda tam görünen kartlar
let visible=[];
cards.forEach(function(card,idx){
let r=card.getBoundingClientRect();
if(r.width>0 && r.left>=box.left-2 && r.right<=box.right+2)visible.push(idx);
});

if(visible.length){

let nextIdx=visible.find(function(idx){ return idx>clcReviveLastIndex; });
if(nextIdx===undefined)nextIdx=visible[0];

let avatar=cards[nextIdx].querySelector(".clc-avatar");

if(avatar && avatar.animate){

let animIndex;
do{
animIndex=Math.floor(Math.random()*CLC_AVATAR_ANIMATIONS.length);
}while(animIndex===clcLastAnimation && CLC_AVATAR_ANIMATIONS.length>1);

clcLastAnimation=animIndex;
clcReviveLastIndex=nextIdx;

avatar.animate(CLC_AVATAR_ANIMATIONS[animIndex],{duration:800,easing:"ease-in-out"});

// Sıradaki kart 10 sn sonra
nextDelay=10000;

}

}

}

clcScheduleNext(nextDelay);

}

// Açılış animasyonu hiç tetiklenmezse (ör. konfeti gösterilmediyse) döngü yine de başlasın
setTimeout(function(){
if(!clcIntroScheduled)clcScheduleNext(0);
},8000);


function homeClcScrollNext(){

let scrollEl=document.getElementById("homeClcScroll");

if(!scrollEl)return;

scrollEl.scrollBy({left:220,behavior:"smooth"});

}


function pauseHomeClcForModal(){}

function resumeHomeClcAfterModal(){}


new MutationObserver(function(){

let el=document.getElementById("randomWaitScreen");
if(el && el.style.display!=="none"){
syncRandomWaitScreenState();
}

}).observe(document.getElementById("randomWaitScreen"),{attributes:true,attributeFilter:["style"]});


function resetRandomModeButton(){

let btn=document.getElementById("randomCetrefilliBtn");

btn.disabled=false;
btn.style.opacity="1";
btn.innerHTML=getRandomModeCardHtml(false);

}


function showRandomWaitingState(){

let btn=document.getElementById("randomCetrefilliBtn");

btn.disabled=true;
btn.style.opacity="0.6";
btn.innerHTML=getRandomModeCardHtml(true);

}


function openChallengeComputer(){

pendingChallenge={opponent:"Bilgisayar",type:"computer"};

hideAllScreens();
document.getElementById("challengeFormatScreen").style.display="flex";

}


let longPressTimer=null;


/* Düellonun sıradaki turunu oynatır (açık olan ve henüz oynamadığım ilk tur) */
function playChallenge(id){
if(waitForDictionary(playChallenge,this,arguments))return;

if(aktifMotor && aktifMotor.oyunId===id && gameActive && !resultRecorded && challengeRoundReady){

hideAllScreens();
document.getElementById("playArea").style.display="block";
document.getElementById("wordGameContent").style.display="block";
document.getElementById("wordNewGameBtn").style.display="none";
return;

}

hideAllScreens();
document.getElementById("playArea").style.display="block";
document.getElementById("wordGameContent").style.display="none";
document.getElementById("loading").style.display="flex";

let kayitli=sunucuDurumu && sunucuDurumu.oyunlar[id];

(kayitli ? Promise.resolve(kayitli) : oyunAyrintisi(id)).then(function(d){

let ben=d.oyuncular.find(function(o){ return o.ben; });
let idx=-1;
for(let i=0;i<d.oyun.acikOyun;i++){
let t=ben.turlar.find(function(x){ return x.idx===i; });
if(!t || !t.bitti){ idx=i; break; }
}

if(idx===-1){
goHome();
return;
}

return duelloTuruHazirla(id,idx).then(function(kalan){

activeChallengeId=id;
activeChallengeSide=null;
activeChallengeGameIndex=idx;
activeChallengeIsComputer=(d.oyun.opponent==="bilgisayar");

newGame({motor:true,yeniTur:(kalan>=120 && aktifMotor.hamleler.length===0),resumeTime:kalan});

});

}).catch(function(e){

showTopNotification(hataMetni(e));
goHome();

});

}


function startNewGameFlow(){

activeChallengeId=null;
activeChallengeIsComputer=false;
activeChallengeSide=null;
activeChallengeGameIndex=null;

hideAllScreens();
document.getElementById("playArea").style.display="block";

newGame();

}


function showChangePasswordForm(){

document.getElementById("currentPassword").value="";
document.getElementById("newPassword").value="";
document.getElementById("newPasswordConfirm").value="";
document.getElementById("changePasswordError").innerHTML="";
document.getElementById("changePasswordError").style.color="";

document.getElementById("changePasswordForm").style.display="block";

}


function hideChangePasswordForm(){

document.getElementById("changePasswordForm").style.display="none";

}


function changePassword(){

let errorEl=document.getElementById("changePasswordError");

let currentPassword=document.getElementById("currentPassword").value;
let newPassword=document.getElementById("newPassword").value;
let newPasswordConfirm=document.getElementById("newPasswordConfirm").value;

if(!currentPassword || !newPassword || !newPasswordConfirm){
errorEl.style.color="";
errorEl.innerHTML="Lütfen tüm alanları doldur.";
return;
}

if(newPassword.length<6){
errorEl.style.color="";
errorEl.innerHTML="Yeni şifre en az 6 karakter olmalı.";
return;
}

if(newPassword!==newPasswordConfirm){
errorEl.style.color="";
errorEl.innerHTML="Yeni şifreler eşleşmiyor.";
return;
}

errorEl.style.color="#27ae60";
errorEl.innerHTML="Güncelleniyor...";

let user=auth.currentUser;
let credential=firebase.auth.EmailAuthProvider.credential(currentUser.email,currentPassword);

withTimeout(user.reauthenticateWithCredential(credential),15000).then(function(){

return user.updatePassword(newPassword);

}).then(function(){

errorEl.style.color="#27ae60";
errorEl.innerHTML="Şifren güncellendi.";

document.getElementById("currentPassword").value="";
document.getElementById("newPassword").value="";
document.getElementById("newPasswordConfirm").value="";

}).catch(function(e){

errorEl.style.color="";
errorEl.innerHTML=firebaseErrorMessage(e);

});

}


function showChangeUsernameForm(){

document.getElementById("newUsername").value="";
document.getElementById("changeUsernameError").innerHTML="";
document.getElementById("changeUsernameError").style.color="";

document.getElementById("changeUsernameForm").style.display="block";

}


function hideChangeUsernameForm(){

document.getElementById("changeUsernameForm").style.display="none";

}


function changeUsername(){

let errorEl=document.getElementById("changeUsernameError");

let newUsername=document.getElementById("newUsername").value.trim().toLowerCase();

if(!newUsername){
errorEl.style.color="";
errorEl.innerHTML="Lütfen bir kullanıcı adı gir.";
return;
}

if(newUsername.length<3){
errorEl.style.color="";
errorEl.innerHTML="Kullanıcı adı en az 3 karakter olmalı.";
return;
}

if(newUsername===currentUser.username){
errorEl.style.color="";
errorEl.innerHTML="Bu zaten mevcut kullanıcı adın.";
return;
}

errorEl.style.color="#27ae60";
errorEl.innerHTML="Kontrol ediliyor...";

sunucu("profil/ad",{username:newUsername}).then(function(v){

currentUser.username=v.username;
document.getElementById("profileUsername").innerHTML=v.username;

errorEl.style.color="#27ae60";
errorEl.innerHTML="Kullanıcı adın güncellendi.";

document.getElementById("newUsername").value="";

}).catch(function(e){

errorEl.style.color="";
errorEl.innerHTML=hataMetni(e);

});

}


function logoutUser(){

auth.signOut().then(function(){

sohbetKapat();
listedenKop();


currentUser=null;
sunucuDurumu=null;

hideAllScreens();

document.getElementById("loginBtn").disabled=false;

screenNavStack=[];

document.getElementById("registerForm").style.display="none";
document.getElementById("loginForm").style.display="block";
document.getElementById("loginEmail").value="";
document.getElementById("loginPassword").value="";
document.getElementById("loginError").innerHTML="";

document.getElementById("authScreen").style.display="block";

}).catch(function(e){

console.error("Çıkış yapılamadı:",e);

});

}


const AVATAR_EMOJI_CHOICES=["👤","😀","😎","🤓","🥳","😺","🐶","🦊","🐼","🐨","🦁","🐯","🐸","🐵","🦄","🐙","🦋","🌟","🔥","⚡","🎮","🎨","🎧","⚽","🏀","🎯","🚀","👑","🍀","🌈","😁","😅","🤩","🥸","🤠","🥷","🧙","🧛","🧟","👻","👽","🤖","🎃","💀","😇","🙃","🤪","😜","🐱","🐭","🐹","🐰","🦝","🐻","🐷","🐮","🐔","🐧","🐦","🦉","🦇","🐺","🦓","🦒","🐘","🦏","🦛","🐴","🐝","🦖","🐬","🐳","🐊","🐢","🦂","🕷️","🦀","🐠","🦈","🍉","🍕","🍔","🌮","🍩","🍿","🎲","🃏","🏆","🥇","🛸","🛹","🎸","🥁","🎬"];

/* Resimli profil simgeleri: dosyalar avatars/ klasöründe (ad.webp).
   Sunucuda "img:ad" olarak kaydedilir. */
const AVATAR_IMAGE_COUNT=97;
const AVATAR_IMAGE_CHOICES=Array.from({length:AVATAR_IMAGE_COUNT},function(_,i){ return "avatar-"+(i+1); });

function avatarHtml(v){

v=v||"👤";

if(typeof v==="string" && v.indexOf("img:")===0){
let name=v.slice(4).replace(/[^a-zA-Z0-9_-]/g,"");
return "<img class=\"av-img\" src=\"avatars/"+name+".webp\" alt=\"\" loading=\"lazy\">";
}

return v;

}

function openAvatarPicker(){

let html="";

html+="<p class=\"screen-title\" style=\"margin-top:0;\">Profil Simgesi Seç</p>";
html+="<div style=\"display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:10px;\">";

AVATAR_IMAGE_CHOICES.forEach(function(name){

html+="<button onclick=\"selectAvatarEmoji('img:"+name+"')\" style=\"background:#f1f2f6;border:0;border-radius:12px;padding:6px;cursor:pointer;aspect-ratio:1;\">"+avatarHtml("img:"+name)+"</button>";

});

AVATAR_EMOJI_CHOICES.forEach(function(emoji){

html+="<button onclick=\"selectAvatarEmoji('"+emoji+"')\" style=\"font-size:28px;background:#f1f2f6;border:0;border-radius:12px;padding:10px 0;cursor:pointer;\">"+emoji+"</button>";

});

html+="</div>";

openDetailModal(html);

}


function selectAvatarEmoji(emoji){

sunucu("profil/avatar",{avatar:emoji}).then(function(){

currentUser.avatarEmoji=emoji;

let profileIconEl=document.getElementById("profileIcon");
if(profileIconEl)profileIconEl.innerHTML=avatarHtml(emoji);

let homeAvatarEl=document.getElementById("homeAvatarIcon");
if(homeAvatarEl)homeAvatarEl.innerHTML=avatarHtml(emoji);

hideDetailModal();

}).catch(function(e){

console.error("Profil simgesi güncellenemedi:",e);

});

}


function showProfile(){

hideAllScreens();
document.getElementById("profileScreen").style.display="block";
document.getElementById("changePasswordForm").style.display="none";

document.getElementById("profileName").innerHTML=currentUser.name;
document.getElementById("profileUsername").innerHTML=currentUser.username;
document.getElementById("profileCountry").innerHTML=currentUser.country ? (countryFlagEmoji(currentUser.country)+" "+getCountryName(currentUser.country)) : "-";
document.getElementById("profileEmail").innerHTML=currentUser.email;
document.getElementById("profileIcon").innerHTML=avatarHtml(currentUser.avatarEmoji);
document.getElementById("profileGreetName").innerHTML=currentUser.username||currentUser.name;

if(currentUser.isGuest){

document.getElementById("profileStatsRealSection").style.display="none";
document.getElementById("profileGuestPrompt").style.display="flex";

}
else{

document.getElementById("profileStatsRealSection").style.display="block";
document.getElementById("profileGuestPrompt").style.display="none";

// İstatistikler sunucudan gelir (bütün oyunlar üzerinden)
let avgWordScore=currentUser.wordScoreCount ? Math.round(currentUser.wordScoreSum/currentUser.wordScoreCount) : 0;
let successPct=currentUser.challengeCount ? Math.round((currentUser.challengeWins/currentUser.challengeCount)*100) : 0;

document.getElementById("profileSuccessPct").innerHTML="%"+successPct;
document.getElementById("profileAvgScoreWord").innerHTML=avgWordScore;
document.getElementById("profileFoundWordsCount").innerHTML=currentUser.foundWordsCount||0;

}

}


function viewUserProfile(username,from){

openDetailModal("<p>Yükleniyor...</p>","profile-modal");

sunucu("kullanici/getir",{username:username}).then(function(v){

let profile=v.kullanici;

let successPct=profile.challengeCount? Math.round((profile.challengeWins/profile.challengeCount)*100) : 0;
let avgScoreWord=profile.wordScoreCount? Math.round(profile.wordScoreSum/profile.wordScoreCount) : 0;

let isFromChallengeList=(from==="home" || from==="challengeList");
let isMe=profile.username===currentUser.username;

// Arkadaşlık düğmesi: arkadaşsa çıkar, istek geldiyse kabul et, istek gönderildiyse bekliyor, yoksa istek gönder
let friendCardHtml="";
if(!isFromChallengeList && !isMe){
let stil="margin-bottom:22px;width:160px;padding:1px 6px;min-height:42px;justify-self:center;justify-content:center;";
if(profile.arkadaslik==="arkadas"){
friendCardHtml="<div class=\"settings-card\" style=\"background:linear-gradient(105deg,#ee483d,#e8342b);"+stil+"\" onclick=\"removeFriend('"+profile.username+"')\"><div class=\"card-icon\" style=\"background:transparent;width:auto;margin-right:3px;\">💔</div><div class=\"card-content\" style=\"flex:none;\"><div class=\"card-title\" style=\"color:#fff;font-size:13px;\">Arkadaşlıktan Çıkar</div></div></div>";
}
else if(profile.arkadaslik==="istek-gonderildi"){
friendCardHtml="<div class=\"already-friend\">⏳ İstek gönderildi</div>";
}
else{
let yazi=profile.arkadaslik==="istek-geldi" ? "İsteği Kabul Et" : "Arkadaş Ekle";
friendCardHtml="<div class=\"settings-card\" style=\"background:linear-gradient(105deg,#35b233,#209c2b);"+stil+"\" onclick=\"addFriend('"+profile.username+"',this)\"><div class=\"card-icon\" style=\"background:transparent;width:auto;margin-right:3px;\">➕</div><div class=\"card-content\" style=\"flex:none;\"><div class=\"card-title\" style=\"color:#fff;font-size:13px;\">"+yazi+"</div></div></div>";
}
}
let hasSecondCard=friendCardHtml!=="";

let countryHtml=profile.country ? ("<div class=\"profile-info-row\"><div class=\"profile-info-icon\" style=\"background:#7c9cf5;\">🌍</div><div class=\"profile-info-label\">Ülke</div><div class=\"profile-info-value\">"+countryFlagEmoji(profile.country)+" "+getCountryName(profile.country)+"</div></div>") : "";

document.getElementById("detailModalContent").innerHTML=
"<div style=\"text-align:center;\">"+
"<div class=\"profile-icon\" style=\"margin:10px auto 8px;width:70px;height:70px;font-size:36px;\">"+avatarHtml(profile.avatar)+"</div>"+
"</div>"+
"<div class=\"profile-info-card\" style=\"margin-top:8px;\">"+
"<div class=\"profile-info-row\"><div class=\"profile-info-icon\" style=\"background:#8b5cf6;\">👤</div><div class=\"profile-info-label\">Kullanıcı Adı</div><div class=\"profile-info-value\">"+profile.username+"</div></div>"+
countryHtml+
"<div class=\"profile-info-row\"><div class=\"profile-info-icon\" style=\"background:#22c55e;\">📈</div><div class=\"profile-info-label\">Başarı Yüzdesi</div><div class=\"profile-info-value\">%"+successPct+"</div></div>"+
"<div class=\"profile-info-row\"><div class=\"profile-info-icon\" style=\"background:#e8342b;\">⭐</div><div class=\"profile-info-label\">Puan Ortalaması</div><div class=\"profile-info-value\">"+avgScoreWord+"</div></div>"+
"<div class=\"profile-info-row\"><div class=\"profile-info-icon\" style=\"background:#eab308;\">🔤</div><div class=\"profile-info-label\">Bulunan Benzersiz Kelime Sayısı</div><div class=\"profile-info-value\">"+(profile.foundWordsCount||0)+"</div></div>"+
"</div>"+
"<div class=\"settings-info-section\" style=\"grid-template-columns:"+(hasSecondCard ? "1fr 1fr" : "1fr")+";margin-top:0;\" onclick=\"event.stopPropagation();\">"+
(isMe ? "" : "<div class=\"friends-card\" style=\"background:#16a34a;margin-bottom:22px;width:160px;padding:1px 6px;min-height:42px;justify-self:center;justify-content:center;padding-right:14px;\" onclick=\"challengeFromProfile('"+profile.username+"','"+(from||"profile")+"')\"><div class=\"card-icon\" style=\"background:transparent;width:auto;margin-right:1px;\">⚔️</div><div class=\"card-content\" style=\"flex:none;\"><div class=\"card-title\" style=\"color:#fff;font-size:13px;\">Meydan Oku</div></div></div>")+
friendCardHtml+
"</div>";

}).catch(function(e){

document.getElementById("detailModalContent").innerHTML="<p>"+hataMetni(e)+"</p>";

});

}


function showFriends(){

setBottomNavActive("profile");

hideAllScreens();
document.getElementById("friendsScreen").style.display="block";

renderFriendsList();

}


function showSettings(){

hideAllScreens();
document.getElementById("settingsScreen").style.display="block";
updateThemeToggleUI(document.body.classList.contains("dark-mode") ? "dark" : "light");

}


function showInfo(){

hideAllScreens();
document.getElementById("infoScreen").style.display="block";

}


/* Arkadaşlar ekranı: gelen istekler (kabul / reddet), arkadaşlar, gönderilen istekler */
function renderFriendsList(){

let list=document.getElementById("friendsList");
list.innerHTML="<p>Yükleniyor...</p>";

sunucu("arkadas/liste").then(function(v){

if(sunucuDurumu)sunucuDurumu.arkadaslik=v;
currentUserFriends=v.arkadaslar.map(function(a){ return a.username; });

let html="";

function kart(a,ek){
let h="<div class=\"oy-card\" style=\"cursor:pointer;\" onclick=\"viewUserProfile('"+a.username+"','friends')\">";
h+="<div class=\"oy-avatar\">"+avatarHtml(a.avatar)+"</div>";
h+="<div class=\"oy-content\">";
h+="<div class=\"oy-card-header\">";
h+="<div class=\"oy-user-info\" style=\"margin-left:5px;margin-top:2px;\">";
h+="<span class=\"oy-username\" style=\"position:relative;top:-1px;\">"+a.username+"</span>";
h+="<div class=\"friend-stats-row\">🏆 %"+a.basari+" <span class=\"friend-stats-sep\">|</span> 📊 <span style=\"position:relative;top:1px;\">"+a.ortalama+"</span></div>";
h+="</div>";
h+=ek||"";
h+="</div>";
h+="</div>";
h+="</div>";
return h;
}

if(v.gelen.length){
html+="<p class=\"screen-title\">Gelen İstekler</p>";
v.gelen.forEach(function(a){
html+=kart(a,"<div class=\"oy-actions\" onclick=\"event.stopPropagation();\"><button class=\"oy-btn-accept\" onclick=\"answerFriendRequest('"+a.username+"',true)\">Kabul</button><button class=\"oy-btn-decline\" onclick=\"answerFriendRequest('"+a.username+"',false)\">Reddet</button></div>");
});
}

if(v.arkadaslar.length){
if(v.gelen.length || v.giden.length)html+="<p class=\"screen-title\">Arkadaşlarım</p>";
v.arkadaslar.forEach(function(a){ html+=kart(a); });
}
else{
html+="<p>Henüz bir arkadaşın yok. Bir oyuncunun profilinden 'Arkadaş Ekle' diyerek istek gönderebilirsin.</p>";
}

if(v.giden.length){
html+="<p class=\"screen-title\">Gönderdiğim İstekler</p>";
v.giden.forEach(function(a){ html+=kart(a,"<div class=\"already-friend\">⏳ Bekliyor</div>"); });
}

list.innerHTML=html;

}).catch(function(e){

list.innerHTML="<p>"+hataMetni(e)+"</p>";

});

}


/* Arkadaşlık isteği gönderir; karşı taraf zaten istek gönderdiyse doğrudan arkadaş olunur */
function addFriend(username,btnEl){

sunucu("arkadas/istek",{username:username}).then(function(v){

if(v.durum==="arkadas" && !currentUserFriends.includes(username))currentUserFriends.push(username);
if(btnEl)btnEl.outerHTML=v.durum==="arkadas" ? "<div class=\"already-friend\">✓ Arkadaşın</div>" : "<div class=\"already-friend\">⏳ İstek gönderildi</div>";

}).catch(function(e){

showTopNotification(hataMetni(e));

});

}


function answerFriendRequest(username,kabul){

sunucu("arkadas/cevap",{username:username,kabul:kabul}).then(function(){

renderFriendsList();

}).catch(function(e){

showTopNotification(hataMetni(e));

});

}


function removeFriend(username){

if(!confirm(username+" adlı kullanıcıyı arkadaş listenden çıkarmak istediğine emin misin?")){
return;
}

let preservedReturn=returnToScreen;

sunucu("arkadas/sil",{username:username}).then(function(){

currentUserFriends=currentUserFriends.filter(function(f){ return f!==username; });
viewUserProfile(username,preservedReturn);

}).catch(function(e){

showTopNotification(hataMetni(e));

});

}


/* ===== DÜELLODAN YENİ TURNUVA OLUŞTURMA ===== */
// Düello olduğu gibi devam eder; ayrıca yeni bir turnuva oluşur.
// Turnuvada başta sadece oluşturan vardır; seçilen arkadaşa ve düellodaki rakibe davet gider.
let pendingDuelTournament={challengeId:null,format:2};


function goToHistoryFromChallengeDone(){

screenNavStack=[{id:"homeScreen",display:"block"}];

suppressScreenPush=true;
showHistory();
suppressScreenPush=false;

}


function showHistory(){

setBottomNavActive("games");

hideAllScreens();
document.getElementById("historyScreen").style.display="block";
document.body.classList.add("home-active");

currentHistoryTab="ongoing";

let track=document.getElementById("historyTabsTrack");
track.classList.remove("animated");
track.style.transform="translateX(0%)";
void track.offsetWidth;
track.classList.add("animated");

document.getElementById("tabOngoingBtn").classList.add("active");
document.getElementById("tabGamesBtn").classList.remove("active");
document.getElementById("tabChallengesBtn").classList.remove("active");

renderOngoingList();
renderHistoryList();
renderChallengesList();

}


let currentHistoryTab="ongoing";

let audioCtx=null;


function stopAllSounds(){

if(audioCtx){
try{
audioCtx.close();
}catch(e){}
audioCtx=null;
}

}


function clearAllConfetti(){

document.querySelectorAll(".mem-confetti").forEach(function(el){
el.remove();
});

}

const NEWGAME_SOUND_DURATION=1550;
const TARGET_ROLL_START_DELAY=1570;

function getAudioCtx(){

if(!audioCtx){
try{
audioCtx=new (window.AudioContext || window.webkitAudioContext)();
}catch(e){
return null;
}
}

if(audioCtx.state==="suspended"){
audioCtx.resume().catch(function(){});
}

return audioCtx;

}


function playTone(freq,duration,type,volume,delay){

let ctx=getAudioCtx();
if(!ctx)return;

try{

let startTime=ctx.currentTime+(delay||0);

let osc=ctx.createOscillator();
let gain=ctx.createGain();

osc.type=type||"sine";
osc.frequency.setValueAtTime(freq,startTime);

gain.gain.setValueAtTime(volume||0.225,startTime);
gain.gain.exponentialRampToValueAtTime(0.001,startTime+duration);

osc.connect(gain);
gain.connect(ctx.destination);

osc.start(startTime);
osc.stop(startTime+duration);

}catch(e){}

}


function playSuccessSound(){

playTone(523.25,0.12,"sine",0.45,0);
playTone(659.25,0.15,"sine",0.45,0.09);

}


function playErrorSound(){

playTone(220,0.13,"triangle",0.42,0);
playTone(150,0.22,"triangle",0.42,0.12);

}


function playAlreadyFoundSound(){

playTone(400,0.09,"triangle",0.3,0);
playTone(400,0.09,"triangle",0.3,0.11);

}


function playWinSound(){

playTone(523.25,0.13,"sine",0.54,0);
playTone(659.25,0.13,"sine",0.54,0.12);
playTone(783.99,0.13,"sine",0.54,0.24);
playTone(1046.5,0.3,"sine",0.54,0.36);

}


function playClickSound(){

playTone(880,0.05,"square",0.36,0);

}


function playClickSoundBack(){

playTone(440,0.06,"sine",0.48,0);

}


function playClickSoundTab(){

playTone(1046.5,0.04,"triangle",0.42,0);

}


function playClickSoundNewgame(){

playTone(392,0.09,"sine",0.12,0);
playTone(523.25,0.09,"sine",0.09,0);
playTone(523.25,0.09,"sine",0.12,0.08);
playTone(659.25,0.09,"sine",0.09,0.08);
playTone(659.25,0.09,"sine",0.12,0.17);
playTone(783.99,0.09,"sine",0.09,0.17);
playTone(523.25,0.08,"sine",0.105,0.27);
playTone(659.25,0.09,"sine",0.12,0.35);
playTone(783.99,0.09,"sine",0.09,0.35);
playTone(783.99,0.09,"sine",0.12,0.43);
playTone(987.77,0.09,"sine",0.09,0.43);
playTone(987.77,0.09,"sine",0.135,0.53);
playTone(1174.66,0.09,"sine",0.105,0.53);
playTone(783.99,0.08,"sine",0.105,0.63);
playTone(880,0.09,"sine",0.12,0.71);
playTone(1046.5,0.09,"sine",0.09,0.71);
playTone(987.77,0.09,"sine",0.12,0.80);
playTone(1174.66,0.09,"sine",0.09,0.80);
playTone(1046.5,0.10,"sine",0.135,0.90);
playTone(1318.51,0.10,"sine",0.105,0.90);
playTone(1174.66,0.09,"sine",0.12,1.01);
playTone(1396.91,0.09,"sine",0.09,1.01);
playTone(1318.51,0.4,"sine",0.195,1.12);
playTone(1567.98,0.4,"sine",0.15,1.12);

}


function computeFinalWordScore(rawScore,achievableCount,extraBonus){

extraBonus=extraBonus||0;

return Math.round(rawScore+extraBonus);

}


function animateFinalWordScoreCountUp(toValue,options){

options=options||{};

let title=options.title!==undefined ? options.title : "PUAN";
let showRating=options.showRating!==undefined ? options.showRating : true;
let screenCheckId=options.screenCheckId;
let callback=options.callback;

if(screenCheckId){
let screenEl=document.getElementById(screenCheckId);
if(!screenEl || screenEl.style.display!=="block" || screenEl.offsetParent===null){
if(callback)callback();
return;
}
}

let bannerEl=document.getElementById("wordScoreBanner");
let bannerTitleEl=document.getElementById("wordScoreBannerTitle");
let bannerValueEl=document.getElementById("wordScoreBannerValue");
let bannerRatingEl=document.getElementById("wordScoreBannerRating");
let wordScoreEl=document.getElementById("wordScoreValue");

bannerTitleEl.innerHTML=title;

let steps=Math.min(50,Math.max(toValue,1));
let duration=1200;
let stepTime=duration/steps;
let count=0;
let lastValue=0;
let ratingInfo=getWordScoreRatingInfo(toValue);
let myScoreToken=gameSessionToken;
let animationComplete=false;

bannerValueEl.innerHTML=0;
bannerRatingEl.innerHTML="";
if(wordScoreEl){
wordScoreEl.innerHTML=0;
}

bannerEl.classList.add("score-visible");

function dismissBanner(){
bannerEl.classList.remove("score-visible");
document.removeEventListener("click",skipOrDismiss,true);
document.removeEventListener("touchstart",skipOrDismiss,true);
}

function pulseBanner(){
bannerEl.classList.remove("banner-pulse");
void bannerEl.offsetWidth;
bannerEl.classList.add("banner-pulse");
}

function finalizeDisplay(){

clearInterval(roll);

bannerValueEl.innerHTML=toValue;
if(wordScoreEl){
wordScoreEl.innerHTML=toValue;
}

if(showRating && ratingInfo.threshold!==null){
bannerRatingEl.innerHTML=ratingInfo.text;
}

playCountTickSound();

animationComplete=true;

setTimeout(function(){
dismissBanner();
},3000);

if(callback)callback();

}

function skipOrDismiss(){

if(!animationComplete){
finalizeDisplay();
}
else{
dismissBanner();
}

}

setTimeout(function(){
document.addEventListener("click",skipOrDismiss,true);
document.addEventListener("touchstart",skipOrDismiss,true);
},50);

let roll=setInterval(function(){

if(myScoreToken!==gameSessionToken){
clearInterval(roll);
clearAllConfetti();
dismissBanner();
return;
}

count++;

let displayValue=count>=steps ? toValue : Math.round((toValue/steps)*count);

bannerValueEl.innerHTML=displayValue;
if(wordScoreEl){
wordScoreEl.innerHTML=displayValue;
}

if(showRating && ratingInfo.threshold!==null && displayValue>=ratingInfo.threshold){
bannerRatingEl.innerHTML=ratingInfo.text;
}

if(checkScoreMilestones(lastValue,displayValue)){
pulseBanner();
}

lastValue=displayValue;

if(count>=steps){

finalizeDisplay();

}
else{

if(count%8===0){
playCountTickSound();
}

}

},stepTime);

}


function getWordScoreRatingInfo(finalValue){

if(finalValue>=900){
return {threshold:900,text:"Mükemmel 🤩"};
}
if(finalValue>=700){
return {threshold:700,text:"Çok iyi 🥳"};
}
if(finalValue>=500){
return {threshold:500,text:"İyi 😊"};
}
if(finalValue>=300){
return {threshold:300,text:"Fena değil 🙂"};
}

return {threshold:null,text:""};

}


function updateWordScoreRating(el,value){

if(value>=1000){
el.innerHTML="Mükemmel 🤩";
}
else if(value>=750){
el.innerHTML="Çok iyi 😄";
}
else if(value>=500){
el.innerHTML="İyi 🙂";
}
else if(value>=300){
el.innerHTML="Eh 😐";
}
else{
el.innerHTML="";
}

}


function checkScoreMilestones(fromValue,toValue){

if(fromValue<900 && toValue>=900){
launchMemConfetti("extra");
return true;
}
else if(fromValue<700 && toValue>=700){
launchMemConfetti("large");
return true;
}
else if(fromValue<500 && toValue>=500){
launchMemConfetti();
return true;
}
else if(fromValue<300 && toValue>=300){
launchMemConfetti("small");
return true;
}

return false;

}


function openDetailModal(html,boxClass){

pauseHomeClcForModal();

let boxEl=document.querySelector("#detailModalOverlay .detail-modal-box");
if(boxEl){
boxEl.classList.remove("profile-modal","challenge-modal");
if(boxClass)boxEl.classList.add(boxClass);
}

let overlayEl=document.getElementById("detailModalOverlay");
let alreadyOpen=overlayEl.style.display==="flex";

document.getElementById("detailModalContent").innerHTML=html;
overlayEl.style.display="flex";

// Pencere zaten açıksa (içerik değişiyorsa) yeni geçmiş kaydı ekleme; aksi halde geri tuşu fazladan kayıtlar yüzünden ekran değiştirebiliyor
if(!alreadyOpen){
window.history.pushState({modal:true},"","");
}

}


function hideDetailModal(){

document.getElementById("detailModalOverlay").style.display="none";
document.getElementById("detailModalContent").innerHTML="";

resumeHomeClcAfterModal();


}


let ignoreNextModalPopstate=false;

function closeDetailModal(){

let hasModalHistory=!!(window.history.state && window.history.state.modal);

// Pencereyi hemen kapat; geçmişteki pencere kaydını da geri al (o geri alma ekran değiştirmesin)
hideDetailModal();

if(hasModalHistory){
ignoreNextModalPopstate=true;
window.history.back();
}

}


function hideScoreBannerNow(){

let bannerEl=document.getElementById("wordScoreBanner");
if(bannerEl){
bannerEl.classList.remove("score-visible");
}

}


function playCountTickSound(){

playTone(720,0.035,"sine",0.21,0);

}


function playChallengeSentSound(){

let ctx=getAudioCtx();
if(!ctx)return;

try{

let startTime=ctx.currentTime;
let duration=0.6;

let bufferSize=Math.floor(ctx.sampleRate*duration);
let buffer=ctx.createBuffer(1,bufferSize,ctx.sampleRate);
let data=buffer.getChannelData(0);

for(let i=0;i<bufferSize;i++){
data[i]=Math.random()*2-1;
}

let noise=ctx.createBufferSource();
noise.buffer=buffer;

let filter=ctx.createBiquadFilter();
filter.type="bandpass";
filter.Q.value=1.1;
filter.frequency.setValueAtTime(3200,startTime);
filter.frequency.exponentialRampToValueAtTime(180,startTime+duration);

let gain=ctx.createGain();
gain.gain.setValueAtTime(0.001,startTime);
gain.gain.exponentialRampToValueAtTime(0.55,startTime+0.09);
gain.gain.exponentialRampToValueAtTime(0.001,startTime+duration);

noise.connect(filter);
filter.connect(gain);
gain.connect(ctx.destination);

noise.start(startTime);
noise.stop(startTime+duration);

}catch(e){}

}


function playWarningSound(){

playTone(330,0.09,"sine",0.24,0);
playTone(247,0.11,"sine",0.24,0.09);

}


function playShuffleSound(){

playTone(300,0.05,"triangle",0.4725,0);
playTone(400,0.05,"triangle",0.4725,0.05);
playTone(500,0.05,"triangle",0.4725,0.10);
playTone(350,0.06,"triangle",0.4725,0.15);

}


function playUndoSound(){

playTone(500,0.08,"sine",0.27,0);
playTone(350,0.09,"sine",0.27,0.06);

}


const HISTORY_TAB_ORDER=["ongoing","games","challenges"];

function switchHistoryTab(tab){

currentHistoryTab=tab;

let ongoingBtn=document.getElementById("tabOngoingBtn");
let gamesBtn=document.getElementById("tabGamesBtn");
let challengesBtn=document.getElementById("tabChallengesBtn");

ongoingBtn.classList.remove("active");
gamesBtn.classList.remove("active");
challengesBtn.classList.remove("active");

let idx=HISTORY_TAB_ORDER.indexOf(tab);

let track=document.getElementById("historyTabsTrack");
track.classList.add("animated");
track.style.transform="translateX(-"+(idx*33.3333)+"%)";

if(tab==="ongoing"){
ongoingBtn.classList.add("active");
}
else if(tab==="games"){
gamesBtn.classList.add("active");
}
else{
challengesBtn.classList.add("active");
}

}


function renderHomeStats(){

let statsRowEl=document.getElementById("homeStatsRow");
let guestRowEl=document.getElementById("homeGuestPromptRow");
let foundWordsEl=document.getElementById("homeFoundWordsCount");

if(foundWordsEl){
foundWordsEl.innerHTML=currentUser.isGuest ? "" : (currentUser.foundWordsCount||0);
}

if(currentUser.isGuest){
statsRowEl.style.display="none";
guestRowEl.style.display="flex";
return;
}

statsRowEl.style.display="flex";
guestRowEl.style.display="none";

let successPct=currentUser.challengeCount? Math.round((currentUser.challengeWins/currentUser.challengeCount)*100) : 0;
let avgScoreWord=currentUser.wordScoreCount? Math.round(currentUser.wordScoreSum/currentUser.wordScoreCount) : 0;

document.getElementById("successPct").innerHTML="%"+successPct;
document.getElementById("avgScoreWord").innerHTML=avgScoreWord;

}


let DICTIONARY = new Set();
let dictionaryReady=false;
let dictionaryPendingAction=null;

/* Kelime listesi: uygulama açıldıktan sonra arka planda yüklenir */
function loadDictionary(){
let s=document.createElement("script");
s.src="words.js";
s.onload=function(){
DICTIONARY=new Set(EMBEDDED_WORDS);
dictionaryReady=true;
document.getElementById("dictionaryLoading").style.display="none";
let action=dictionaryPendingAction;
dictionaryPendingAction=null;
if(action)action();
};
s.onerror=function(){
s.remove();
setTimeout(loadDictionary,3000);
};
document.body.appendChild(s);
}

/* Liste henüz gelmediyse işlemi bekletir, gelince son istenen işlemi çalıştırır */
function waitForDictionary(fn,ctx,args){
if(dictionaryReady)return false;
dictionaryPendingAction=function(){ fn.apply(ctx,args); };
document.getElementById("dictionaryLoading").style.display="flex";
return true;
}

window.addEventListener("load",loadDictionary);

const LETTER_TABLE = {
A:{freq:127,min:1,max:5}, B:{freq:20,min:1,max:4}, C:{freq:16,min:1,max:3}, Ç:{freq:15,min:1,max:4},
D:{freq:22,min:1,max:4}, E:{freq:84,min:1,max:5}, F:{freq:11,min:1,max:3}, G:{freq:13,min:1,max:2},
Ğ:{freq:6,min:1,max:2}, H:{freq:14,min:1,max:3}, I:{freq:42,min:1,max:4}, İ:{freq:73,min:1,max:5},
J:{freq:2,min:1,max:2}, K:{freq:68,min:1,max:5}, L:{freq:67,min:1,max:5}, M:{freq:54,min:1,max:5},
N:{freq:45,min:1,max:5}, O:{freq:26,min:1,max:4}, Ö:{freq:8,min:1,max:3}, P:{freq:15,min:1,max:3},
R:{freq:54,min:1,max:5}, S:{freq:39,min:1,max:5}, Ş:{freq:21,min:1,max:4}, T:{freq:50,min:1,max:5},
U:{freq:31,min:1,max:4}, Ü:{freq:22,min:1,max:3}, V:{freq:12,min:1,max:3}, Y:{freq:22,min:1,max:4},
Z:{freq:22,min:1,max:4}
};
const VOWELS=['A','E','I','İ','O','Ö','U','Ü'];

// Harf seçiminde tarayıcının güçlü üreteci (crypto) kullanılır
function letterRandom(){
let a=new Uint32Array(1);
crypto.getRandomValues(a);
return a[0]/4294967296;
}

function randomLifeForLetter(letter){
let entry=LETTER_TABLE[letter];
if(!entry)return Math.floor(letterRandom()*5)+1;
return Math.floor(letterRandom()*(entry.max-entry.min+1))+entry.min;
}

/* ===== TEST: harf kaydı (geçici) ===== */
let harfLastPick=null;
let harfLog=[];
try{ harfLog=JSON.parse(localStorage.getItem("konfetiHarfLog")||"[]"); }catch(e){ harfLog=[]; }

function harfBoardText(){
return wordTiles.map(function(t){ return t.letter+(t.life===Infinity||t.life==null ? "" : t.life); }).join(" ");
}

function harfDupText(){
let c={};
wordTiles.forEach(function(t){ if(t.letter!=='★')c[t.letter]=(c[t.letter]||0)+1; });
let d=Object.keys(c).filter(function(k){ return c[k]>=2; }).map(function(k){ return k+"×"+c[k]; });
return d.length ? "  ⚠️ TEKRAR: "+d.join(", ") : "";
}

function harfLogAdd(text){
let now=new Date();
let ts=("0"+now.getHours()).slice(-2)+":"+("0"+now.getMinutes()).slice(-2)+":"+("0"+now.getSeconds()).slice(-2);
harfLog.push(ts+"  "+text);
if(harfLog.length>500)harfLog=harfLog.slice(-500);
try{ localStorage.setItem("konfetiHarfLog",JSON.stringify(harfLog)); }catch(e){}
if(document.getElementById("harfLogPanel").style.display!=="none")renderHarfLog();
}

function renderHarfLog(){
let el=document.getElementById("harfLogText");
el.textContent=harfLog.length ? harfLog.join("\n") : "Henüz kayıt yok. Çetrefilli modda bir oyun oyna.";
el.scrollTop=el.scrollHeight;
}

function openHarfLog(){ document.getElementById("harfLogPanel").style.display="block"; renderHarfLog(); }
function closeHarfLog(){ document.getElementById("harfLogPanel").style.display="none"; }
function clearHarfLog(){ harfLog=[]; try{ localStorage.removeItem("konfetiHarfLog"); }catch(e){} renderHarfLog(); }
function copyHarfLog(){
// sondan başlayarak en yeni satırlar; yapıştırma sınırına takılmasın diye en fazla ~18.000 karakter
let lines=[],len=0;
for(let i=harfLog.length-1;i>=0;i--){
if(len+harfLog[i].length+1>18000)break;
lines.unshift(harfLog[i]); len+=harfLog[i].length+1;
}
let txt=lines.join("\n");
if(navigator.clipboard){ navigator.clipboard.writeText(txt).then(function(){ alert("Son "+lines.length+" satır kopyalandı (toplam "+harfLog.length+")."); },function(){ alert("Kopyalanamadı."); }); }
}


function pickWeightedLetter(allowedLetters){
let pool=allowedLetters || Object.keys(LETTER_TABLE);
let totalWeight=0;
pool.forEach(function(l){ totalWeight+=(LETTER_TABLE[l] ? LETTER_TABLE[l].freq : 1); });
let rawRandom=letterRandom();
let r=rawRandom*totalWeight;
harfLastPick={raw:rawRandom,r:r,total:totalWeight,poolSize:pool.length};
for(let i=0;i<pool.length;i++){
let w=(LETTER_TABLE[pool[i]] ? LETTER_TABLE[pool[i]].freq : 1);
if(r<w)return pool[i];
r-=w;
}
return pool[pool.length-1];
}

function shuffleArray(arr){
let a=arr.slice();
for(let i=a.length-1;i>0;i--){
let j=Math.floor(Math.random()*(i+1));
[a[i],a[j]]=[a[j],a[i]];
}
return a;
}

/* Joker her zaman sağ altta (8. yerde) durur. Karoların kendisi yer değiştirir;
   böylece her karonun id'si tahtadaki yerini göstermeye devam eder. */
function ensureJokerAtBottomRight(){

let jokerIdx=wordTiles.findIndex(function(t){ return t.letter==='★'; });

if(jokerIdx===-1 || jokerIdx===7)return null;

let a=wordTiles[7];
wordTiles[7]=wordTiles[jokerIdx];
wordTiles[jokerIdx]=a;

return {idA:wordTiles[7].id,idB:wordTiles[jokerIdx].id};

}


function canFormWord(word,baseLetters,jokerCount){
let counts={};
for(let ch of baseLetters){ counts[ch]=(counts[ch]||0)+1; }
let jokersLeft=(jokerCount===undefined) ? 1 : jokerCount;
let usedJoker=false;
for(let ch of word){
if(counts[ch]>0){ counts[ch]--; }
else if(jokersLeft>0){ jokersLeft--; usedJoker=true; }
else return {ok:false};
}
if(usedJoker && word.length<5)return {ok:false};
return {ok:true,usedJoker:usedJoker};
}

function computeAchievableWords(baseLetters,jokerCount){
let result=[];
DICTIONARY.forEach(w=>{
if(canFormWord(w,baseLetters,jokerCount).ok)result.push(w);
});
return result;
}

function drawWordLetters(){

let allLetters=Object.keys(LETTER_TABLE);
let consonants=allLetters.filter(function(l){ return !VOWELS.includes(l); });

let result=[];

for(let i=0;i<2;i++){
result.push(pickWeightedLetter(VOWELS));
}

for(let i=0;i<3;i++){
result.push(pickWeightedLetter(consonants));
}

for(let i=0;i<2;i++){
result.push(pickWeightedLetter(allLetters));
}

return shuffleArray(result);

}

function generateWordGameData(minAchievable){

let threshold=minAchievable||6;
let tries=0;
let baseLetters,achievable;

do{
baseLetters=drawWordLetters();
achievable=computeAchievableWords(baseLetters);
tries++;
} while(achievable.length<threshold && tries<25);

return {baseLetters:baseLetters,achievable:achievable};

}


let wordBaseLetters=[];
let wordAchievable=[];
let wordShowListBonusGiven=false;
let wordShowListBonus=0;
let wordTiles=[];
let wordSequence=[];
let wordHistory=[];
let wordFound=new Set();
let pendingJokerIndex=null;

function scoreForWord(word,usedJoker){

const POINTS_BY_LENGTH={2:10,3:15,4:25,5:55,6:70,7:85,8:100};

return POINTS_BY_LENGTH[word.length] || 0;

}


function animateLetterRoll(el,finalLetter,duration,callback){

let steps=8;
let stepTime=duration/steps;
let count=0;

let roll=setInterval(function(){

count++;

if(count>=steps){

clearInterval(roll);
el.innerHTML=finalLetter==='★' ? "★" : finalLetter;
if(callback)callback();

}
else{

let randLetter=WORD_ALPHABET[Math.floor(Math.random()*WORD_ALPHABET.length)];
el.innerHTML=randLetter;

}

},stepTime);

}


function animateWordTargetRoll(finalValue,duration,callback){

let targetEl=document.getElementById("wordTarget");
let steps=Math.min(Math.max(finalValue,1),30);
let stepTime=duration/steps;
let count=0;
let lastValue=0;
let myToken=revealSessionToken;

launchMemConfetti("small");

let roll=setInterval(function(){

if(myToken!==revealSessionToken){
clearInterval(roll);
clearAllConfetti();
return;
}

count++;

let current=Math.round((finalValue/steps)*count);

if(count>=steps){

clearInterval(roll);
targetEl.innerHTML=finalValue;
playCountTickSound();
checkWordCountMilestones(lastValue,finalValue);
if(callback)callback();

}
else{

targetEl.innerHTML=current;
playCountTickSound();
checkWordCountMilestones(lastValue,current);
lastValue=current;

}

},stepTime);

}


function checkWordCountMilestones(fromValue,toValue){

if((fromValue<150 && toValue>=150) || (fromValue<300 && toValue>=300)){
launchMemConfetti("small",false);
}

}


function animateWordInitialDeal(tiles,remainingCount,onAllDone){

let area=document.getElementById("wordCards");
area.innerHTML="";

let cardEls=[];

tiles.forEach(function(t,i){

let c=document.createElement("div");

c.className="card card-pop"+(t.letter==='★' ? " joker" : "");
c.dataset.id=t.id;
c.innerHTML="?";

if(t.letter==='★'){
c.onclick=function(){ tapWordTile(i); };
}
else{
c.addEventListener("pointerdown",function(e){ startWordTileDrag(e,i,c); });
}

area.appendChild(c);
cardEls.push(c);

});

cardEls.forEach(function(c,i){

setTimeout(function(){

if(wordRevealToken!==revealSessionToken)return;

animateLetterRoll(c,tiles[i].letter,450,function(){
c.innerHTML+="<span class=\"tile-life"+(tiles[i].life===1 ? " tile-life-critical" : "")+"\">"+tiles[i].life+"</span>";
});

},i*110);

});

setTimeout(function(){

if(wordRevealToken!==revealSessionToken)return;

animateWordTargetRoll(remainingCount,1000,onAllDone);

},TARGET_ROLL_START_DELAY);

}


function startWordTimerTick(){

if(wordRevealToken!==revealSessionToken)return;

challengeRoundReady=true;

clearInterval(timer);

document.getElementById("wordLengthBreakdown").style.visibility="visible";
document.getElementById("wordMessage").style.visibility="visible";
document.getElementById("wordMessage").innerHTML="Harflerden kelime türetiniz!";
renderWordLengthBreakdown();

startWordTargetConfettiRain(wordAchievable.length);

gameEndTime=Date.now()+time*1000;

timer=setInterval(()=>{

if(wordRoundStartToken!==gameSessionToken){
clearInterval(timer);
return;
}

time=Math.max(0,Math.round((gameEndTime-Date.now())/1000));

document.getElementById("wordTimeValue").innerHTML=time;
let timeBarEl=document.getElementById("wordTimeBar");
if(timeBarEl){
let timePct=Math.max(0,Math.min(100,(time/120)*100));
timeBarEl.style.width=timePct+"%";
}

if(time<=90){
document.getElementById("showWordsBtn").style.display="inline-block";
}

if(time<=0 && !resultRecorded){

clearInterval(timer);

let result=(!activeChallengeId && score>=300) ? "win" : "timeout";

let finalScore=computeFinalWordScore(score,wordAchievable.length,wordShowListBonus);

document.getElementById("wordMessage").innerHTML=getWordScoreRatingInfo(finalScore).text || "Oyun bitti";

animateFinalWordScoreCountUp(finalScore,{title:"Oyun Sonlandı 🎉",screenCheckId:"wordGameContent"});

recordGameEnd(result,finalScore);

}

},1000);

}


function startWordRound(presetData){

wordRoundStartToken=gameSessionToken;
wordRevealToken=revealSessionToken;
wordShowListBonusGiven=false;
wordShowListBonus=0;

document.getElementById("wordScoreBanner").classList.remove("score-visible");
document.getElementById("wordLengthBreakdown").style.visibility="hidden";
document.getElementById("wordMessage").style.visibility="hidden";

// Düello turu: tahta ortak kurallardan gelir
if(presetData && presetData.motor){
motorTuruGoster(presetData.yeniTur);
return;
}

let data=presetData ? presetData : generateWordGameData();

wordBaseLetters=data.baseLetters;
wordAchievable=data.achievable;
wordHistory=[];
wordSequence=[];

let restoredProgress=presetData && presetData.progress;

wordFound=restoredProgress ? new Set(restoredProgress.found) : new Set();

document.getElementById("loading").style.display="none";
document.getElementById("wordGameContent").style.display="block";

playClickSoundNewgame();

let inManagedContext=!!activeChallengeId;
document.getElementById("wordNewGameBtn").style.display=inManagedContext ? "none" : "flex";

if(restoredProgress){

wordFound=new Set(restoredProgress.found);
wordTiles=restoredProgress.tiles.map(function(t,i){
let letter=(typeof t==="string") ? t : t.letter;
let life=(typeof t==="string") ? (letter==='★' ? 9 : randomLifeForLetter(letter)) : t.life;
return {letter:letter,used:false,id:i,life:life};
});
score=restoredProgress.score || 0;

harfLogAdd("──── KAYITTAN DEVAM ────");
harfLogAdd("Yüklenen tahta: "+harfBoardText()+harfDupText());

// Çetrefilli'de tahta oyun içinde değiştiği için kelime listesi başlangıç harflerine değil, güncel tahtaya göre hesaplanır
{
wordBaseLetters=wordTiles.filter(function(t){ return t.letter!=='★'; }).map(function(t){ return t.letter; });
let restoredJokerCount=wordTiles.filter(function(t){ return t.letter==='★'; }).length;
let restoredAchievable=computeAchievableWords(wordBaseLetters,restoredJokerCount);
wordAchievable=Array.from(new Set([...restoredAchievable,...wordFound]));
}

renderWordCards();
updateWordTarget();

document.getElementById("wordScoreValue").innerHTML=score;
document.getElementById("wordMessage").innerHTML="Harflerden kelime türetiniz!";

startWordTimerTick();

}
else{

wordFound=new Set();

let order=shuffleArray([...wordBaseLetters,'★']);
wordTiles=order.map((l,i)=>({letter:l,used:false,id:i,life:(l==='★' ? 9 : randomLifeForLetter(l))}));
ensureJokerAtBottomRight();

harfLogAdd("════ YENİ TUR"+(activeChallengeId ? " (düello)" : "")+" ════");
harfLogAdd("Başlangıç tahtası: "+harfBoardText()+harfDupText());

animateWordInitialDeal(wordTiles,wordAchievable.length,function(){

startWordTimerTick();

});

}

}


let wordDragSrcIndex=null;
let wordDragMoved=false;

function renderWordCards(){

let area=document.getElementById("wordCards");
area.innerHTML="";

wordTiles.forEach((t,i)=>{

let c=document.createElement("div");

c.className="card"+(t.letter==='★' ? " joker" : "")+(t.used ? " used" : "");
c.dataset.id=t.id;
// Turnuvada taş sunucudan henüz gelmediyse karo bir an boş görünür
c.innerHTML=(t.letter===null ? "·" : (t.letter==='★' ? "★" : t.letter))+"<span class=\"tile-life"+(t.life===1 ? " tile-life-critical" : "")+"\">"+(t.letter===null ? "" : t.life)+"</span>";

if(t.letter==='★'){
c.onclick=function(){ tapWordTile(i); };
}
else{
c.addEventListener("pointerdown",function(e){ startWordTileDrag(e,i,c); });
}

area.appendChild(c);

});

}


function startWordTileDrag(e,index,el){

if(resultRecorded)return;

wordDragSrcIndex=index;
wordDragMoved=false;

let startX=e.clientX;
let startY=e.clientY;

let canDrag=!wordTiles[index].used && wordTiles[index].letter!=='★';
let hoverEl=null;

if(canDrag){
el.setPointerCapture(e.pointerId);
el.style.zIndex=50;
}

function clearHover(){

if(hoverEl){
hoverEl.classList.remove("drag-hover");
hoverEl=null;
}

}

function onMove(ev){

return;

}

function onUp(ev){

el.removeEventListener("pointermove",onMove);
el.removeEventListener("pointerup",onUp);
el.removeEventListener("pointercancel",onCancel);

clearHover();

if(canDrag){

el.style.transition="";
el.style.transform="";
el.style.zIndex="";

}

tapWordTile(index);

wordDragSrcIndex=null;
wordDragMoved=false;

}

function onCancel(){

el.removeEventListener("pointermove",onMove);
el.removeEventListener("pointerup",onUp);
el.removeEventListener("pointercancel",onCancel);

clearHover();

if(canDrag){
el.style.transition="";
el.style.transform="";
el.style.zIndex="";
el.classList.remove("tile-swap-color");
}

wordDragSrcIndex=null;
wordDragMoved=false;

}

el.addEventListener("pointermove",onMove);
el.addEventListener("pointerup",onUp);
el.addEventListener("pointercancel",onCancel);

}


function findWordTileIndexAtPoint(x,y,excludeIndex){

let cards=document.querySelectorAll("#wordCards .card");

for(let i=0;i<cards.length;i++){

if(i===excludeIndex)continue;

let rect=cards[i].getBoundingClientRect();

if(x>=rect.left && x<=rect.right && y>=rect.top && y<=rect.bottom){
return i;
}

}

return null;

}


function updateWordTarget(){

let remaining=wordAchievable.length-wordFound.size;

document.getElementById("wordTarget").innerHTML=remaining;

let targetBarEl=document.getElementById("wordTargetBar");
if(targetBarEl){
let pct=wordAchievable.length? Math.max(0,Math.min(100,(remaining/wordAchievable.length)*100)) : 100;
targetBarEl.style.width=pct+"%";
}

let breakdownEl=document.getElementById("wordLengthBreakdown");
if(breakdownEl.style.visibility==="visible"){
renderWordLengthBreakdown();
}

}


function toggleWordLengthBreakdown(){

let el=document.getElementById("wordLengthBreakdown");

if(el.style.display==="block"){
el.style.display="none";
}
else{
el.style.display="block";
renderWordLengthBreakdown();
}

}


function flashWordLengthLine(length){

let line=document.querySelector('#wordLengthBreakdown .word-length-line[data-length="'+length+'"]');

if(!line)return;

line.classList.add("flash-found");

setTimeout(function(){
line.classList.remove("flash-found");
},450);

}


function triggerWordScoreEmojiBurst(wordLength){

let el=document.getElementById("wordScoreEmoji");
if(!el)return;

let scale=1.2+Math.max(0,wordLength-2)*0.15;

el.style.setProperty("--burst-scale",scale);

el.classList.remove("bursting");
void el.offsetWidth;
el.classList.add("bursting");

setTimeout(function(){
scatterFromScoreEmoji(scale);
},200);

}


function scatterFromScoreEmoji(scale){

let el=document.getElementById("wordScoreEmoji");
if(!el)return;

let rect=el.getBoundingClientRect();
let cx=rect.left+rect.width/2;
let cy=rect.top+rect.height/2;

let colors=["#e84118","#44bd32","#0984e3","#e67e22","#8e44ad","#0097e6"];
let count=Math.round(14+scale*8);

for(let i=0;i<count;i++){

let piece=document.createElement("div");
piece.className="mem-confetti scatter-burst";

piece.style.top=cy+"px";
piece.style.left=cx+"px";
piece.style.background=colors[Math.floor(Math.random()*colors.length)];
piece.style.width="9px";
piece.style.height="9px";
piece.style.borderRadius=Math.random()>0.5 ? "50%" : "2px";
piece.style.boxShadow="0 1px 3px rgba(0,0,0,0.35)";

let baseAngle=-Math.PI/4;
let spread=Math.PI/2.2;
let angle=baseAngle+(Math.random()-0.5)*spread;
let riseDistance=(40+Math.random()*50)*scale;

let peakX=Math.cos(angle)*riseDistance;
let peakY=Math.sin(angle)*riseDistance;

let fallDistance=(50+Math.random()*40)*scale;
let endX=peakX+(Math.random()-0.5)*30;
let endY=peakY+fallDistance;

piece.style.setProperty("--peak-x",peakX+"px");
piece.style.setProperty("--peak-y",peakY+"px");
piece.style.setProperty("--end-x",endX+"px");
piece.style.setProperty("--end-y",endY+"px");
piece.style.setProperty("--spin",(Math.random()>0.5?360:-360)+"deg");

document.body.appendChild(piece);

setTimeout(function(){ piece.remove(); },1450);

}

}


function renderWordLengthBreakdown(){

let el=document.getElementById("wordLengthBreakdown");

let totalCounts={};

wordAchievable.forEach(function(w){
totalCounts[w.length]=(totalCounts[w.length]||0)+1;
});

let remainingCounts={};

wordAchievable.forEach(function(w){
if(!wordFound.has(w)){
remainingCounts[w.length]=(remainingCounts[w.length]||0)+1;
}
});

let lengths=Object.keys(totalCounts).map(Number).sort(function(a,b){ return b-a; });

if(lengths.length===0){

el.innerHTML="Kelime yok!";

}
else{

el.innerHTML=lengths.map(function(len){
let count=remainingCounts[len]||0;
return "<div class=\"dist-row word-length-line\" data-length=\""+len+"\"><span class=\"label\">"+len+" harfli</span><span class=\"arrow\">→</span><span class=\"count\">"+count+" adet</span></div>";
}).join("");

}

}


function positionWordLengthBreakdown(){

if(wordBreakdownDragged)return;

let el=document.getElementById("wordLengthBreakdown");
let container=document.getElementById("wordGameContent");
let cardsEl=document.getElementById("wordCards");
let targetEl=document.getElementById("wordTarget");
let operationEl=document.getElementById("wordOperation");

if(!cardsEl || !targetEl || !operationEl)return;

let containerRect=container.getBoundingClientRect();
let cardsRect=cardsEl.getBoundingClientRect();
let targetRect=targetEl.getBoundingClientRect();
let operationRect=operationEl.getBoundingClientRect();

let rightOffset=containerRect.right-cardsRect.right;

let gapTop=targetRect.bottom-containerRect.top-4;
let gapBottom=operationRect.top-containerRect.top-3;
let gapHeight=gapBottom-gapTop;

let elHeight=el.getBoundingClientRect().height;

let topPos=gapTop+Math.max(0,(gapHeight-elHeight)/2);

el.style.right=(rightOffset/uiK)+"px";
el.style.top=(topPos/uiK)+"px";

}


let wordBreakdownDragged=false;

function initWordBreakdownDrag(){

let el=document.getElementById("wordLengthBreakdown");
if(!el || el.dataset.dragInit)return;
el.dataset.dragInit="1";

let dragging=false;
let startX=0,startY=0;
let startLeft=0,startTop=0;

el.addEventListener("pointerdown",function(e){

dragging=true;

let rect=el.getBoundingClientRect();
let containerRect=document.getElementById("wordGameContent").getBoundingClientRect();

startX=e.clientX;
startY=e.clientY;
startLeft=rect.left-containerRect.left;
startTop=rect.top-containerRect.top;

el.setPointerCapture(e.pointerId);

});

el.addEventListener("pointermove",function(e){

if(!dragging)return;

let dx=e.clientX-startX;
let dy=e.clientY-startY;

if(Math.abs(dx)>3 || Math.abs(dy)>3){
wordBreakdownDragged=true;
}

if(!wordBreakdownDragged)return;

el.style.left=((startLeft+dx)/uiK)+"px";
el.style.top=((startTop+dy)/uiK)+"px";
el.style.right="auto";

});

el.addEventListener("pointerup",function(e){
dragging=false;
});

el.addEventListener("pointercancel",function(e){
dragging=false;
});

}


function wordSaveState(){

wordHistory.push(JSON.stringify({sequence:wordSequence,tilesUsed:wordTiles.map(t=>t.used)}));

}


function tapWordTile(i){

// Turnuvada taşı henüz gelmemiş karo seçilemez
if(resultRecorded || wordTiles[i].letter===null)return;

if(wordTiles[i].used){

wordTiles[i].used=false;
wordSequence=wordSequence.filter(function(s){ return s.index!==i; });
renderWordCards();
updateWordOperationText();
return;

}

if(wordTiles[i].letter==='★'){
pendingJokerIndex=i;
openJokerKeyboard();
return;
}

wordTiles[i].used=true;
wordSequence.push({index:i,value:wordTiles[i].letter,isJoker:false});
renderWordCards();
updateWordOperationText();

}

const WORD_ALPHABET=['A','B','C','Ç','D','E','F','G','Ğ','H','I','İ','J','K','L','M','N','O','Ö','P','R','S','Ş','T','U','Ü','V','Y','Z'];

function cancelJokerPick(){

document.getElementById("jokerModal").style.display="none";
pendingJokerIndex=null;

}


function openJokerKeyboard(){

let kb=document.getElementById("miniKeyboard");
kb.innerHTML="";

WORD_ALPHABET.forEach(letter=>{

let b=document.createElement("button");
b.className="mini-key";
b.innerHTML=letter;
b.onclick=()=>pickJokerLetter(letter);
kb.appendChild(b);

});

document.getElementById("jokerModal").style.display="flex";

}

function pickJokerLetter(letter){

wordTiles[pendingJokerIndex].used=true;
wordSequence.push({index:pendingJokerIndex,value:letter,isJoker:true});
document.getElementById("jokerModal").style.display="none";
renderWordCards();
updateWordOperationText();
pendingJokerIndex=null;

}

function updateWordOperationText(){

let box=document.getElementById("wordOperation");

if(wordSequence.length===0){
box.innerHTML="Harf seçiniz";
return;
}

box.innerHTML=wordSequence.map(s=>{
return s.isJoker ? "<span class=\"joker-letter\">"+s.value+"</span>" : s.value;
}).join("");

}

function wordUndo(){

if(wordSequence.length===0){
playWarningSound();
return;
}

playUndoSound();

wordSequence=[];
wordTiles.forEach(t=>t.used=false);
renderWordCards();
updateWordOperationText();

}

function clearWordSequence(){

wordSequence=[];
wordTiles.forEach(t=>t.used=false);
renderWordCards();
updateWordOperationText();

}

function shuffleWordTiles(){

if(resultRecorded)return;

playShuffleSound();

let oldRects={};
document.querySelectorAll("#wordCards .card").forEach(el=>{
oldRects[el.dataset.id]=el.getBoundingClientRect();
});

wordSequence=[];
wordHistory=[];
wordTiles.forEach(t=>t.used=false);
wordTiles=shuffleArray(wordTiles);
ensureJokerAtBottomRight();
renderWordCards();
updateWordOperationText();

document.querySelectorAll("#wordCards .card").forEach(el=>{

let oldRect=oldRects[el.dataset.id];
if(!oldRect)return;

let newRect=el.getBoundingClientRect();
let dx=oldRect.left-newRect.left;
let dy=oldRect.top-newRect.top;

el.style.setProperty("--dx",(dx/uiK)+"px");
el.style.setProperty("--dy",(dy/uiK)+"px");
el.classList.add("hop");

setTimeout(()=>{
el.classList.remove("hop");
el.style.removeProperty("--dx");
el.style.removeProperty("--dy");
},450);

});

}

function flashWordCards(indices,className,duration,stagger){

stagger=stagger || 0;

let cardEls=document.querySelectorAll("#wordCards .card");

indices.forEach((i,order)=>{

let el=cardEls[i];
if(!el)return;

let delay=order*stagger;

setTimeout(()=>{
if(!el)return;
el.classList.add(className);
},delay);

});

}

function flashWordOperation(className,duration){

let opBox=document.getElementById("wordOperation");
opBox.classList.add(className);

setTimeout(()=>opBox.classList.remove(className),duration);

}

function bumpWordScore(){

let el=document.getElementById("wordScoreValue");
el.classList.remove("score-bump");
void el.offsetWidth;
el.classList.add("score-bump");

}

function showWordFloatingPoints(pts){

let container=document.getElementById("wordScoreItem");
if(!container)return;

let el=document.createElement("div");
el.className="floatpoints";
el.innerHTML="+"+pts;
container.appendChild(el);

setTimeout(()=>el.remove(),1000);

}

function spawnWordConfetti(count){

let container=document.querySelector(".game");
if(!container)return;

for(let i=0;i<count;i++){

let el=document.createElement("div");
el.className="confetti-piece";
el.innerHTML="🎉";
el.style.left=(Math.random()*70+10)+"%";
el.style.animationDelay=(Math.random()*0.25)+"s";
container.appendChild(el);

setTimeout(()=>el.remove(),1600);

}

}

function showWordsList(){

if(!wordShowListBonusGiven){

wordShowListBonusGiven=true;
wordShowListBonus=2*time;

}

let remaining=wordAchievable.filter(function(w){ return !wordFound.has(w); });

remaining.sort(function(a,b){ return b.length-a.length; });

let foundList=Array.from(wordFound);
foundList.sort(function(a,b){ return b.length-a.length; });

let box=document.getElementById("wordsBox");

let html="";

if(remaining.length===0){
html+="Zaten tüm kelimeleri buldun!";
}
else{
html+="<b>Bulunabilecek kelimeler:</b><br>"+remaining.join(", ");
}

if(foundList.length>0){
html+="<br><br><b>Bulunan kelimeler:</b><br>"+foundList.join(", ");
}

box.innerHTML=html;

if(!resultRecorded){

clearInterval(timer);

time=0;

document.getElementById("wordTimeValue").innerHTML=0;
document.getElementById("wordTimeBar").style.width="0%";

let result=(!activeChallengeId && score>=300) ? "win" : "timeout";

let finalScore=computeFinalWordScore(score,wordAchievable.length,wordShowListBonus);

document.getElementById("wordMessage").innerHTML=getWordScoreRatingInfo(finalScore).text || "Oyun bitti";

animateFinalWordScoreCountUp(finalScore,{title:"Oyun Sonlandı 🎉",screenCheckId:"wordGameContent"});

recordGameEnd(result,finalScore);

}

document.getElementById("showWordsBtn").style.display="none";

}


function checkWord(){

if(resultRecorded)return;

// Sıradaki taşlar henüz hesaplanmadıysa bir an beklenir
if(aktifMotor && !aktifMotor.sira.yeterli()){
aktifMotor.sira.hazirla(8).then(checkWord);
return;
}

if(wordSequence.length===0){
playWarningSound();
return;
}

let guess=wordSequence.map(s=>s.value).join("");
let usedJoker=wordSequence.some(s=>s.isJoker);
let usedIndices=wordSequence.map(s=>s.index);

if(usedJoker && guess.length<5){
document.getElementById("wordMessage").innerHTML="Joker sadece 5 harf ve üzeri kelimelerde kullanılabilir.";
playErrorSound();
flashWordCards(usedIndices,"error",250);
flashWordOperation("error",250);
wordSequence=[];
wordTiles.forEach(t=>t.used=false);
setTimeout(function(){ renderWordCards(); updateWordOperationText(); },250);
return;
}

if(wordFound.has(guess)){
document.getElementById("wordMessage").innerHTML=guess+" zaten bulundu.";
playAlreadyFoundSound();
flashWordCards(usedIndices,"already-found",250);
flashWordOperation("already-found",250);
wordSequence=[];
wordTiles.forEach(t=>t.used=false);
setTimeout(function(){ renderWordCards(); updateWordOperationText(); },250);
return;
}

if(DICTIONARY.has(guess)){

wordFound.add(guess);
let pts=scoreForWord(guess,usedJoker);
score+=pts;
document.getElementById("wordScoreValue").innerHTML=score;
bumpWordScore();
showWordFloatingPoints(pts);
document.getElementById("wordMessage").innerHTML="🎉 "+guess+" buldun! +"+pts+" puan";
playSuccessSound();
flashWordCards(usedIndices,"success",256,44);
flashWordOperation("success",400);
updateWordTarget();
flashWordLengthLine(guess.length);
triggerWordScoreEmojiBurst(guess.length);

if(guess.length>=6){
spawnWordConfetti(10);
}

if(!(aktifMotor && aktifMotor.sunucuda) && wordAchievable.length && wordFound.size>=wordAchievable.length && !resultRecorded){

clearInterval(timer);

score+=1500;

let finalScore=computeFinalWordScore(score,wordAchievable.length,wordShowListBonus);

document.getElementById("wordMessage").innerHTML=getWordScoreRatingInfo(finalScore).text || "Oyun bitti";

playWinSound();

animateFinalWordScoreCountUp(finalScore,{title:"Oyun Sonlandı 🎉",screenCheckId:"wordGameContent"});

recordGameEnd("win",finalScore);

}

harfLogAdd("Kelime: "+guess);

let replacedIndices=[];
let decreasedIds=[];

if(aktifMotor){

decreasedIds=usedIndices.map(function(idx){ return wordTiles[idx].id; });
replacedIndices=motorKelimeYaz()||[];

wordBaseLetters=wordTiles.filter(function(t){ return t.letter!=='★'; }).map(function(t){ return t.letter; });
let motorJoker=wordTiles.filter(function(t){ return t.letter==='★'; }).length;
wordAchievable=Array.from(new Set([...computeAchievableWords(wordBaseLetters,motorJoker),...wordFound]));
updateWordTarget();

}
else usedIndices.forEach(function(idx){

let tile=wordTiles[idx];

tile.life--;

decreasedIds.push(tile.id);

if(tile.life<=0){

let otherLetters=wordTiles.filter(function(t,tIdx){ return tIdx!==idx && t.letter!=='★'; }).map(function(t){ return t.letter; });
let vowelsAfterRemoval=otherLetters.filter(function(l){ return VOWELS.includes(l); }).length;
let consonantsAfterRemoval=otherLetters.filter(function(l){ return !VOWELS.includes(l); }).length;

let jokerAlreadyExists=wordTiles.some(function(t,tIdx){ return t.letter==='★' && tIdx!==idx; });

let newLetter;
let harfReason;
let oldLetterForLog=tile.letter;
harfLastPick=null;

if(vowelsAfterRemoval<2){
newLetter=pickWeightedLetter(VOWELS);
harfReason="sesli zorunlu";
}
else if(consonantsAfterRemoval<3){
newLetter=pickWeightedLetter(Object.keys(LETTER_TABLE).filter(function(l){ return !VOWELS.includes(l); }));
harfReason="sessiz zorunlu";
}
else if(!jokerAlreadyExists && letterRandom()<0.15){
newLetter='★';
harfReason="joker";
}
else{
newLetter=pickWeightedLetter(Object.keys(LETTER_TABLE));
harfReason="serbest";
}

tile.letter=newLetter;
tile.life=(newLetter==='★') ? 9 : randomLifeForLetter(newLetter);

harfLogAdd("   "+oldLetterForLog+" bitti → "+newLetter+tile.life+"  ["+harfReason+(harfLastPick ? ", sayı "+harfLastPick.raw.toFixed(4)+", r "+harfLastPick.r.toFixed(2)+"/"+harfLastPick.total : "")+"]");

replacedIndices.push(tile.id);

}

});

if(replacedIndices.length>0){

let swapInfo=ensureJokerAtBottomRight();
if(swapInfo){
replacedIndices.push(swapInfo.idA,swapInfo.idB);
}

wordBaseLetters=wordTiles.filter(function(t){ return t.letter!=='★'; }).map(function(t){ return t.letter; });
let currentJokerCount=wordTiles.filter(function(t){ return t.letter==='★'; }).length;
let recomputed=computeAchievableWords(wordBaseLetters,currentJokerCount);
wordAchievable=Array.from(new Set([...recomputed,...wordFound]));
updateWordTarget();

}

harfLogAdd("   Tahta: "+harfBoardText()+harfDupText());

wordSequence=[];
wordTiles.forEach(t=>t.used=false);
setTimeout(function(){

renderWordCards();
updateWordOperationText();

replacedIndices.forEach(function(id){
let el=document.querySelector('#wordCards .card[data-id="'+id+'"]');
if(el)el.classList.add("new-letter-pop");
});

decreasedIds.forEach(function(id){
if(replacedIndices.includes(id))return;
let el=document.querySelector('#wordCards .card[data-id="'+id+'"] .tile-life');
if(el)el.classList.add("tile-life-drop");
});

},usedIndices.length*44+304);

}
else{

document.getElementById("wordMessage").innerHTML=guess+" geçerli bir kelime değil.";
playErrorSound();
flashWordCards(usedIndices,"error",250);
flashWordOperation("error",250);
wordSequence=[];
wordTiles.forEach(t=>t.used=false);
setTimeout(function(){ renderWordCards(); updateWordOperationText(); },250);

}

}


let wordConfettiRainInterval=null;


function startWordTargetConfettiRain(achievableCount){

stopWordTargetConfettiRain();

let piecesPerTick;

if(achievableCount<50){
piecesPerTick=2;
}
else if(achievableCount<100){
piecesPerTick=4;
}
else if(achievableCount<150){
piecesPerTick=6;
}
else if(achievableCount<200){
piecesPerTick=8;
}
else if(achievableCount<300){
piecesPerTick=11;
}
else{
piecesPerTick=15;
}

wordConfettiRainInterval=setInterval(function(){

if(resultRecorded){
stopWordTargetConfettiRain();
return;
}

let screenEl=document.getElementById("wordGameContent");
if(!screenEl || screenEl.style.display!=="block" || screenEl.offsetParent===null){
stopWordTargetConfettiRain();
return;
}

launchLocalConfettiLight("wordTarget",piecesPerTick);

},10000);

}


function stopWordTargetConfettiRain(){

if(wordConfettiRainInterval){
clearInterval(wordConfettiRainInterval);
wordConfettiRainInterval=null;
}

}


function launchLocalConfettiLight(elementId,pieceCount,options){

options=options||{};

let el=document.getElementById(elementId);
if(!el)return;

let rect=el.getBoundingClientRect();
let colors=["#e84118","#44bd32","#0984e3","#e67e22","#8e44ad","#0097e6"];

let widthScale=options.widthScale!==undefined ? options.widthScale : 1;
let usableWidth=rect.width*widthScale;
let leftOffset=rect.left+(rect.width-usableWidth)/2;

let minFall=options.minFall!==undefined ? options.minFall : 90;
let fallRange=options.fallRange!==undefined ? options.fallRange : 50;

for(let i=0;i<pieceCount;i++){

let c=document.createElement("div");
c.className="mem-confetti";

let color=colors[Math.floor(Math.random()*colors.length)];
c.style.background=color;

let startX=leftOffset+Math.random()*usableWidth;
let yOffset=options.yOffset!==undefined ? options.yOffset : 0;
let startY=rect.top-15-Math.random()*20+yOffset;

c.style.left=startX+"px";
c.style.top=startY+"px";

let fallDistance=minFall+Math.random()*fallRange;
let duration=2.0+Math.random()*0.3;

c.style.animationDuration=duration+"s";
c.style.setProperty("--fall",fallDistance+"px");
c.style.setProperty("--spin",(Math.random()>0.5?720:-720)+"deg");
c.style.borderRadius=Math.random()>0.5?"50%":"2px";
c.style.width="5px";
c.style.height="8px";
c.style.opacity="0.65";

document.body.appendChild(c);

setTimeout(function(){ c.remove(); },duration*1000+100);

}

}


function launchMemConfetti(size,shake){

shake=shake!==false;

let colors=["#e84118","#44bd32","#0984e3","#e67e22","#8e44ad","#0097e6"];
let count=size==="small" ? 35 : (size==="large" ? 90 : (size==="extra" ? 120 : 60));
let quick=size==="small";

for(let i=0;i<count;i++){

let c=document.createElement("div");
c.className="mem-confetti";

let color=colors[Math.floor(Math.random()*colors.length)];
c.style.background=color;
c.style.left=Math.random()*100+"vw";

let duration=quick ? (0.9+Math.random()*0.5) : (1.8+Math.random()*1.4);
c.style.animationDuration=duration+"s";
c.style.setProperty("--fall",(window.innerHeight+40)+"px");
c.style.setProperty("--spin",(Math.random()>0.5?720:-720)+"deg");

c.style.borderRadius=Math.random()>0.5?"50%":"2px";

if(size==="extra"){
c.style.width="10px";
c.style.height="16px";
}
else if(quick){
c.style.width="7px";
c.style.height="11px";
}

document.body.appendChild(c);

setTimeout(function(){ c.remove(); },duration*1000+100);

}

if(shake){
document.querySelector(".game").classList.remove("mem-win-shake");
void document.querySelector(".game").offsetWidth;
document.querySelector(".game").classList.add("mem-win-shake");
}

}


let userDocUnsubscribe=null;
let challengeSignalVersions={};


let gameSessionToken=0;
let challengeRoundReady=false;
let revealSessionToken=0;
let wordRoundStartToken=null;
let wordRevealToken=null;


function newGame(presetData){
if(waitForDictionary(newGame,this,arguments))return;

challengeRoundReady=false;

stopWordTargetConfettiRain();
stopAllSounds();
clearAllConfetti();

let existingBreakdown=document.getElementById("wordLengthBreakdown");
if(existingBreakdown)existingBreakdown.style.visibility="hidden";

let existingMessage=document.getElementById("wordMessage");
if(existingMessage)existingMessage.style.visibility="hidden";

gameSessionToken++;
revealSessionToken++;
let mySessionToken=gameSessionToken;

clearInterval(timer);

time=(presetData && presetData.resumeTime) ? presetData.resumeTime : 120;
score=0;
resultRecorded=false;
gameActive=true;

document.getElementById("wordGameContent").style.display="none";
document.getElementById("loading").style.display="flex";

document.getElementById("wordMessage").innerHTML="";
document.getElementById("wordOperation").innerHTML="Harf seçiniz";
document.getElementById("wordTarget").innerHTML="--";
document.getElementById("wordTargetBar").style.width="100%";
document.getElementById("wordScoreValue").innerHTML=0;
document.getElementById("wordTimeValue").innerHTML=120;
document.getElementById("wordTimeBar").style.width="100%";
document.getElementById("wordCards").innerHTML="";
document.getElementById("showWordsBtn").style.display="none";
document.getElementById("wordsBox").innerHTML="";

setTimeout(()=>{

if(mySessionToken!==gameSessionToken)return;

startWordRound(presetData);

},600);

}


document.addEventListener("visibilitychange",function(){


if(document.visibilityState==="visible" && gameActive && !resultRecorded && gameEndTime){

time=Math.max(0,Math.round((gameEndTime-Date.now())/1000));

document.getElementById("wordTimeValue").innerHTML=time;
let timeBarEl=document.getElementById("wordTimeBar");
if(timeBarEl){
let timePct=Math.max(0,Math.min(100,(time/120)*100));
timeBarEl.style.width=timePct+"%";
}

if(time<=90){
document.getElementById("showWordsBtn").style.display="inline-block";
}

if(time<=0){

if(wordRevealToken!==revealSessionToken){
clearInterval(timer);
return;
}

clearInterval(timer);

let result=(!activeChallengeId && score>=300) ? "win" : "timeout";

let finalScore=computeFinalWordScore(score,wordAchievable.length,wordShowListBonus);

document.getElementById("wordMessage").innerHTML=getWordScoreRatingInfo(finalScore).text || "Oyun bitti";

animateFinalWordScoreCountUp(finalScore,{title:"Oyun Sonlandı 🎉",screenCheckId:"wordGameContent"});

recordGameEnd(result,finalScore);

}

return;

}

});


let historyDragStartX=null;
let historyDragStartY=null;
let historyDragBaseOffset=0;
let historyDragCurrentOffset=0;
let historyDragging=false;
let historyDragLocked=null;

let historyTabsViewport=document.getElementById("historyTabsViewport");
let historyTabsTrackEl=document.getElementById("historyTabsTrack");

historyTabsViewport.addEventListener("touchstart",function(e){

historyDragStartX=e.touches[0].clientX;
historyDragStartY=e.touches[0].clientY;
historyDragBaseOffset=-(HISTORY_TAB_ORDER.indexOf(currentHistoryTab)*33.3333);
historyDragCurrentOffset=historyDragBaseOffset;
historyDragging=true;
historyDragLocked=null;

});

historyTabsViewport.addEventListener("touchmove",function(e){

if(!historyDragging)return;

let dx=e.touches[0].clientX-historyDragStartX;
let dy=e.touches[0].clientY-historyDragStartY;

if(historyDragLocked===null){

if(Math.abs(dx)<5 && Math.abs(dy)<5)return;

historyDragLocked=Math.abs(dx)>Math.abs(dy) ? "x" : "y";

if(historyDragLocked==="x"){
historyTabsTrackEl.classList.remove("animated");
}

}

if(historyDragLocked!=="x")return;

e.preventDefault();

let viewportWidth=historyTabsViewport.getBoundingClientRect().width;
let dxPercent=(dx/viewportWidth)*33.3333;

let idx=HISTORY_TAB_ORDER.indexOf(currentHistoryTab);
let minOffset=-(HISTORY_TAB_ORDER.length-1)*33.3333;

let newOffset=historyDragBaseOffset+dxPercent;

if(newOffset>0)newOffset=historyDragBaseOffset+(newOffset-historyDragBaseOffset)*0.3;
if(newOffset<minOffset)newOffset=minOffset+(newOffset-minOffset)*0.3;

historyDragCurrentOffset=newOffset;

historyTabsTrackEl.style.transform="translateX("+newOffset+"%)";

},{passive:false});

historyTabsViewport.addEventListener("touchend",function(){

if(!historyDragging)return;

historyDragging=false;

if(historyDragLocked!=="x"){
historyDragLocked=null;
return;
}

historyTabsTrackEl.classList.add("animated");

let idx=HISTORY_TAB_ORDER.indexOf(currentHistoryTab);
let moved=historyDragCurrentOffset-historyDragBaseOffset;
let threshold=33.3333/14;

if(moved<-threshold && idx<HISTORY_TAB_ORDER.length-1){

playClickSoundBack();

switchHistoryTab(HISTORY_TAB_ORDER[idx+1]);

}
else if(moved>threshold && idx>0){

playClickSoundBack();

switchHistoryTab(HISTORY_TAB_ORDER[idx-1]);

}
else{

historyTabsTrackEl.style.transform="translateX("+historyDragBaseOffset+"%)";

}

historyDragLocked=null;

});


if("serviceWorker" in navigator){

window.addEventListener("load",function(){

navigator.serviceWorker.register("sw.js").catch(function(e){

console.error("Service worker kaydedilemedi:",e);

});

});

}


window.history.pushState({app:true},"","");

document.addEventListener("click",function(e){

let btn=e.target.closest("button");

if(!btn)return;

if(btn.closest("#wordCards"))return;
if(btn.classList.contains("word-check-btn") || btn.classList.contains("equal"))return;
if(btn.classList.contains("undo") || btn.classList.contains("word-shuffle-btn"))return;

if(btn.id!=="wordNewGameBtn"){
playClickSoundBack();
}

});


window.addEventListener("popstate",function(e){

if(ignoreNextModalPopstate){
ignoreNextModalPopstate=false;
return;
}

let modalEl=document.getElementById("detailModalOverlay");

if(modalEl && modalEl.style.display==="flex"){
hideDetailModal();
return;
}

let lpOverlayEl=document.querySelector(".oy-lp-overlay");

if(lpOverlayEl){
lpOverlayEl.remove();
return;
}

revealSessionToken++;

hideScoreBannerNow();
stopWordTargetConfettiRain();
stopAllSounds();
clearAllConfetti();

let currentScreenId=null;

for(let i=0;i<SCREEN_IDS.length;i++){
let el=document.getElementById(SCREEN_IDS[i]);
if(el.style.display && el.style.display!=="none"){
currentScreenId=SCREEN_IDS[i];
break;
}
}

let targetId=null;
let targetDisplay="block";
let targetScrollTop=0;

if(currentScreenId && SCREEN_PARENT_MAP.hasOwnProperty(currentScreenId)){

targetId="homeScreen";
screenNavStack.length=0;

}
else{

if(screenNavStack.length===0){
return;
}

let prev=screenNavStack.pop();
targetId=prev.id;
targetDisplay=prev.display;
targetScrollTop=prev.scrollTop||0;

}

playClickSoundBack();

suppressScreenPush=true;
hideAllScreens();
suppressScreenPush=false;

document.getElementById(targetId).style.display=targetDisplay;

let restoreScrollTop=function(){
let gameElForPop=document.querySelector(".game");
if(gameElForPop)gameElForPop.scrollTop=targetScrollTop;
};

restoreScrollTop();
requestAnimationFrame(restoreScrollTop);

if(targetId==="homeScreen" || targetId==="historyScreen"){
document.body.classList.add("home-active");
}
else{
document.body.classList.remove("home-active");
}

syncBottomNavForScreen(targetId);

if(targetId==="homeScreen"){
renderHomeStats();
updateChallengeBadge();
renderHomeChallengeListCarousel();
}

if(targetId==="historyScreen"){

oyunlariYenile().then(restoreScrollTop);

}

if(targetId==="challengeDetailScreen" && acikAyrinti && sunucuDurumu && sunucuDurumu.oyunlar[acikAyrinti]){
ayrintiCiz(sunucuDurumu.oyunlar[acikAyrinti]);
}

});

