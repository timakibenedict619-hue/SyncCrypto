// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Elements
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const phoneNumber = document.getElementById("phoneNumber");
const country = document.getElementById("country");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const terms = document.getElementById("terms");

const registerBtn = document.getElementById("registerBtn");
const registerBtnText = document.getElementById("registerBtnText");
const registerLoader = document.getElementById("registerLoader");

const formStep1 = document.getElementById("formStep1");
const formStep2 = document.getElementById("formStep2");
const formStep3 = document.getElementById("formStep3");

const userEmail = document.getElementById("userEmail");
const userPhone = document.getElementById("userPhone");

const continueBtn = document.getElementById("continueToPhoneBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const otpCode = document.getElementById("otpCode");

const successModal = document.getElementById("successModal");

let confirmationResult;

// Countries
const countries = [
    "Nigeria",
    "United States",
    "United Kingdom",
    "Canada",
    "South Africa",
    "France",
    "Germany"
];

countries.forEach(c => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    country.appendChild(option);
});

// Password toggle

document.getElementById("togglePassword")
.addEventListener("click",()=>{

password.type=
password.type==="password"
?"text":"password";

});

document.getElementById("toggleConfirmPassword")
.addEventListener("click",()=>{

confirmPassword.type=
confirmPassword.type==="password"
?"text":"password";

});

// Register

registerBtn.addEventListener("click",async()=>{

let name=fullName.value.trim();
let userEmailValue=email.value.trim();
let phone=phoneNumber.value.trim();
let pass=password.value;
let confirm=confirmPassword.value;
let userCountry=country.value;

if(
!name||
!userEmailValue||
!phone||
!userCountry||
!pass||
!confirm
){
alert("Fill all fields");
return;
}

if(pass!==confirm){
alert("Passwords do not match");
return;
}

if(!terms.checked){
alert("Accept terms first");
return;
}

try{

registerBtnText.style.display="none";
registerLoader.classList.remove("hidden");

const userCredential=
await createUserWithEmailAndPassword(
auth,
userEmailValue,
pass
);

const user=userCredential.user;

// CREATE USER IN FIRESTORE

await setDoc(
doc(db,"users",user.uid),
{
name:name,
email:userEmailValue,
phone:phone,
country:userCountry,
balance:0,
createdAt:serverTimestamp()
}
);

// Send verification email

await sendEmailVerification(user);

userEmail.textContent=userEmailValue;

formStep1.classList.add("hidden");
formStep2.classList.remove("hidden");

}
catch(error){

alert(error.message);

}
finally{

registerLoader.classList.add("hidden");
registerBtnText.style.display="block";

}

});

// Continue phone verification

continueBtn.addEventListener("click",async()=>{

let phone=phoneNumber.value.trim();

if(!phone.startsWith("+")){
alert("Use country code Example: +2348012345678");
return;
}

try{

if(!window.recaptchaVerifier){

window.recaptchaVerifier=
new RecaptchaVerifier(
auth,
"recaptcha-container",
{
size:"normal"
}
);

await window.recaptchaVerifier.render();

}

confirmationResult=
await signInWithPhoneNumber(
auth,
phone,
window.recaptchaVerifier
);

userPhone.textContent=phone;

formStep2.classList.add("hidden");
formStep3.classList.remove("hidden");

}
catch(error){

console.log(error);

alert(error.message);

}

});

// Verify OTP

verifyOtpBtn.addEventListener("click",async()=>{

let code=otpCode.value.trim();

if(code.length!==6){
alert("Enter valid OTP");
return;
}

try{

await confirmationResult.confirm(code);

successModal.classList.add("active");

setTimeout(()=>{

window.location.href="dashboard.html";

},3000);

}
catch(error){

alert("Invalid OTP");

}

});
