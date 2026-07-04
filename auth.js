import { auth } from "./firebase-config.js";

import {
signInWithEmailAndPassword,
signOut,
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const ADMIN_EMAIL = "e.timaki5620@miva.edu.ng";

export function initAuth(){

onAuthStateChanged(
auth,
(user)=>{

const loginScreen=
document.getElementById("loginScreen");

const dashboard=
document.getElementById("dashboard");

if(!user){

loginScreen.classList.remove("hidden");
dashboard.classList.add("hidden");

return;
}

if(user.email !== ADMIN_EMAIL){

alert("Access denied");

signOut(auth);

return;
}

document.getElementById(
"adminEmailDisplay"
).textContent = user.email;

loginScreen.classList.add("hidden");
dashboard.classList.remove("hidden");

}

);

}

export async function login(){

const email =
document.getElementById(
"adminEmail"
).value.trim();

const password =
document.getElementById(
"adminPassword"
).value;

await signInWithEmailAndPassword(
auth,
email,
password
);

}

export async function logout(){

await signOut(auth);

}
