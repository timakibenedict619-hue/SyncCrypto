import { db } from "./firebase-config.js";

import {
 collection,
 query,
 where,
 getDocs,
 getDoc,
 doc
}
from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { money } from "./utils.js";

export async function searchUser(){

const email=
document.getElementById(
"searchEmail"
).value;

const q=query(
collection(db,"users"),
where("email","==",email)
);

const snap=await getDocs(q);

if(snap.empty){

alert("User not found");

return null;
}

const user=snap.docs[0];

displayUser(
user.data()
);

return user.id;

}

function displayUser(data){

document.getElementById(
"userName"
).textContent=data.name||"-";

document.getElementById(
"userEmailCard"
).textContent=data.email||"-";

document.getElementById(
"userCountry"
).textContent=data.country||"-";

document.getElementById(
"userBalance"
).textContent=
money(data.balance);

document
.getElementById("userCard")
.classList.remove("hidden");

}
