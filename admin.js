// ============================================================
// SYNC CRYPTO - ADMIN DASHBOARD
// ============================================================

import {
  initAuth,
  login,
  logout
} from "./auth.js";

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
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


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAVYYdxtOnixpdGJOWqVKrFczTQrWV8jLo",
  authDomain: "synccrypto-fa0ac.firebaseapp.com",
  projectId: "synccrypto-fa0ac",
  storageBucket: "synccrypto-fa0ac.firebasestorage.app",
  messagingSenderId: "609980963372",
  appId: "1:609980963372:web:f0f3addb7cdcb555230f89",
  measurementId: "G-R3R5153SDR"
};


// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


// ============================================================
// GLOBAL SELECTED USER
// ============================================================

// This is the important fix for the funding problem.
// Once a user is found, their exact Firestore document ID
// is stored here and used by the funding form.
let selectedUserId = null;
let selectedUserData = null;


// ============================================================
// SHORT DOM HELPER
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// TOAST
// ============================================================

function showToast(message, type = "info") {
  let toast = $("adminToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "adminToast";

    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.right = "24px";
    toast.style.zIndex = "99999";
    toast.style.padding = "14px 18px";
    toast.style.borderRadius = "12px";
    toast.style.color = "#fff";
    toast.style.fontSize = "14px";
    toast.style.fontWeight = "700";
    toast.style.maxWidth = "360px";
    toast.style.boxShadow = "0 15px 40px rgba(0,0,0,.35)";
    toast.style.transition = "all .25s ease";

    document.body.appendChild(toast);
  }

  if (type === "success") {
    toast.style.background = "#059669";
  } else if (type === "error") {
    toast.style.background = "#dc2626";
  } else if (type === "warning") {
    toast.style.background = "#d97706";
  } else {
    toast.style.background = "#2563eb";
  }

  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  clearTimeout(toast._timeout);

  toast._timeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
  }, 3500);
}


// ============================================================
// BUTTON LOADING
// ============================================================

