import {
  initAuth,
  login,
  logout
} from "./auth.js";

import {
  searchUser
} from "./users.js";

import {
  initializeApp,
  getApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyAVYYdxtOnixpdGJOWqVKrFczTQrWV8jLo",
  authDomain: "synccrypto-fa0ac.firebaseapp.com",
  projectId: "synccrypto-fa0ac",
  storageBucket: "synccrypto-fa0ac.firebasestorage.app",
  messagingSenderId: "609980963372",
  appId: "1:609980963372:web:f0f3addb7cdcb555230f89",
  measurementId: "G-R3R5153SDR"
};

const firebaseApp =
  getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);


/* =========================================================
   STATE
========================================================= */

let currentUserId = null;


/* =========================================================
   TOAST SYSTEM
========================================================= */

function createToastContainer() {
  if (document.getElementById("toastContainer")) return;

  const container = document.createElement("div");

  container.id = "toastContainer";

  container.style.cssText = `
    position:fixed;
    top:88px;
    right:20px;
    z-index:9999;
    display:flex;
    flex-direction:column;
    gap:12px;
    width:min(390px,calc(100vw - 40px));
    pointer-events:none;
  `;

  document.body.appendChild(container);
}


function showToast(message, type = "error") {
  createToastContainer();

  const styles = {
    success: {
      icon: "fa-circle-check",
      color: "#34d399",
      background: "rgba(12, 52, 41, 0.97)"
    },

    error: {
      icon: "fa-circle-exclamation",
      color: "#ff7b7b",
      background: "rgba(62, 20, 27, 0.97)"
    },

    info: {
      icon: "fa-circle-info",
      color: "#60a5fa",
      background: "rgba(20, 42, 70, 0.97)"
    }
  };

  const selected = styles[type] || styles.error;

  const toast = document.createElement("div");

  toast.style.cssText = `
    display:flex;
    align-items:flex-start;
    gap:12px;
    padding:14px 15px;
    color:white;
    background:${selected.background};
    border:1px solid ${selected.color}44;
    border-radius:14px;
    box-shadow:0 18px 38px rgba(0,0,0,.35);
    font-family:"DM Sans",sans-serif;
    font-size:14px;
    pointer-events:auto;
    transform:translateX(30px);
    opacity:0;
    transition:.3s ease;
  `;

  toast.innerHTML = `
    <i
      class="fa-solid ${selected.icon}"
      style="color:${selected.color};margin-top:2px"
    ></i>

    <span style="flex:1">
      ${message}
    </span>

    <button
      aria-label="Close notification"
      style="
        border:0;
        background:transparent;
        color:#cbd5e1;
        cursor:pointer;
      "
    >
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  document
    .getElementById("toastContainer")
    .appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
    toast.style.opacity = "1";
  });

  const removeToast = () => {
    toast.style.transform = "translateX(30px)";
    toast.style.opacity = "0";

    setTimeout(() => {
      toast.remove();
    }, 300);
  };

  toast
    .querySelector("button")
    .addEventListener("click", removeToast);

  setTimeout(removeToast, 5000);
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
  button,
  isLoading,
  text = "Processing..."
) {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalHtml = button.innerHTML;

    button.disabled = true;
    button.style.opacity = "0.65";
    button.style.cursor = "not-allowed";

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      ${text}
    `;

    return;
  }

  button.disabled = false;
  button.style.opacity = "1";
  button.style.cursor = "pointer";

  if (button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml;

    delete button.dataset.originalHtml;
  }
}


/* =========================================================
   FORMATTING
========================================================= */

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(amount || 0));
}


function formatDate(timestamp) {
  if (!timestamp) return "Just now";

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}


function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}


/* =========================================================
   CUSTOMER RECORD HELPERS
========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function getUserName(user) {
  return (
    user.name ||
    user.fullName ||
    user.displayName ||
    user.username ||
    "Unnamed customer"
  );
}


function getUserEmail(user) {
  return (
    user.email ||
    user.userEmail ||
    "No email"
  );
}


function getUserCountry(user) {
  return (
    user.country ||
    user.location ||
    user.countryName ||
    "—"
  );
}


/* =========================================================
   SELECTED USER DISPLAY
========================================================= */

