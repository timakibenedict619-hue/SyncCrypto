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

// Authentication
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

            walletBalance = Number(data.balance || 0);

            document.getElementById("walletSelect").innerHTML =
                `<option>Funding - ${walletBalance.toFixed(2)} USD</option>`;

        }

    } catch (error) {

        console.error(error);
        alert("Unable to load wallet.");

    }

});

// Display selected receipt name
document.getElementById("receipt").addEventListener("change", function () {

    const file = this.files[0];

    if (file) {

        document.getElementById("fileName").textContent = file.name;

    } else {

        document.getElementById("fileName").textContent = "";

    }

});

// Paid button
document.getElementById("paidBtn").addEventListener("click", () => {

    const amount = parseFloat(document.getElementById("amount").value);

    const paymentMethod =
        document.getElementById("paymentMethod").value;

    const receipt =
        document.getElementById("receipt").files[0];

    if (isNaN(amount) || amount <= 0) {
        alert("Enter a valid deposit amount.");
        return;
    }

    if (paymentMethod === "") {
        alert("Please select a payment method.");
        return;
    }

    if (!receipt) {
        alert("Please upload your payment receipt.");
        return;
    }

    alert("Deposit request submitted successfully.\nWaiting for admin approval.");

});
