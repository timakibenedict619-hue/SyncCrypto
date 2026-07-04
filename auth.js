import { auth, db } from "./firebase-config.js";

import {
 signInWithEmailAndPassword,
 signOut,
 onAuthStateChanged
}
from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
 doc,
 getDoc
}
from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export function initAuth(){

onAuthStateChanged(auth,async(user)=>{

if(!user){

document.getElementById("loginScreen")
.classList.remove("hidden");

document.getElementById("dashboard")
.classList.add("hidden");

return;
}

const adminDoc=await getDoc(
doc(db,"admins",user.email)
);

if(!adminDoc.exists()){

alert("Not admin");

await signOut(auth);

return;
}

document.getElementById("adminEmailDisplay")
.textContent=user.email;

document.getElementById("loginScreen")
.classList.add("hidden");

document.getElementById("dashboard")
.classList.remove("hidden");

});

}

export async function login(){

const email=document
.getElementById("adminEmail")
.value;

const password=document
.getElementById("adminPassword")
.value;

await signInWithEmailAndPassword(
auth,
email,
password
);

}

export async function logout(){

await signOut(auth);

}