function clearSelectedUser() {
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmailCard");
  const userCountry = document.getElementById("userCountry");
  const userBalance = document.getElementById("userBalance");

  if (userName) userName.textContent = "—";
  if (userEmail) userEmail.textContent = "—";
  if (userCountry) userCountry.textContent = "—";
  if (userBalance) userBalance.textContent = "$0.00";
}


async function loadSelectedUser(userId) {
  if (!userId) {
    clearSelectedUser();
    return;
  }

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      clearSelectedUser();
      return;
    }

    const user = userSnap.data();

    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmailCard");
    const userCountry = document.getElementById("userCountry");
    const userBalance = document.getElementById("userBalance");

    if (userName) {
      userName.textContent = getUserName(user);
    }

    if (userEmail) {
      userEmail.textContent = getUserEmail(user);
    }

    if (userCountry) {
      userCountry.textContent = getUserCountry(user);
    }

    if (userBalance) {
      userBalance.textContent = formatMoney(
        user.balance || 0
      );
    }

  } catch (error) {
    console.error("Unable to load selected user:", error);

    showToast(
      getErrorMessage(
        error,
        "Unable to load this customer's details."
      )
    );
  }
}


/* =========================================================
   FUND SELECTED BALANCE
========================================================= */

async function fundSelectedBalance(
  userId,
  amount,
  balanceType,
  currency
) {
  if (!userId) {
    throw new Error("No customer has been selected.");
  }

  if (!amount || amount <= 0) {
    throw new Error("Enter a valid amount greater than zero.");
  }

  const allowedBalances = {
    balance: "Wallet Balance",
    fundingBalance: "Funding Wallet",
    bonusBalance: "Bonus Balance",
    tradingProfit: "Trading Profit"
  };

  if (!Object.prototype.hasOwnProperty.call(
    allowedBalances,
    balanceType
  )) {
    throw new Error("Invalid balance type selected.");
  }

  const userRef = doc(db, "users", userId);

  const adminEmail =
    auth.currentUser?.email || "admin";

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      throw new Error(
        "This customer's account could not be found."
      );
    }

    const userData = userSnap.data();

    const currentAmount = Number(
      userData[balanceType] || 0
    );

    const newAmount = Number(
      (currentAmount + Number(amount)).toFixed(2)
    );

    const updateData = {
      [balanceType]: newAmount,

      updatedAt: serverTimestamp(),

      lastAdminFunding: {
        amount: Number(amount),
        currency: currency || "USD",
        balanceType,
        balanceName: allowedBalances[balanceType],
        adminEmail,
        createdAt: serverTimestamp()
      }
    };

    transaction.update(
      userRef,
      updateData
    );
  });
}


/* =========================================================
   ALL CUSTOMER RECORDS
========================================================= */

