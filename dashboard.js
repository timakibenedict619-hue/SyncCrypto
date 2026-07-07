// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// Auth listener
onAuthStateChanged(auth, async(user)=>{

    if(!user){
        window.location.href="login.html";
        return;
    }

    try{

        // Get Firestore user document
        const userRef = doc(db,"users",user.uid);
        const userSnap = await getDoc(userRef);

        if(userSnap.exists()){

            const data = userSnap.data();

            // USER NAME
            document.getElementById("userName").textContent=
            data.name || "User";

            // EMAIL
            document.getElementById("userEmail").textContent=
            data.email || user.email;

            // BALANCE
            let balance=data.balance || 0;

            document.getElementById("walletBalance").innerHTML=
            `${balance.toFixed(2)}
            <span class="text-sm font-normal">USD</span>`;

            document.getElementById("fundingBalance").innerHTML=
            `${balance.toFixed(2)}
            <span class="text-sm font-normal">USD</span>`;

            document.getElementById("totalAssets").innerHTML=
            `${balance.toFixed(2)}
            <span class="text-2xl sm:text-3xl">USD</span>`;

            // Optional values
            document.getElementById("bonusBalance").innerHTML=
            `50.00 <span class="text-sm font-normal">USD</span>`;

            document.getElementById("investmentProfit").innerHTML=
            `0.00 <span class="text-sm font-normal">USD</span>`;

            document.getElementById("tradingProfit").innerHTML=
            `0.00 <span class="text-sm font-normal">USD</span>`;

            // Profile initials
            const initials=data.name
            ? data.name.split(" ")
                .map(word=>word[0])
                .join("")
                .substring(0,2)
                .toUpperCase()
            : "U";

            const avatars=document.querySelectorAll(
            ".w-24.h-24,.w-9.h-9"
            );

            avatars.forEach(el=>{
                el.textContent=initials;
            });

        }

    }catch(error){

        console.log(error);

        document.getElementById("userName")
        .textContent="Error loading";

    }

});


// Support functions from your HTML

function dismissCard(id){
    document.getElementById(id).style.display="none";
}

window.dismissCard=dismissCard;

function copyReferral(){

    navigator.clipboard.writeText("REF-5031TT");

    showToast("Referral code copied");

}

window.copyReferral=copyReferral;


function showToast(message){

    const toast=document.getElementById("toast");
    const msg=document.getElementById("toastMessage");

    msg.textContent=message;

    toast.classList.remove("translate-x-full");

    setTimeout(()=>{
        toast.classList.add("translate-x-full");
    },3000);

}
// Floating Action Button (FAB)

const fabBtn = document.getElementById("fabBtn");
const fabMenu = document.getElementById("fabMenu");
const fabIcon = document.getElementById("fabIcon");

let menuOpen = false;

if (fabBtn && fabMenu && fabIcon) {

    fabBtn.addEventListener("click", () => {

        menuOpen = !menuOpen;

        if (menuOpen) {
            fabMenu.classList.remove("hidden");
            fabMenu.classList.add("flex");

            fabIcon.classList.remove("fa-plus");
            fabIcon.classList.add("fa-xmark");
        } else {
            fabMenu.classList.add("hidden");
            fabMenu.classList.remove("flex");

            fabIcon.classList.remove("fa-xmark");
            fabIcon.classList.add("fa-plus");
        }

    });

}
