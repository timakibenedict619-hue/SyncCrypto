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

const ADMIN_EMAIL = "e.timaki5620@miva.edu.ng";

if(user.email !== ADMIN_EMAIL){

alert("Access denied");

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

const ADMIN_EMAIL = "youradmin@gmail.com";

export async function login(){

const email=document
.getElementById("e.timaki5620@miva.edu.ng")
.value.trim();

const password=document
.getElementById("adminPassword")
.value;

if(email !== ADMIN_EMAIL){

throw new Error("Access denied");

}

await signInWithEmailAndPassword(
auth,
email,
password
);

}

export async function logout(){

await signOut(auth);

}
