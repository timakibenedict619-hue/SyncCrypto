// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
getAuth,
onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
getFirestore,
doc,
getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase config

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


// User Authentication + Data

onAuthStateChanged(auth, async(user)=>{

if(user){

document.getElementById('userEmail').textContent =
user.email || 'user@synccrypto.com';

let displayName='User';
let initials='U';

try{

const userDoc=
await getDoc(
doc(db,'users',user.uid)
);

if(userDoc.exists()){

const data=userDoc.data();

displayName=
data.name ||
data.displayName ||
user.displayName ||
'User';

initials=
displayName
.split(' ')
.map(n=>n[0])
.join('')
.toUpperCase()
.slice(0,2);

if(document.getElementById("totalAssets")){

document.getElementById("totalAssets")
.textContent=
(data.wallet || 0)+" USD";

}

if(document.getElementById("cryptoBalance")){

document.getElementById("cryptoBalance")
.textContent=
(data.wallet || 0)+" USD";

}

}

}catch(error){

console.log(error);

}

document.getElementById(
'welcomeName'
).textContent=
`Welcome, ${displayName}`;

document.getElementById(
'avatarInitials'
).textContent=
initials;

document.getElementById(
'avatarInitialsLarge'
).textContent=
initials;

}else{

window.location.href='login.html';

}

});


// Theme

window.toggleTheme=()=>{

document.documentElement.classList.toggle(
'dark'
);

localStorage.setItem(
'theme',
document.documentElement.classList.contains(
'dark'
)
?'dark':'light'
);

};

if(localStorage.getItem('theme')==='dark'){

document.documentElement.classList.add(
'dark'
);

}


// Navigation

window.showDashboard=()=>{

document.getElementById(
'dashboardView'
).classList.remove(
'hidden'
);

document.getElementById(
'investView'
).classList.add(
'hidden'
);

};


window.showInvest=()=>{

document.getElementById(
'dashboardView'
).classList.add(
'hidden'
);

document.getElementById(
'investView'
).classList.remove(
'hidden'
);

};


// Live ticker

const tickerData=[

'Abdul Aldo just withdrew USD 2,200',
'Sarah Chen just invested USD 5,000',
'John Davis just traded USD 12,500',
'Maria Garcia just withdrew USD 850',
'David Lee just invested USD 15,000'

];

let tickerIndex=0;

function updateTicker(){

const tickerEl=
document.getElementById(
'tickerText'
);

if(!tickerEl)return;

tickerEl.classList.remove(
'ticker-enter'
);

tickerEl.classList.add(
'ticker-exit'
);

setTimeout(()=>{

tickerIndex=
(tickerIndex+1)
%
tickerData.length;

tickerEl.textContent=
tickerData[tickerIndex];

tickerEl.classList.remove(
'ticker-exit'
);

tickerEl.classList.add(
'ticker-enter'
);

},500);

}

setInterval(updateTicker,4000);
