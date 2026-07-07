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

let walletBalance = 0;

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            alert("User data not found.");
            return;
        }

        const data = userSnap.data();

        walletBalance = Number(data.balance || 0);

        document.getElementById("walletSelect").innerHTML = `
            <option value="funding">
                Funding - ${walletBalance.toFixed(2)} USD
            </option>
        `;

    } catch (error) {
        console.error(error);
        alert(error.message);
    }

});

document.getElementById("sendBtn").addEventListener("click", () => {

    const recipient = document.getElementById("recipient").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);

    if (recipient === "") {
        alert("Enter recipient.");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }

    if (amount > walletBalance) {
        alert("Insufficient funds.");
        return;
    }

    alert("Balance check passed.");

});
