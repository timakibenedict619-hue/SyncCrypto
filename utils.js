export function showLoading() {
 document.getElementById("loadingOverlay")
 .classList.remove("hidden");
}

export function hideLoading() {
 document.getElementById("loadingOverlay")
 .classList.add("hidden");
}

export function showToast(message){
 alert(message);
}

export function money(amount){
 return new Intl.NumberFormat(
   'en-US',
   {
     style:'currency',
     currency:'USD'
   }
 ).format(amount||0);
}