function setButtonLoading(button, loading, loadingText = "Processing...") {
  if (!button) return;

  if (loading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }

    button.disabled = true;

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      ${loadingText}
    `;
  } else {
    button.disabled = false;

    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}


// ============================================================
// MONEY FORMAT
// ============================================================

function formatMoney(value, currency = "USD") {
  const amount = Number(value) || 0;

  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(value) {
  if (!value) return "—";

  try {
    if (value?.toDate) {
      return value.toDate().toLocaleString();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString();
  } catch {
    return "—";
  }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================
// SHOW DASHBOARD
// ============================================================

function showAdminDashboard() {
  const loginSection = $("loginSection");
  const dashboardSection = $("dashboardSection");

  if (loginSection) {
    loginSection.classList.add("hidden-section");
  }

  if (dashboardSection) {
    dashboardSection.classList.remove("hidden-section");
  }
}


// ============================================================
// SHOW LOGIN
// ============================================================

function showAdminLogin() {
  const loginSection = $("loginSection");
  const dashboardSection = $("dashboardSection");

  if (loginSection) {
    loginSection.classList.remove("hidden-section");
  }

  if (dashboardSection) {
    dashboardSection.classList.add("hidden-section");
  }

  selectedUserId = null;
  selectedUserData = null;
}


// ============================================================
// DISPLAY SELECTED USER
// ============================================================

function displaySelectedUser(userData) {
  const userName = $("userName");
  const userEmail = $("userEmailCard");
  const userCountry = $("userCountry");
  const userBalance = $("userBalance");
  const userCard = $("userCard");
  const fundForm = $("fundForm");

  if (userName) {
    userName.textContent =
      userData.name ||
      userData.fullName ||
      userData.displayName ||
      "Unnamed User";
  }

  if (userEmail) {
    userEmail.textContent =
      userData.email || "No email";
  }

  if (userCountry) {
    userCountry.textContent =
      userData.country || "—";
  }

  if (userBalance) {
    userBalance.innerHTML = `
      <div class="space-y-1 text-sm">
        <div>
          <span class="text-slate-500">Wallet:</span>
          <span class="font-bold text-yellow-300">
            ${formatMoney(
              userData.balance,
              userData.currency || "USD"
            )}
          </span>
        </div>

        <div>
          <span class="text-slate-500">Funding:</span>
          <span class="font-bold text-yellow-300">
            ${formatMoney(
              userData.fundingBalance,
              userData.currency || "USD"
            )}
          </span>
        </div>

        <div>
          <span class="text-slate-500">Bonus:</span>
          <span class="font-bold text-yellow-300">
            ${formatMoney(
              userData.bonusBalance,
              userData.currency || "USD"
            )}
          </span>
        </div>

        <div>
          <span class="text-slate-500">Trading:</span>
          <span class="font-bold text-yellow-300">
            ${formatMoney(
              userData.tradingProfit,
              userData.currency || "USD"
            )}
          </span>
        </div>
      </div>
    `;
  }

  // Store the exact ID on the form as an extra safeguard.
  if (fundForm) {
    fundForm.dataset.userId = selectedUserId;
  }

  if (userCard) {
    userCard.classList.remove("hidden-section");
  }
}


// ============================================================
// LOAD USER BY DOCUMENT ID
// ============================================================

async function loadSelectedUser(userId) {
  if (!userId) {
    throw new Error("No user selected.");
  }

  const userRef = doc(db, "users", userId);

  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User record not found.");
  }

  selectedUserId = userSnap.id;

  selectedUserData = {
    id: userSnap.id,
    ...userSnap.data()
  };

  displaySelectedUser(selectedUserData);

  return selectedUserData;
}


// ============================================================
// SEARCH USER
// ============================================================

async function handleUserSearch() {
  const searchInput = $("searchEmail");
  const searchButton = $("searchBtn");

  if (!searchInput) return;

  const email = searchInput.value.trim().toLowerCase();

  if (!email) {
    showToast(
      "Enter the customer's email address.",
      "warning"
    );
    return;
  }

  try {
    setButtonLoading(
      searchButton,
      true,
      "Searching..."
    );

    // Clear previous selection first.
    selectedUserId = null;
    selectedUserData = null;

    const usersRef = collection(db, "users");

    // Search directly in Firestore.
    const usersQuery = query(
      usersRef,
      where("email", "==", email)
    );

    const snapshot = await getDocs(usersQuery);

    if (snapshot.empty) {
      showToast(
        "User not found.",
        "error"
      );
      return;
    }

    // Get the exact Firestore document.
    const userDoc = snapshot.docs[0];

    selectedUserId = userDoc.id;

    selectedUserData = {
      id: userDoc.id,
      ...userDoc.data()
    };

    // Store it on the form too.
    const fundForm = $("fundForm");

    if (fundForm) {
      fundForm.dataset.userId = selectedUserId;
    }

    displaySelectedUser(selectedUserData);

    showToast(
      "Customer found successfully.",
      "success"
    );

    console.log(
      "Selected customer:",
      selectedUserId,
      selectedUserData
    );

  } catch (error) {
    console.error(
      "Search user error:",
      error
    );

    showToast(
      error.message ||
      "Unable to search for customer.",
      "error"
    );

  } finally {
    setButtonLoading(
      searchButton,
      false
    );
  }
}


// ============================================================
// FUND USER BALANCE
// ============================================================

async function fundSelectedBalance(
  userId,
  amount,
  balanceType,
  currency
) {
  if (!userId) {
    throw new Error(
      "Please search for a customer first."
    );
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error(
      "Enter a valid amount."
    );
  }

  const allowedBalances = [
    "balance",
    "fundingBalance",
    "bonusBalance",
    "tradingProfit"
  ];

  if (!allowedBalances.includes(balanceType)) {
    throw new Error(
      "Invalid balance selected."
    );
  }

  const userRef = doc(
    db,
    "users",
    userId
  );

  await runTransaction(
    db,
    async (transaction) => {

      const userSnap =
        await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error(
          "User record no longer exists."
        );
      }

      const userData =
        userSnap.data();

      const previousBalance =
        Number(userData[balanceType]) || 0;

      const newBalance =
        previousBalance + numericAmount;

      transaction.update(
        userRef,
        {
          [balanceType]: newBalance,

          updatedAt:
            serverTimestamp(),

          lastAdminFunding: {
            amount: numericAmount,
            balanceType,
            currency:
              currency || "USD",
            previousBalance,
            newBalance,
            updatedAt:
              new Date().toISOString()
          }
        }
      );
    }
  );
}


// ============================================================
// FUNDING FORM
// ============================================================

async function handleFunding(event) {
  event.preventDefault();

  const form = event.currentTarget;

  // Get ID from global variable first.
  // Dataset is the backup.
  const userId =
    selectedUserId ||
    form.dataset.userId;

  const balanceType =
    $("fundBalanceType")?.value;

  const amount =
    $("fundAmount")?.value;

  const currency =
    $("fundCurrency")?.value || "USD";

  const submitButton =
    form.querySelector(
      "button[type='submit']"
    );

  // Important: verify selected user.
  if (!userId) {
    showToast(
      "Please search and select a customer first.",
      "warning"
    );
    return;
  }

  if (!balanceType) {
    showToast(
      "Select a balance type.",
      "warning"
    );
    return;
  }

  if (!amount || Number(amount) <= 0) {
    showToast(
      "Enter a valid amount.",
      "warning"
    );
    return;
  }

  try {
    setButtonLoading(
      submitButton,
      true,
      "Funding..."
    );

    console.log(
      "Funding user:",
      userId
    );

    console.log(
      "Balance:",
      balanceType
    );

    console.log(
      "Amount:",
      amount
    );

    await fundSelectedBalance(
      userId,
      amount,
      balanceType,
      currency
    );

    // Reload the customer's current data.
    await loadSelectedUser(userId);

    // Reload all customer records.
    await loadAllUsers();

    // Clear only the amount.
    if ($("fundAmount")) {
      $("fundAmount").value = "";
    }

    showToast(
      "Customer balance funded successfully.",
      "success"
    );

  } catch (error) {
    console.error(
      "Funding error:",
      error
    );

    showToast(
      error.message ||
      "Unable to fund customer balance.",
      "error"
    );

  } finally {
    setButtonLoading(
      submitButton,
      false
    );
  }
}


// ============================================================
// LOAD ALL USERS
// ============================================================

async function loadAllUsers() {
  const table = $("allUsersTable");
  const status = $("usersStatus");

  if (!table) return;

  try {
    if (status) {
      status.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Loading
      `;
    }

    const usersSnapshot =
      await getDocs(
        collection(db, "users")
      );

    const users = [];

    usersSnapshot.forEach(
      (userDoc) => {
        users.push({
          id: userDoc.id,
          ...userDoc.data()
        });
      }
    );

    users.sort((a, b) => {
      const aTime =
        a.createdAt?.toMillis?.() ||
        new Date(
          a.createdAt || 0
        ).getTime() ||
        0;

      const bTime =
        b.createdAt?.toMillis?.() ||
        new Date(
          b.createdAt || 0
        ).getTime() ||
        0;

      return bTime - aTime;
    });

    if (users.length === 0) {
      table.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="py-10 text-center text-slate-400"
          >
            No customer records found.
          </td>
        </tr>
      `;

      if (status) {
        status.innerHTML = `
          <i class="fa-solid fa-users"></i>
          0 Customers
        `;
      }

      return;
    }

    table.innerHTML = users.map(
      (user) => `
        <tr>

          <td>
            <div class="font-semibold text-white">
              ${escapeHTML(
                user.name ||
                user.fullName ||
                user.displayName ||
                "Unnamed"
              )}
            </div>
          </td>

          <td>
            ${escapeHTML(
              user.email || "—"
            )}
          </td>

          <td>
            ${escapeHTML(
              user.country || "—"
            )}
          </td>

          <td class="balance-value">
            ${formatMoney(
              user.balance,
              user.currency || "USD"
            )}
          </td>

          <td class="balance-value">
            ${formatMoney(
              user.fundingBalance,
              user.currency || "USD"
            )}
          </td>

          <td class="balance-value">
            ${formatMoney(
              user.bonusBalance,
              user.currency || "USD"
            )}
          </td>

          <td class="balance-value">
            ${formatMoney(
              user.tradingProfit,
              user.currency || "USD"
            )}
          </td>

        </tr>
      `
    ).join("");

    if (status) {
      status.innerHTML = `
        <i class="fa-solid fa-users"></i>
        ${users.length}
        Customer${users.length === 1 ? "" : "s"}
      `;
    }

  } catch (error) {
    console.error(
      "Load all users error:",
      error
    );

    if (status) {
      status.innerHTML = `
        <i class="fa-solid fa-circle-exclamation"></i>
        Error
      `;
    }

    showToast(
      error.message ||
      "Unable to load customer records.",
      "error"
    );
  }
}


// ============================================================
// LOAD PENDING WITHDRAWALS
// ============================================================

async function loadPendingRequests() {
  const container =
    $("pendingRequests");

  if (!container) return;

  try {
    container.innerHTML = `
      <div class="py-10 text-center text-slate-400">
        <i class="fa-solid fa-spinner fa-spin text-yellow-400 text-xl"></i>
        <p class="mt-3 text-sm">
          Loading pending requests...
        </p>
      </div>
    `;

    const requestsQuery = query(
      collection(db, "withdrawals"),
      where("status", "==", "pending")
    );

    const snapshot =
      await getDocs(requestsQuery);

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="rounded-2xl border border-white/5 bg-black/10 py-10 text-center">
          <div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-400/10 text-emerald-400">
            <i class="fa-solid fa-check"></i>
          </div>

          <h3 class="mt-4 font-bold text-white">
            No Pending Requests
          </h3>

          <p class="mt-1 text-sm text-slate-500">
            There are currently no withdrawal requests waiting for review.
          </p>
        </div>
      `;

      return;
    }

    const requests = [];

    snapshot.forEach(
      (requestDoc) => {
        requests.push({
          id: requestDoc.id,
          ...requestDoc.data()
        });
      }
    );

    requests.sort((a, b) => {
      const aTime =
        a.createdAt?.toMillis?.() ||
        new Date(a.createdAt || 0).getTime() ||
        0;

      const bTime =
        b.createdAt?.toMillis?.() ||
        new Date(b.createdAt || 0).getTime() ||
        0;

      return bTime - aTime;
    });

    container.innerHTML =
      requests.map(
        (request) => `
          <div
            class="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-black/10"
            data-request-id="${escapeHTML(request.id)}"
          >

            <!-- Request header -->
            <div class="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">

              <div class="flex items-center gap-3">

                <div class="grid h-11 w-11 place-items-center rounded-xl bg-yellow-400/10 text-yellow-400">
                  <i class="fa-solid fa-money-bill-transfer"></i>
                </div>

                <div>
                  <p class="font-bold text-white">
                    Withdrawal Request
                  </p>

                  <p class="text-xs text-slate-500">
                    ${formatDate(request.createdAt)}
                  </p>
                </div>

              </div>

              <span class="inline-flex w-fit items-center gap-1.5 rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300">
                <span class="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
                Pending
              </span>

            </div>


            <!-- Request details -->
            <div class="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">

              <div>
                <p class="text-xs text-slate-500">
                  Customer
                </p>

                <p class="mt-1 truncate font-semibold text-white">
                  ${escapeHTML(
                    request.name ||
                    request.fullName ||
                    request.email ||
                    request.userEmail ||
                    "Unknown User"
                  )}
                </p>
              </div>


              <div>
                <p class="text-xs text-slate-500">
                  Email
                </p>

                <p class="mt-1 truncate font-semibold text-white">
                  ${escapeHTML(
                    request.email ||
                    request.userEmail ||
                    "—"
                  )}
                </p>
              </div>


              <div>
                <p class="text-xs text-slate-500">
                  Amount
                </p>

                <p class="mt-1 font-bold text-yellow-300">
                  ${formatMoney(
                    request.amount,
                    request.currency || "USD"
                  )}
                </p>
              </div>


              <div>
                <p class="text-xs text-slate-500">
                  Method
                </p>

                <p class="mt-1 font-semibold text-white">
                  ${escapeHTML(
                    request.method ||
                    request.withdrawalMethod ||
                    "—"
                  )}
                </p>
              </div>

            </div>


            <!-- Actions -->
            <div class="flex flex-col gap-3 border-t border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                class="btn btn-danger reject-withdrawal w-full sm:w-auto"
                data-id="${escapeHTML(request.id)}"
              >
                <i class="fa-solid fa-xmark"></i>
                Reject Request
              </button>

              <button
                type="button"
                class="btn btn-success approve-withdrawal w-full sm:w-auto"
                data-id="${escapeHTML(request.id)}"
              >
                <i class="fa-solid fa-check"></i>
                Approve Request
              </button>

            </div>

          </div>
        `
      ).join("");

  } catch (error) {
    console.error(
      "Load pending requests error:",
      error
    );

    container.innerHTML = `
      <div class="rounded-2xl border border-red-400/10 bg-red-400/5 p-6 text-center">

        <div class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-400/10 text-red-400">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>

        <p class="mt-3 font-semibold text-white">
          Unable to load requests
        </p>

        <p class="mt-1 text-sm text-slate-500">
          ${escapeHTML(
            error.message ||
            "Please try again."
          )}
        </p>

      </div>
    `;
  }
}


