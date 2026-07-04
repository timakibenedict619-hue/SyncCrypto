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

let currentUserId=null;

initAuth();

document
.getElementById(
"loginForm"
)
.addEventListener(
"submit",
async(e)=>{

e.preventDefault();

await login();

}
);

document
.getElementById(
"logoutBtn"
)
.addEventListener(
"click",
logout
);

document
.getElementById(
"searchBtn"
)
.addEventListener(
"click",
async()=>{

currentUserId=
await searchUser();

}
);

document
.getElementById(
"fundForm"
)
.addEventListener(
"submit",
async(e)=>{

e.preventDefault();

if(!currentUserId){

alert(
"Select user first"
);

return;
}

await fundWallet(
currentUserId
);

}
);
