import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let currentUser = null;

const walletSelect = document.getElementById("walletSelect");
const recipientInput = document.getElementById("recipient");
const amountInput = document.getElementById("amount");
const sendBtn = document.getElementById("sendBtn");

function updateWalletDisplay(balance) {
  walletBalance = Number(balance || 0);

  walletSelect.innerHTML = `
    <option value="funding">
      Funding - ${walletBalance.toFixed(2)} USD
    </option>
  `;
}

function setSendButtonLoading(isLoading) {
  if (isLoading) {
    sendBtn.disabled = true;
    sendBtn.dataset.originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;
    return;
  }

  sendBtn.disabled = false;
  sendBtn.innerHTML = sendBtn.dataset.originalText || "Send Funds";
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("Your user data could not be found.");
      return;
    }

    updateWalletDisplay(userSnap.data().balance);
  } catch (error) {
    console.error("Failed to load wallet:", error);
    alert(error.message || "Unable to load your wallet.");
  }
});

sendBtn.addEventListener("click", async () => {
  const recipientEmail = recipientInput.value.trim().toLowerCase();
  const amount = Number(amountInput.value);

  if (!currentUser) {
    alert("Please sign in again.");
    return;
  }

  if (!recipientEmail) {
    alert("Enter the recipient's email address.");
    recipientInput.focus();
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Enter a valid amount greater than zero.");
    amountInput.focus();
    return;
  }

  if (recipientEmail === currentUser.email?.toLowerCase()) {
    alert("You cannot send funds to your own account.");
    return;
  }

  try {
    setSendButtonLoading(true);

    /*
      This expects each document in the "users" collection to include
      an "email" field, for example:
      {
        email: "user@email.com",
        balance: 500
      }
    */
    const recipientQuery = query(
      collection(db, "users"),
      where("email", "==", recipientEmail)
    );

    const recipientSnapshot = await getDocs(recipientQuery);

    if (recipientSnapshot.empty) {
      throw new Error("No user was found with that email address.");
    }

    const recipientDoc = recipientSnapshot.docs[0];
    const senderRef = doc(db, "users", currentUser.uid);
    const recipientRef = doc(db, "users", recipientDoc.id);
    const transferRef = doc(collection(db, "transfers"));

    const newBalance = await runTransaction(db, async (transaction) => {
      const senderSnapshot = await transaction.get(senderRef);
      const recipientUserSnapshot = await transaction.get(recipientRef);

      if (!senderSnapshot.exists()) {
        throw new Error("Your wallet could not be found.");
      }

      if (!recipientUserSnapshot.exists()) {
        throw new Error("Recipient account no longer exists.");
      }

      const senderBalance = Number(senderSnapshot.data().balance || 0);
      const recipientBalance = Number(recipientUserSnapshot.data().balance || 0);

      if (amount > senderBalance) {
        throw new Error("Insufficient funds.");
      }

      const senderNewBalance = Number((senderBalance - amount).toFixed(2));
      const recipientNewBalance = Number((recipientBalance + amount).toFixed(2));

      transaction.update(senderRef, {
        balance: senderNewBalance
      });

      transaction.update(recipientRef, {
        balance: recipientNewBalance
      });

      transaction.set(transferRef, {
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        recipientId: recipientDoc.id,
        recipientEmail,
        amount,
        currency: "USD",
        status: "completed",
        createdAt: serverTimestamp()
      });

      return senderNewBalance;
    });

    updateWalletDisplay(newBalance);

    recipientInput.value = "";
    amountInput.value = "";

    alert(`Successfully sent $${amount.toFixed(2)} to ${recipientEmail}.`);
  } catch (error) {
    console.error("Transfer failed:", error);
    alert(error.message || "Transfer failed. Please try again.");
  } finally {
    setSendButtonLoading(false);
  }
});