function setUsersStatus(
  text,
  icon = "fa-spinner fa-spin"
) {
  const status = document.getElementById(
    "usersStatus"
  );

  if (!status) return;

  status.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    ${escapeHtml(text)}
  `;
}


function renderUsers(users) {
  const table = document.getElementById(
    "allUsersTable"
  );

  if (!table) return;

  if (!users.length) {
    table.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="py-10 text-center text-slate-400"
        >
          <i class="fa-solid fa-users-slash text-xl"></i>

          <div class="mt-3 font-medium text-white">
            No customer records found.
          </div>

          <p class="mt-1 text-xs text-slate-500">
            No documents were found in the users collection.
          </p>
        </td>
      </tr>
    `;

    return;
  }

  table.innerHTML = users.map((user) => {
    const data = user.data;

    const name = escapeHtml(
      getUserName(data)
    );

    const email = escapeHtml(
      getUserEmail(data)
    );

    const country = escapeHtml(
      getUserCountry(data)
    );

    const walletBalance = formatMoney(
      data.balance || 0
    );

    const fundingBalance = formatMoney(
      data.fundingBalance || 0
    );

    const bonusBalance = formatMoney(
      data.bonusBalance || 0
    );

    const tradingProfit = formatMoney(
      data.tradingProfit || 0
    );

    return `
      <tr>

        <td>
          <div class="flex items-center gap-3">

            <div
              class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-yellow-400/10 text-yellow-400"
            >
              <i class="fa-solid fa-user"></i>
            </div>

            <div class="min-w-0">
              <div
                class="max-w-[180px] truncate font-semibold text-white"
              >
                ${name}
              </div>

              <div class="text-[11px] text-slate-500">
                ID: ${escapeHtml(user.id)}
              </div>
            </div>

          </div>
        </td>


        <td>
          <span
            class="max-w-[220px] truncate text-slate-300"
            title="${email}"
          >
            ${email}
          </span>
        </td>


        <td>
          <span class="text-slate-300">
            ${country}
          </span>
        </td>


        <td>
          <span class="balance-value">
            ${walletBalance}
          </span>
        </td>


        <td>
          <span class="font-semibold text-blue-300">
            ${fundingBalance}
          </span>
        </td>


        <td>
          <span class="font-semibold text-purple-300">
            ${bonusBalance}
          </span>
        </td>


        <td>
          <span class="font-semibold text-emerald-300">
            ${tradingProfit}
          </span>
        </td>

      </tr>
    `;
  }).join("");
}


async function loadAllUsers() {
  const table = document.getElementById(
    "allUsersTable"
  );

  if (table) {
    table.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="py-10 text-center text-slate-400"
        >
          <i class="fa-solid fa-spinner fa-spin text-yellow-400"></i>

          <div class="mt-3">
            Loading customer records...
          </div>
        </td>
      </tr>
    `;
  }

  setUsersStatus(
    "Loading",
    "fa-spinner fa-spin"
  );

  try {
    const usersSnapshot = await getDocs(
      collection(db, "users")
    );

    const users = usersSnapshot.docs.map((item) => ({
      id: item.id,
      data: item.data()
    }));

    users.sort((a, b) => {
      const dateA =
        a.data.createdAt?.toMillis?.() || 0;

      const dateB =
        b.data.createdAt?.toMillis?.() || 0;

      return dateB - dateA;
    });

    renderUsers(users);

    setUsersStatus(
      `${users.length} customer${users.length === 1 ? "" : "s"}`,
      "fa-users"
    );

  } catch (error) {
    console.error(
      "Unable to load customer records:",
      error
    );

    if (table) {
      table.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="py-10 text-center text-red-300"
          >
            <i class="fa-solid fa-triangle-exclamation text-xl"></i>

            <div class="mt-3 font-medium">
              Unable to load customer records.
            </div>

            <p class="mt-2 text-xs text-red-300/70">
              ${escapeHtml(
                getErrorMessage(
                  error,
                  "Firestore request failed."
                )
              )}
            </p>
          </td>
        </tr>
      `;
    }

    setUsersStatus(
      "Load failed",
      "fa-triangle-exclamation"
    );

    showToast(
      getErrorMessage(
        error,
        "Unable to load customer records."
      )
    );
  }
}


/* =========================================================
   PENDING REQUEST DETAILS
========================================================= */

function requestDetails(request) {
  if (request.type === "withdrawal") {

    if (request.method === "bitcoin") {
      return `
        Bitcoin address:
        ${escapeHtml(
          request.paymentDetails?.bitcoinAddress ||
          "Not supplied"
        )}
      `;
    }

    return `
      Bank:
      ${escapeHtml(
        request.paymentDetails?.bankName ||
        "Not supplied"
      )}
      · Account:
      ${escapeHtml(
        request.paymentDetails?.accountNumber ||
        "Not supplied"
      )}
    `;
  }

  return `
    Send to:
    ${escapeHtml(
      request.recipientEmail ||
      "Unknown recipient"
    )}
  `;
}


/* =========================================================
   RENDER PENDING REQUESTS
========================================================= */

