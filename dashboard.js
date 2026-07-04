// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVYYdxtOnixpdGJOWqVKrFczTQrWV8jLo",
  authDomain: "synccrypto-fa0ac.firebaseapp.com",
  projectId: "synccrypto-fa0ac",
  storageBucket: "synccrypto-fa0ac.firebasestorage.app",
  messagingSenderId: "609980963372",
  appId: "1:609980963372:web:f0f3addb7cdcb555230f89",
  measurementId: "G-R3R5153SDR"
};


// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();


// Load user and dashboard data
firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Show user details
    document.getElementById("userName").textContent =
        user.displayName || user.email.split("@")[0];

    document.getElementById("userEmail").textContent =
        user.email;

    // User document id
    const uid = user.uid;

    // Listen for balance changes instantly
    db.collection("users")
      .doc(uid)
      .onSnapshot((doc) => {

        if (!doc.exists) return;

        const data = doc.data();

        const wallet = data.walletBalance || 0;
        const bonus = data.bonusBalance || 0;
        const funding = data.fundingBalance || 0;
        const trading = data.tradingBalance || 0;
        const investProfit = data.investmentProfit || 0;
        const tradeProfit = data.tradingProfit || 0;
        const rewards = data.rewardBalance || 0;
        const referral = data.referralBonus || 0;

        // Update dashboard balances

        document.getElementById("walletBalance").innerHTML =
        wallet.toFixed(2) + ' <span class="text-sm font-normal">USD</span>';

        document.getElementById("bonusBalance").innerHTML =
        bonus.toFixed(2) + ' <span class="text-sm font-normal">USD</span>';

        document.getElementById("fundingBalance").innerHTML =
        funding.toFixed(2) + ' <span class="text-sm font-normal">USD</span>';

        document.getElementById("investmentProfit").innerHTML =
        trading.toFixed(2) + ' <span class="text-sm font-normal">USD</span>';

        document.getElementById("tradingProfit").innerHTML =
        investProfit.toFixed(2) + ' <span class="text-sm font-normal">USD</span>';

        // Total assets calculation
        const total =
            wallet +
            bonus +
            funding +
            trading +
            investProfit +
            tradeProfit +
            rewards +
            referral;

        document.getElementById("totalAssets").innerHTML =
        total.toFixed(2) +
        ' <span class="text-2xl sm:text-3xl">USD</span>';

    });

});


// Theme toggle
let isDark = false;

document.getElementById("themeToggle")
.addEventListener("click",()=>{

    isDark=!isDark;

    if(isDark){
        document.body.classList.add("theme-dark");
        document.getElementById("themeToggle").innerHTML =
        '<i class="fa-regular fa-moon text-xl"></i>';
    }else{
        document.body.classList.remove("theme-dark");
        document.getElementById("themeToggle").innerHTML =
        '<i class="fa-regular fa-sun text-xl"></i>';
    }

});


// Dismiss cards
function dismissCard(cardId){

    const card=document.getElementById(cardId);

    card.style.opacity="0";
    card.style.transform="scale(0.95)";

    setTimeout(()=>{
        card.style.display="none";
    },300);

}


// Ticker
const tickerMessages=[

'Björn Eriksen deposited USD 2202',
'Sarah Johnson withdrew USD 5450',
'Michael Chen earned USD 1890',
'Emma Williams deposited USD 3120',
'David Rodriguez withdrew USD 4750'

];

let tickerIndex=0;

function updateTicker(){

const message=tickerMessages[tickerIndex];

document.getElementById("tickerText").textContent=message;
document.getElementById("tickerTextDup").textContent=message;

tickerIndex=(tickerIndex+1)%tickerMessages.length;

}

updateTicker();

setInterval(updateTicker,8000);


// Referral copy
function copyReferral(){

navigator.clipboard.writeText("REF-5031TT");

showToast("Referral code copied");

}


// Toast
function showToast(message){

const toast=document.getElementById("toast");

document.getElementById("toastMessage")
.textContent=message;

toast.classList.remove("translate-x-full");

setTimeout(()=>{

toast.classList.add("translate-x-full");

},3000);

}


document.getElementById("supportBtn")
.addEventListener("click",()=>{

showToast("Support opened");

});
