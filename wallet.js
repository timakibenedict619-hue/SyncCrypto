import { db } from "./firebase-config.js";

import {
 doc,
 updateDoc,
 increment,
 addDoc,
 collection,
 serverTimestamp
}
from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export async function fundWallet(uid){

const amount=parseFloat(
document.getElementById(
"fundAmount"
).value
);

const currency=
document.getElementById(
"fundCurrency"
).value;

await updateDoc(
doc(db,"users",uid),
{
balance:increment(amount)
}
);

await addDoc(
collection(
db,
"users",
uid,
"transactions"
),
{
type:"deposit",
amount,
currency,
timestamp:
serverTimestamp()
}
);

alert("Wallet funded");

}