// ============================================================
// UPDATE WITHDRAWAL STATUS
// ============================================================

async function updateWithdrawalStatus(
  requestId,
  newStatus
) {
  if (!requestId) {
    throw new Error(
      "Invalid request ID."
    );
  }

  const requestRef =
    doc(
      db,
      "withdrawals",
      requestId
    );

  await runTransaction(
    db,
    async (transaction) => {

      const requestSnap =
        await transaction.get(
          requestRef
        );

      if (!requestSnap.exists()) {
        throw new Error(
          "Withdrawal request not found."
        );
      }

      const requestData =
        requestSnap.data();

      if (
        requestData.status &&
        requestData.status !== "pending"
      ) {
        throw new Error(
          "This request has already been processed."
        );
      }

      transaction.update(
        requestRef,
        {
          status: newStatus,
          reviewedAt:
            serverTimestamp(),
          reviewedBy:
            auth.currentUser?.email ||
            "admin"
        }
      );
    }
  );
}


// ============================================================
// APPROVE / REJECT BUTTONS
// ============================================================

async function handlePendingRequestClick(event) {

  const approveButton =
    event.target.closest(
      ".approve-withdrawal"
    );

  const rejectButton =
    event.target.closest(
      ".reject-withdrawal"
    );

  if (!approveButton && !rejectButton) {
    return;
  }

  const button =
    approveButton || rejectButton;

  const requestId =
    button.dataset.id;

  const isApprove =
    Boolean(approveButton);

  const newStatus =
    isApprove
      ? "approved"
      : "rejected";

  const actionText =
    isApprove
      ? "approve"
      : "reject";

  const confirmed =
    window.confirm(
      `Are you sure you want to ${actionText} this request?`
    );

  if (!confirmed) {
    return;
  }

  try {

    setButtonLoading(
      button,
      true,
      isApprove
        ? "Approving..."
        : "Rejecting..."
    );

    // Disable the other button immediately.
    const card =
      button.closest(
        "[data-request-id]"
      );

    const otherButton =
      card?.querySelector(
        isApprove
          ? ".reject-withdrawal"
          : ".approve-withdrawal"
      );

    if (otherButton) {
      otherButton.disabled = true;
    }

    await updateWithdrawalStatus(
      requestId,
      newStatus
    );

    showToast(
      isApprove
        ? "Withdrawal approved successfully."
        : "Withdrawal rejected successfully.",
      "success"
    );

    await loadPendingRequests();

  } catch (error) {

    console.error(
      "Request action error:",
      error
    );

    showToast(
      error.message ||
      `Unable to ${actionText} request.`,
      "error"
    );

    setButtonLoading(
      button,
      false
    );

  }
}