function renderPendingRequests(requests) {
  const container =
    document.getElementById(
      "pendingRequests"
    );

  if (!container) return;

  if (!requests.length) {
    container.innerHTML = `
      <div class="py-10 text-center">

        <div
          class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-400"
        >
          <i class="fa-solid fa-check"></i>
        </div>

        <p class="mt-4 font-semibold text-white">
          All caught up
        </p>

        <p class="mt-1 text-sm text-slate-400">
          There are no pending transfers or withdrawals.
        </p>

      </div>
    `;

    return;
  }

  container.innerHTML = `
    <div class="grid gap-4 lg:grid-cols-2">

      ${requests.map((request) => {

        const isWithdrawal =
          request.type === "withdrawal";

        return `
          <article
            class="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
          >

            <div
              class="mb-4 flex items-start justify-between gap-3"
            >

              <div class="flex items-center gap-3">

                <div
                  class="grid h-11 w-11 place-items-center rounded-xl ${
                    isWithdrawal
                      ? "bg-yellow-400/10 text-yellow-400"
                      : "bg-blue-400/10 text-blue-400"
                  }"
                >
                  <i
                    class="fa-solid ${
                      isWithdrawal
                        ? "fa-arrow-up-right-from-square"
                        : "fa-paper-plane"
                    }"
                  ></i>
                </div>

                <div>

                  <p class="font-bold text-white">
                    ${
                      isWithdrawal
                        ? "Withdrawal request"
                        : "Transfer request"
                    }
                  </p>

                  <p class="mt-1 text-xs text-slate-400">
                    ${formatDate(request.createdAt)}
                  </p>

                </div>

              </div>


              <span class="status-pill">
                <i class="fa-solid fa-clock"></i>
                Pending
              </span>

            </div>


            <div
              class="space-y-2 rounded-xl bg-black/15 p-4 text-sm"
            >

              <div
                class="flex justify-between gap-4"
              >
                <span class="text-slate-400">
                  Customer
                </span>

                <span
                  class="max-w-[65%] truncate text-right font-semibold text-white"
                >
                  ${escapeHtml(
                    request.userEmail ||
                    request.senderEmail ||
                    "Unknown"
                  )}
                </span>
              </div>


              <div
                class="flex justify-between gap-4"
              >
                <span class="text-slate-400">
                  Amount
                </span>

                <span class="font-bold text-yellow-300">
                  ${formatMoney(request.amount)}
                </span>
              </div>


              <div
                class="flex justify-between gap-4"
              >
                <span class="text-slate-400">
                  Details
                </span>

                <span
                  class="max-w-[65%] text-right text-xs font-medium text-slate-300"
                >
                  ${requestDetails(request)}
                </span>
              </div>

            </div>


            <div class="mt-4 grid grid-cols-2 gap-3">

              <button
                class="btn btn-success request-action"
                data-action="approve"
                data-type="${escapeHtml(request.type)}"
                data-id="${escapeHtml(request.id)}"
              >
                <i class="fa-solid fa-check"></i>
                Approve
              </button>


              <button
                class="btn btn-danger request-action"
                data-action="decline"
                data-type="${escapeHtml(request.type)}"
                data-id="${escapeHtml(request.id)}"
              >
                <i class="fa-solid fa-xmark"></i>
                Decline
              </button>

            </div>

          </article>
        `;
      }).join("")}

    </div>
  `;
}


/* =========================================================
   LOAD PENDING REQUESTS
========================================================= */

