import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase Config
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

// Elements
const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");

const signInBtn = document.getElementById("signInBtn");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");

const forgotPasswordBtn =
document.getElementById("forgotPasswordBtn");

const togglePassword =
document.getElementById("togglePassword");

const toggleIcon =
document.getElementById("toggleIcon");

// Password visibility
togglePassword.addEventListener("click",()=>{

if(password.type==="password"){

password.type="text";

toggleIcon.className =
"fa-regular fa-eye-slash";

}else{

password.type="password";

toggleIcon.className =
"fa-regular fa-eye";

}

});

// Login
loginForm.addEventListener("submit",async(e)=>{

e.preventDefault();

const userEmail = email.value.trim();
const userPassword = password.value.trim();

if(!userEmail || !userPassword){

alert("Fill all fields");

return;

}

try{

btnText.style.display="none";
btnSpinner.classList.remove("hidden");
signInBtn.disabled=true;

const userCredential =
await signInWithEmailAndPassword(
auth,
userEmail,
userPassword
);

// Check email verified
if(!userCredential.user.emailVerified){

alert(
"Please verify your email before signing in."
);

return;

}

// Save remember me option
if(document.getElementById("rememberMe").checked){

localStorage.setItem(
"userEmail",
userEmail
);

}

window.location.href =
"dashboard.html";

}
catch(error){

console.log(error);

switch(error.code){

case "auth/invalid-credential":
alert("Incorrect email or password");
break;

case "auth/user-not-found":
alert("User not found");
break;

case "auth/wrong-password":
alert("Wrong password");
break;

case "auth/too-many-requests":
alert(
"Too many attempts. Try again later."
);
break;

default:
alert(error.message);

}

}
finally{

btnText.style.display="block";
btnSpinner.classList.add("hidden");
signInBtn.disabled=false;

}

});

// Forgot password
forgotPasswordBtn.addEventListener(
"click",
async()=>{

const userEmail =
email.value.trim();

if(!userEmail){

alert(
"Enter your email first"
);

return;

}

try{

await sendPasswordResetEmail(
auth,
userEmail
);

alert(
"Password reset email sent."
);

}
catch(error){

alert(error.message);

}

});

// Auto-fill remembered email
const savedEmail =
localStorage.getItem(
"userEmail"
);

if(savedEmail){

email.value=savedEmail;

document.getElementById(
"rememberMe"
).checked=true;

}