// ============================================================
// AUTH STATE
// ============================================================

function setupAuthListener() {

  onAuthStateChanged(
    auth,
    async (user) => {

      if (user) {

        showAdminDashboard();

        try {

          await Promise.all([
            loadPendingRequests(),
            loadAllUsers()
          ]);

        } catch (error) {

          console.error(
            "Dashboard loading error:",
            error
          );

        }

      } else {

        showAdminLogin();

      }

    }
  );
}


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    // Initialize authentication.
    try {
      initAuth();
    } catch (error) {
      console.error(
        "Auth initialization error:",
        error
      );
    }

    // Listen for Firebase login state.
    setupAuthListener();


    // ========================================================
    // LOGIN
    // ========================================================

    const loginForm =
      $("loginForm");

    if (loginForm) {

      loginForm.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();

          const loginButton =
            loginForm.querySelector(
              "button[type='submit']"
            );

          const passwordInput =
            $("adminPassword");

          if (!passwordInput?.value) {

            showToast(
              "Enter your admin password.",
              "warning"
            );

            return;
          }

          try {

            setButtonLoading(
              loginButton,
              true,
              "Signing in..."
            );

            await login();

            showAdminDashboard();

            if (passwordInput) {
              passwordInput.value = "";
            }

            showToast(
              "Dashboard access granted.",
              "success"
            );

          } catch (error) {

            console.error(
              "Login error:",
              error
            );

            showToast(
              error.message ||
              "Login failed.",
              "error"
            );

          } finally {

            setButtonLoading(
              loginButton,
              false
            );

          }

        }
      );
    }


    // ========================================================
    // LOGOUT
    // ========================================================

    const logoutButton =
      $("logoutBtn");

    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        async () => {

          try {

            setButtonLoading(
              logoutButton,
              true,
              "Logging out..."
            );

            await logout();

            showAdminLogin();

            showToast(
              "Logged out successfully.",
              "success"
            );

          } catch (error) {

            console.error(
              "Logout error:",
              error
            );

            showToast(
              error.message ||
              "Unable to logout.",
              "error"
            );

          } finally {

            setButtonLoading(
              logoutButton,
              false
            );

          }

        }
      );
    }


    // ========================================================
    // SEARCH
    // ========================================================

    const searchButton =
      $("searchBtn");

    if (searchButton) {
      searchButton.addEventListener(
        "click",
        handleUserSearch
      );
    }


    const searchInput =
      $("searchEmail");

    if (searchInput) {

      searchInput.addEventListener(
        "keydown",
        (event) => {

          if (event.key === "Enter") {

            event.preventDefault();

            handleUserSearch();

          }

        }
      );

    }


    // ========================================================
    // FUND FORM
    // ========================================================

    const fundForm =
      $("fundForm");

    if (fundForm) {

      fundForm.addEventListener(
        "submit",
        handleFunding
      );

    }


    // ========================================================
    // REFRESH REQUESTS
    // ========================================================

    const refreshButton =
      $("refreshRequestsBtn");

    if (refreshButton) {

      refreshButton.addEventListener(
        "click",
        async () => {

          try {

            setButtonLoading(
              refreshButton,
              true,
              "Refreshing..."
            );

            await loadPendingRequests();

            showToast(
              "Requests refreshed.",
              "success"
            );

          } catch (error) {

            console.error(
              error
            );

          } finally {

            setButtonLoading(
              refreshButton,
              false
            );

          }

        }
      );

    }


    // ========================================================
    // PENDING REQUEST ACTIONS
    // ========================================================

    const pendingRequests =
      $("pendingRequests");

    if (pendingRequests) {

      pendingRequests.addEventListener(
        "click",
        handlePendingRequestClick
      );

    }

  }
);
