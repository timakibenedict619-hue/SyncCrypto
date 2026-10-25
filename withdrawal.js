import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
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

const withdrawalForm = document.getElementById("withdrawalForm");
const amountInput = document.getElementById("amount");
const walletSelect = document.getElementById("walletSelect");
const methodSelect = document.getElementById("method");
const bitcoinForm = document.getElementById("bitcoinForm");
const bankForm = document.getElementById("bankForm");
const bitcoinAddress = document.getElementById("bitcoinAddress");
const accountName = document.getElementById("accountName");
const bankName = document.getElementById("bankName");
const accountNumber = document.getElementById("accountNumber");
const withdrawBtn = document.getElementById("withdrawBtn");

function updateWalletDisplay(balance) {
  walletBalance = Number(balance || 0);

  walletSelect.innerHTML = `
    <option value="funding">
      Funding — ${walletBalance.toFixed(2)} USD
    </option>
  `;
}

function setButtonLoading(isLoading) {
  if (isLoading) {
    withdrawBtn.disabled = true;
    withdrawBtn.style.opacity = "0.7";
    withdrawBtn.style.cursor = "not-allowed";
    withdrawBtn.dataset.originalContent = withdrawBtn.innerHTML;
    withdrawBtn.innerHTML = `
      <i data-lucide="loader-circle" class="h-5 w-5 animate-spin"></i>
      Submitting request...
    `;

    if (window.lucide) lucide.createIcons();
    return;
  }

  withdrawBtn.disabled = false;
  withdrawBtn.style.opacity = "1";
  withdrawBtn.style.cursor = "pointer";
  withdrawBtn.innerHTML = withdrawBtn.dataset.originalContent || "Submit withdrawal request";

  if (window.lucide) lucide.createIcons();
}

function clearMethodFields() {
  bitcoinAddress.value = "";
  accountName.value = "";
  bankName.value = "";
  accountNumber.value = "";
}

function updateMethodForm() {
  const selectedMethod = methodSelect.value;

  bitcoinForm.classList.remove("active");
  bankForm.classList.remove("active");

  bitcoinAddress.required = false;
  accountName.required = false;
  bankName.required = false;
  accountNumber.required = false;

  if (selectedMethod === "bitcoin") {
    bitcoinForm.classList.add("active");
    bitcoinAddress.required = true;
  }

  if (selectedMethod === "bank") {
    bankForm.classList.add("active");
    accountName.required = true;
    bankName.required = true;
    accountNumber.required = true;
  }
}

methodSelect.addEventListener("change", () => {
  clearMethodFields();
  updateMethodForm();
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      alert("Your wallet information could not be found.");
      return;
    }

    updateWalletDisplay(userSnapshot.data().balance);
  } catch (error) {
    console.error("Wallet loading error:", error);
    alert("Unable to load wallet balance.");
  }
});

withdrawalForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);
  const method = methodSelect.value;

  if (!currentUser) {
    alert("Please sign in again before making a withdrawal.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Enter a valid withdrawal amount.");
    amountInput.focus();
    return;
  }

  if (!method) {
    alert("Select a withdrawal method.");
    methodSelect.focus();
    return;
  }

  let paymentDetails = {};

  if (method === "bitcoin") {
    const address = bitcoinAddress.value.trim();

    if (address.length < 20) {
      alert("Enter a valid Bitcoin wallet address.");
      bitcoinAddress.focus();
      return;
    }

    paymentDetails = {
      bitcoinAddress: address
    };
  }

  if (method === "bank") {
    const name = accountName.value.trim();
    const bank = bankName.value.trim();
    const number = accountNumber.value.trim();

    if (!name || !bank || !number) {
      alert("Complete all bank account details.");
      return;
    }

    if (number.length < 6) {
      alert("Enter a valid bank account number.");
      accountNumber.focus();
      return;
    }

    paymentDetails = {
      accountName: name,
      bankName: bank,
      accountNumber: number
    };
  }

  try {
    setButtonLoading(true);

    const userRef = doc(db, "users", currentUser.uid);
    const withdrawalRef = doc(collection(db, "withdrawals"));

    const newBalance = await runTransaction(db, async (transaction) => {
      const userSnapshot = await transaction.get(userRef);

      if (!userSnapshot.exists()) {
        throw new Error("Your wallet could not be found.");
      }

      const latestBalance = Number(userSnapshot.data().balance || 0);

      if (amount > latestBalance) {
        throw new Error("Insufficient funds for this withdrawal.");
      }

      const balanceAfterWithdrawal = Number((latestBalance - amount).toFixed(2));

      transaction.update(userRef, {
        balance: balanceAfterWithdrawal
      });

      transaction.set(withdrawalRef, {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        amount: Number(amount.toFixed(2)),
        currency: "USD",
        method,
        paymentDetails,
        status: "pending",
        createdAt: serverTimestamp()
      });

      return balanceAfterWithdrawal;
    });

    updateWalletDisplay(newBalance);

    withdrawalForm.reset();
    methodSelect.value = "";
    updateMethodForm();

    alert(
      `Your withdrawal request for $${amount.toFixed(2)} has been submitted. ` +
      "It is pending review and processing."
    );
  } catch (error) {
    console.error("Withdrawal error:", error);
    alert(error.message || "Unable to submit your withdrawal request.");
  } finally {
    setButtonLoading(false);
  }
});
