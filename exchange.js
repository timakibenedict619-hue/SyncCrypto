import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAVYYdxtOnixpdGJOWqVKrFczTQrWV8jLo",
    authDomain: "synccrypto-fa0ac.firebaseapp.com",
    projectId: "synccrypto-fa0ac",
    storageBucket: "synccrypto-fa0ac.firebasestorage.app",
    messagingSenderId: "609980963372",
    appId: "1:609980963372:web:f0f3addb7cdcb555230f89",
    measurementId: "G-R3R5153SDR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let fundingBalance = 0;
let investmentProfit = 0;
let tradingProfit = 0;

function shake(element) {
    element.classList.remove("animate-shake");
    void element.offsetWidth;
    element.classList.add("animate-shake");

    setTimeout(() => {
        element.classList.remove("animate-shake");
    }, 500);
}

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {

        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {

            const data = snap.data();

            fundingBalance = Number(data.balance || 0);
            investmentProfit = Number(data.investmentProfit || 0);
            tradingProfit = Number(data.tradingProfit || 0);

            document.getElementById("fromBalance").textContent =
                fundingBalance.toFixed(2) + " USD";

            document.getElementById("fromAccount").innerHTML =
                `<option value="funding">Funding Wallet - ${fundingBalance.toFixed(2)} USD</option>`;

            document.getElementById("toBalance").textContent =
                "Select destination";
        }

    } catch (error) {

        console.error(error);

    }

});

document.getElementById("toAccount").addEventListener("change", function () {

    if (this.value === "investmentProfit") {

        document.getElementById("toBalance").textContent =
            investmentProfit.toFixed(2) + " USD";

    } else if (this.value === "tradingProfit") {

        document.getElementById("toBalance").textContent =
            tradingProfit.toFixed(2) + " USD";

    } else {

        document.getElementById("toBalance").textContent =
            "0.00 USD";

    }

});

document.getElementById("moveBtn").addEventListener("click", () => {

    const amountInput = document.getElementById("amount");
    const destinationSelect = document.getElementById("toAccount");
    const lowBalanceBox = document.getElementById("lowBalanceBox");

    const amount = parseFloat(amountInput.value);
    const destination = destinationSelect.value;

    lowBalanceBox.classList.add("hidden");

    if (isNaN(amount) || amount <= 0) {
        shake(amountInput);
        amountInput.focus();
        return;
    }

    if (destination === "") {
        shake(destinationSelect);
        destinationSelect.focus();
        return;
    }

    if (amount > fundingBalance) {
        lowBalanceBox.classList.remove("hidden");
        shake(amountInput);
        return;
    }

    lowBalanceBox.classList.add("hidden");

    console.log("Balance check passed.");

    // Later you can add the Firebase transfer code here.

});
