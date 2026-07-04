import {
initAuth,
login,
logout
}
from "./auth.js";

import {
searchUser
}
from "./users.js";

import {
fundWallet
}
from "./wallet.js";

let currentUserId = null;

window.addEventListener("DOMContentLoaded",()=>{

initAuth();

const loginForm =
document.getElementById("loginForm");

const logoutBtn =
document.getElementById("logoutBtn");

const searchBtn =
document.getElementById("searchBtn");

const fundForm =
document.getElementById("fundForm");

if(loginForm){

loginForm.addEventListener(
"submit",
async(e)=>{

e.preventDefault();

try{

await login();

}catch(err){

alert(err.message);

}

});

}

if(logoutBtn){

logoutBtn.addEventListener(
"click",
logout
);

}

if(searchBtn){

searchBtn.addEventListener(
"click",
async()=>{

try{

currentUserId=
await searchUser();

}catch(err){

alert(err.message);

}

});

}

if(fundForm){

fundForm.addEventListener(
"submit",
async(e)=>{

e.preventDefault();

if(!currentUserId){

alert(
"Select user first"
);

return;

}

try{

await fundWallet(
currentUserId
);

}catch(err){

alert(err.message);

}

});

}

});