async function loadPendingRequests() {
  const container =
    document.getElementById(
      "pendingRequests"
    );

  if (!container) return;

  container.innerHTML = `
    <div class="py-8 text-center text-slate-400">

      <i class="fa-solid fa-spinner fa-spin text-yellow-400"></i>

      <p class="mt-3 text-sm">
        Loading pending requests...
      </p>

    </div>
  `;

  try {

    const [
      withdrawals,
      transfers
    ] = await Promise.all([

      getDocs(
        query(
          collection(db, "withdrawals"),
          where("status", "==", "pending")
        )
      ),

      getDocs(
        query(
          collection(db, "transfers"),
          where("status", "==", "pending")
        )
      )

    ]);


    const requests = [

      ...withdrawals.docs.map((item) => ({
        id: item.id,
        type: "withdrawal",
        ...item.data()
      })),

      ...transfers.docs.map((item) => ({
        id: item.id,
        type: "transfer",
        ...item.data()
      }))

    ].sort((a, b) => {

      const timeA =
        a.createdAt?.toMillis?.() || 0;

      const timeB =
        b.createdAt?.toMillis?.() || 0;

      return timeB - timeA;
    });


    renderPendingRequests(requests);

  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="py-10 text-center text-red-300">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <p class="mt-3 text-sm">
          Unable to load pending requests.
        </p>

      </div>
    `;

  }
}


/* =========================================================
   REVIEW WITHDRAWAL
========================================================= */

async function reviewWithdrawal(
  withdrawalId,
  action
) {
  const withdrawalRef =
    doc(
      db,
      "withdrawals",
      withdrawalId
    );

  const adminEmail =
    auth.currentUser?.email || "admin";


  await runTransaction(
    db,
    async (transaction) => {

      const withdrawalSnap =
        await transaction.get(
          withdrawalRef
        );


      if (!withdrawalSnap.exists()) {
        throw new Error(
          "This withdrawal request no longer exists."
        );
      }


      const withdrawal =
        withdrawalSnap.data();


      if (
        withdrawal.status !== "pending"
      ) {
        throw new Error(
          "This withdrawal has already been reviewed."
        );
      }


      const update = {
        status:
          action === "approve"
            ? "completed"
            : "rejected",

        reviewedAt:
          serverTimestamp(),

        reviewedBy:
          adminEmail
      };


      if (action === "decline") {

        const userRef =
          doc(
            db,
            "users",
            withdrawal.userId
          );

        const userSnap =
          await transaction.get(
            userRef
          );


        if (!userSnap.exists()) {
          throw new Error(
            "The withdrawal user's wallet no longer exists."
          );
        }


        const currentBalance =
          Number(
            userSnap.data().balance || 0
          );


        const refundedBalance =
          Number(
            (
              currentBalance +
              Number(
                withdrawal.amount || 0
              )
            ).toFixed(2)
          );


        transaction.update(
          userRef,
          {
            balance:
              refundedBalance
          }
        );


        update.refundedAt =
          serverTimestamp();
      }


      transaction.update(
        withdrawalRef,
        update
      );

    }
  );
}


/* =========================================================
   REVIEW TRANSFER
========================================================= */

async function reviewTransfer(
  transferId,
  action
) {
  const transferRef =
    doc(
      db,
      "transfers",
      transferId
    );

  const adminEmail =
    auth.currentUser?.email || "admin";


  await runTransaction(
    db,
    async (transaction) => {

      const transferSnap =
        await transaction.get(
          transferRef
        );


      if (!transferSnap.exists()) {
        throw new Error(
          "This transfer request no longer exists."
        );
      }


      const transfer =
        transferSnap.data();


      if (
        transfer.status !== "pending"
      ) {
        throw new Error(
          "This transfer has already been reviewed."
        );
      }


      if (action === "decline") {

        transaction.update(
          transferRef,
          {
            status: "rejected",
            reviewedAt:
              serverTimestamp(),
            reviewedBy:
              adminEmail
          }
        );

        return;
      }


      const senderRef =
        doc(
          db,
          "users",
          transfer.senderId
        );

      const recipientRef =
        doc(
          db,
          "users",
          transfer.recipientId
        );


      const [
        senderSnap,
        recipientSnap
      ] = await Promise.all([

        transaction.get(
          senderRef
        ),

        transaction.get(
          recipientRef
        )

      ]);


      if (
        !senderSnap.exists() ||
        !recipientSnap.exists()
      ) {
        throw new Error(
          "Sender or recipient account could not be found."
        );
      }


      const amount =
        Number(
          transfer.amount || 0
        );


      const senderBalance =
        Number(
          senderSnap.data().balance || 0
        );


      const recipientBalance =
        Number(
          recipientSnap.data().balance || 0
        );


      if (
        !amount ||
        amount <= 0
      ) {
        throw new Error(
          "This request has an invalid transfer amount."
        );
      }


      if (
        senderBalance < amount
      ) {
        throw new Error(
          "Sender no longer has enough funds for this transfer."
        );
      }


      transaction.update(
        senderRef,
        {
          balance:
            Number(
              (
                senderBalance -
                amount
              ).toFixed(2)
            )
        }
      );


      transaction.update(
        recipientRef,
        {
          balance:
            Number(
              (
                recipientBalance +
                amount
              ).toFixed(2)
            )
        }
      );


      transaction.update(
        transferRef,
        {
          status: "completed",

          reviewedAt:
            serverTimestamp(),

          reviewedBy:
            adminEmail
        }
      );

    }
  );
}


/* =========================================================
   DOM READY
========================================================= */

window.addEventListener(
  "DOMContentLoaded",
  () => {

    initAuth();

    createToastContainer();


    /* -----------------------------------------
       ELEMENTS
    ----------------------------------------- */

    const loginForm =
      document.getElementById(
        "loginForm"
      );

    const logoutBtn =
      document.getElementById(
        "logoutBtn"
      );

    const searchBtn =
      document.getElementById(
        "searchBtn"
      );

    const searchEmail =
      document.getElementById(
        "searchEmail"
      );

    const fundForm =
      document.getElementById(
        "fundForm"
      );

    const fundAmount =
      document.getElementById(
        "fundAmount"
      );

    const fundBalanceType =
      document.getElementById(
        "fundBalanceType"
      );

    const fundCurrency =
      document.getElementById(
        "fundCurrency"
      );

    const refreshRequestsBtn =
      document.getElementById(
        "refreshRequestsBtn"
      );

    const pendingRequests =
      document.getElementById(
        "pendingRequests"
      );


    /* =====================================================
       LOGIN
    ===================================================== */

    if (loginForm) {

      loginForm.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();

          const button =
            loginForm.querySelector(
              'button[type="submit"]'
            );


          const password =
            document
              .getElementById(
                "adminPassword"
              )
              ?.value
              .trim();


          if (!password) {
            showToast(
              "Enter your admin password to continue."
            );

            return;
          }


          try {

            setButtonLoading(
              button,
              true,
              "Signing in..."
            );


            await login();


            showToast(
              "Dashboard access granted.",
              "success"
            );


            await Promise.all([
              loadPendingRequests(),
              loadAllUsers()
            ]);

          } catch (error) {

            showToast(
              getErrorMessage(
                error,
                "Unable to sign in."
              )
            );

          } finally {

            setButtonLoading(
              button,
              false
            );

          }

        }
      );

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    if (logoutBtn) {

      logoutBtn.addEventListener(
        "click",
        async () => {

          try {

            setButtonLoading(
              logoutBtn,
              true,
              "Logging out..."
            );


            await logout();

          } catch (error) {

            showToast(
              getErrorMessage(
                error,
                "Unable to log out."
              )
            );

          } finally {

            setButtonLoading(
              logoutBtn,
              false
            );

          }

        }
      );

    }


    /* =====================================================
       SEARCH USER
    ===================================================== */

    if (searchBtn) {

      searchBtn.addEventListener(
        "click",
        async () => {

          const email =
            searchEmail?.value.trim();


          if (
            !email ||
            !email.includes("@")
          ) {

            showToast(
              "Enter a valid user email address."
            );

            searchEmail?.focus();

            return;
          }


          try {

            currentUserId = null;

            setButtonLoading(
              searchBtn,
              true,
              "Searching..."
            );


            currentUserId =
              await searchUser();


            if (!currentUserId) {

              showToast(
                "No matching user was found."
              );

              return;
            }


            await loadSelectedUser(
              currentUserId
            );


            showToast(
              "User found. Wallet funding is now available.",
              "success"
            );

          } catch (error) {

            currentUserId = null;

            clearSelectedUser();

            showToast(
              getErrorMessage(
                error,
                "Unable to find this user."
              )
            );

          } finally {

            setButtonLoading(
              searchBtn,
              false
            );

          }

        }
      );

    }


    /* =====================================================
       FUND USER
    ===================================================== */

    if (fundForm) {

      fundForm.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();


          const button =
            fundForm.querySelector(
              'button[type="submit"]'
            );


          const amount =
            Number(
              fundAmount?.value
            );


          const balanceType =
            fundBalanceType?.value ||
            "balance";


          const currency =
            fundCurrency?.value ||
            "USD";


          if (!currentUserId) {

            showToast(
              "Search for a user before funding their account."
            );

            return;
          }


          if (
            !amount ||
            amount <= 0
          ) {

            showToast(
              "Enter a valid amount greater than zero."
            );

            return;
          }


          try {

            setButtonLoading(
              button,
              true,
              "Funding account..."
            );


            await fundSelectedBalance(
              currentUserId,
              amount,
              balanceType,
              currency
            );


            const balanceNames = {
              balance: "Wallet Balance",
              fundingBalance: "Funding Wallet",
              bonusBalance: "Bonus Balance",
              tradingProfit: "Trading Profit"
            };


            fundForm.reset();


            if (fundBalanceType) {
              fundBalanceType.value =
                balanceType;
            }


            if (fundCurrency) {
              fundCurrency.value =
                currency;
            }


            await Promise.all([
              loadSelectedUser(
                currentUserId
              ),
              loadAllUsers()
            ]);


            showToast(
              `${formatMoney(amount)} added to ${balanceNames[balanceType]}.`,
              "success"
            );

          } catch (error) {

            console.error(
              "Funding error:",
              error
            );

            showToast(
              getErrorMessage(
                error,
                "Account funding failed."
              )
            );

          } finally {

            setButtonLoading(
              button,
              false
            );

          }

        }
      );

    }


    /* =====================================================
       ENTER TO SEARCH
    ===================================================== */

    searchEmail?.addEventListener(
      "keydown",
      (event) => {

        if (event.key === "Enter") {

          event.preventDefault();

          searchBtn?.click();

        }

      }
    );


    /* =====================================================
       REFRESH PENDING REQUESTS
    ===================================================== */

    refreshRequestsBtn?.addEventListener(
      "click",
      async () => {

        await loadPendingRequests();

        showToast(
          "Pending requests refreshed.",
          "info"
        );

      }
    );


    /* =====================================================
       PENDING REQUEST ACTIONS
    ===================================================== */

    pendingRequests?.addEventListener(
      "click",
      async (event) => {

        const button =
          event.target.closest(
            ".request-action"
          );


        if (!button) return;


        const action =
          button.dataset.action;

        const type =
          button.dataset.type;

        const requestId =
          button.dataset.id;

        const approved =
          action === "approve";


        const confirmed =
          window.confirm(
            approved
              ? `Approve this ${type} request?`
              : `Decline this ${type} request?${
                  type === "withdrawal"
                    ? " The user's balance will be refunded."
                    : ""
                }`
          );


        if (!confirmed) return;


        try {

          setButtonLoading(
            button,
            true,
            approved
              ? "Approving..."
              : "Declining..."
          );


          if (
            type === "withdrawal"
          ) {

            await reviewWithdrawal(
              requestId,
              action
            );

          } else {

            await reviewTransfer(
              requestId,
              action
            );

          }


          showToast(
            approved
              ? `${type} approved successfully.`
              : `${type} declined successfully.`,
            "success"
          );


          await Promise.all([
            loadPendingRequests(),
            loadAllUsers()
          ]);

        } catch (error) {

          console.error(error);

          showToast(
            getErrorMessage(
              error,
              `Unable to review this ${type}.`
            )
          );

        } finally {

          setButtonLoading(
            button,
            false
          );

        }

      }
    );


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    setTimeout(
      async () => {

        await Promise.all([
          loadPendingRequests(),
          loadAllUsers()
        ]);

      },
      1000
    );

  }
);
