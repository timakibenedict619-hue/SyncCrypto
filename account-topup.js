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
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
const storage = getStorage(app);

let currentUser = null;

const topupForm = document.getElementById("topupForm");
const amountInput = document.getElementById("amount");
const walletSelect = document.getElementById("walletSelect");
const paymentMethod = document.getElementById("paymentMethod");
const bitcoinInstructions = document.getElementById("bitcoinInstructions");
const bitcoinAddress = document.getElementById("bitcoinAddress");
const copyAddressBtn = document.getElementById("copyAddressBtn");
const receiptInput = document.getElementById("receipt");
const fileName = document.getElementById("fileName");
const paidBtn = document.getElementById("paidBtn");

function setButtonLoading(isLoading) {
  if (isLoading) {
    paidBtn.disabled = true;
    paidBtn.style.opacity = "0.7";
    paidBtn.dataset.originalContent = paidBtn.innerHTML;
    paidBtn.innerHTML = `
      <i data-lucide="loader-circle" class="h-5 w-5 animate-spin"></i>
      Uploading request...
    `;

    lucide.createIcons();
    return;
  }

  paidBtn.disabled = false;
  paidBtn.style.opacity = "1";
  paidBtn.innerHTML = paidBtn.dataset.originalContent || "Submit top-up request";
  lucide.createIcons();
}

function updateWalletDisplay(balance) {
  walletSelect.innerHTML = `
    <option value="funding">
      Funding wallet — ${Number(balance || 0).toFixed(2)} USD
    </option>
  `;
}

paymentMethod.addEventListener("change", () => {
  bitcoinInstructions.classList.toggle(
    "hidden",
    paymentMethod.value !== "bitcoin"
  );
});

receiptInput.addEventListener("change", () => {
  const file = receiptInput.files[0];
  fileName.textContent = file ? file.name : "";
});

copyAddressBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(bitcoinAddress.textContent.trim());
    copyAddressBtn.textContent = "Copied";

    setTimeout(() => {
      copyAddressBtn.textContent = "Copy";
    }, 2000);
  } catch {
    alert("Unable to copy the Bitcoin address.");
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));

    if (!userSnap.exists()) {
      alert("Your wallet information could not be found.");
      return;
    }

    updateWalletDisplay(userSnap.data().balance);
  } catch (error) {
    console.error(error);
    alert("Unable to load your wallet.");
  }
});

topupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);
  const method = paymentMethod.value;
  const receipt = receiptInput.files[0];

  if (!currentUser) {
    alert("Please sign in again.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Enter a valid top-up amount.");
    amountInput.focus();
    return;
  }

  if (!method) {
    alert("Select a payment method.");
    paymentMethod.focus();
    return;
  }

  if (!receipt) {
    alert("Upload your payment receipt.");
    return;
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(receipt.type)) {
    alert("Upload a PNG, JPG, or WEBP receipt image.");
    return;
  }

  if (receipt.size > 5 * 1024 * 1024) {
    alert("Receipt images must be smaller than 5 MB.");
    return;
  }

  try {
    setButtonLoading(true);

    const safeFileName = receipt.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const receiptRef = ref(
      storage,
      `topup-receipts/${currentUser.uid}/${Date.now()}-${safeFileName}`
    );

    await uploadBytes(receiptRef, receipt);

    const receiptUrl = await getDownloadURL(receiptRef);

    await addDoc(collection(db, "topups"), {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      amount: Number(amount.toFixed(2)),
      currency: "USD",
      method,
      receiptName: receipt.name,
      receiptUrl,
      status: "pending",
      createdAt: serverTimestamp()
    });

    topupForm.reset();
    bitcoinInstructions.classList.add("hidden");
    fileName.textContent = "";

    alert(
      `Your ${amount.toFixed(2)} USD top-up request was submitted. ` +
      "Your wallet will be funded after payment approval."
    );
  } catch (error) {
    console.error(error);
    alert(error.message || "Unable to submit your top-up request.");
  } finally {
    setButtonLoading(false);
  }
});
