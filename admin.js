// ============================================================
// SYNC CRYPTO - ADMIN DASHBOARD
// ============================================================

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
// INITIALIZE FIREBASE
// ============================================================

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


// ============================================================
// DOM HELPERS
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
    toast.style.bottom = "25px";
    toast.style.right = "25px";
    toast.style.zIndex = "99999";
    toast.style.padding = "14px 18px";
    toast.style.borderRadius = "10px";
    toast.style.color = "#fff";
    toast.style.fontSize = "14px";
    toast.style.fontWeight = "600";
    toast.style.maxWidth = "350px";
    toast.style.boxShadow = "0 10px 30px rgba(0,0,0,.25)";
    toast.style.transition = "all .3s ease";

    document.body.appendChild(toast);
  }

  if (type === "success") {
    toast.style.background = "#16a34a";
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
    toast.style.transform = "translateY(10px)";
  }, 3500);
}


// ============================================================
// LOADING BUTTON
// ============================================================

function setButtonLoading(button, loading, loadingText = "Processing...") {
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText;
  } else {
    button.disabled = false;

    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }
}


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(value, currency = "USD") {
  const amount = Number(value) || 0;

  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}


// ============================================================
// FORMAT DATE
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
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================
// SHOW ADMIN DASHBOARD
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
// SHOW LOGIN SCREEN
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
}


// ============================================================
// LOAD SELECTED USER
// ============================================================

async function loadSelectedUser(userId) {
  if (!userId) return null;

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User record not found.");
  }

  const userData = {
    id: userSnap.id,
    ...userSnap.data()
  };

  const userName = $("userName");
  const userEmailCard = $("userEmailCard");
  const userCountry = $("userCountry");
  const userBalance = $("userBalance");
  const userCard = $("userCard");

  if (userName) {
    userName.textContent =
      userData.name ||
      userData.fullName ||
      userData.displayName ||
      "Unnamed User";
  }

  if (userEmailCard) {
    userEmailCard.textContent =
      userData.email || "No email";
  }

  if (userCountry) {
    userCountry.textContent =
      userData.country || "—";
  }

  if (userBalance) {
    userBalance.innerHTML = `
      <div>Wallet: ${formatMoney(
        userData.balance,
        userData.currency || "USD"
      )}</div>

      <div>Funding: ${formatMoney(
        userData.fundingBalance,
        userData.currency || "USD"
      )}</div>

      <div>Bonus: ${formatMoney(
        userData.bonusBalance,
        userData.currency || "USD"
      )}</div>

      <div>Trading Profit: ${formatMoney(
        userData.tradingProfit,
        userData.currency || "USD"
      )}</div>
    `;
  }

  if (userCard) {
    userCard.classList.remove("hidden-section");
  }

  return userData;
}


// ============================================================
// SEARCH USER
// ============================================================

async function handleUserSearch() {
  const emailInput = $("searchEmail");

  if (!emailInput) return;

  const email = emailInput.value.trim();

  if (!email) {
    showToast("Enter the user's email address.", "warning");
    return;
  }

  const searchBtn = $("searchBtn");

  try {
    setButtonLoading(searchBtn, true, "Searching...");

    const result = await searchUser(email);

    if (!result) {
      showToast("User not found.", "error");
      return;
    }

    const userId =
      result.id ||
      result.uid ||
      result.userId;

    if (!userId) {
      showToast("User ID could not be found.", "error");
      return;
    }

    await loadSelectedUser(userId);

    if ($("fundForm")) {
      $("fundForm").dataset.userId = userId;
    }

    showToast("User found successfully.", "success");

  } catch (error) {
    console.error("User search error:", error);

    showToast(
      error.message || "Unable to search for user.",
      "error"
    );

  } finally {
    setButtonLoading(searchBtn, false);
  }
}


// ============================================================
// FUND SELECTED BALANCE
// ============================================================

async function fundSelectedBalance(
  userId,
  amount,
  balanceType,
  currency
) {
  if (!userId) {
    throw new Error("No user selected.");
  }

  if (!amount || amount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  const allowedBalances = [
    "balance",
    "fundingBalance",
    "bonusBalance",
    "tradingProfit"
  ];

  if (!allowedBalances.includes(balanceType)) {
    throw new Error("Invalid balance type.");
  }

  const userRef = doc(db, "users", userId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      throw new Error("User does not exist.");
    }

    const userData = userSnap.data();

    const currentBalance =
      Number(userData[balanceType]) || 0;

    const newBalance =
      currentBalance + Number(amount);

    transaction.update(userRef, {
      [balanceType]: newBalance,

      updatedAt: serverTimestamp(),

      lastAdminFunding: {
        amount: Number(amount),
        balanceType,
        currency: currency || "USD",
        previousBalance: currentBalance,
        newBalance,
        updatedAt: new Date().toISOString()
      }
    });
  });
}


// ============================================================
// HANDLE FUNDING
// ============================================================

async function handleFunding(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const userId = form.dataset.userId;

  const balanceType =
    $("fundBalanceType")?.value || "balance";

  const amount =
    Number($("fundAmount")?.value || 0);

  const currency =
    $("fundCurrency")?.value || "USD";

  const submitButton =
    form.querySelector("button[type='submit']");

  if (!userId) {
    showToast(
      "Search for a user first.",
      "warning"
    );
    return;
  }

  if (!amount || amount <= 0) {
    showToast(
      "Enter a valid funding amount.",
      "warning"
    );
    return;
  }

  try {
    setButtonLoading(
      submitButton,
      true,
      "Updating..."
    );

    await fundSelectedBalance(
      userId,
      amount,
      balanceType,
      currency
    );

    await loadSelectedUser(userId);

    await loadAllUsers();

    form.reset();

    showToast(
      "Balance updated successfully.",
      "success"
    );

  } catch (error) {
    console.error(
      "Funding error:",
      error
    );

    showToast(
      error.message ||
      "Unable to update balance.",
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
      status.textContent =
        "Loading customer records...";
    }

    const usersRef =
      collection(db, "users");

    const snapshot =
      await getDocs(usersRef);

    const users = [];

    snapshot.forEach((docSnap) => {
      users.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    users.sort((a, b) => {
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

    if (users.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;">
            No customer records found.
          </td>
        </tr>
      `;

      if (status) {
        status.textContent =
          "No customer records found.";
      }

      return;
    }

    table.innerHTML = users.map((user) => `
      <tr>
        <td>
          ${escapeHTML(
            user.name ||
            user.fullName ||
            user.displayName ||
            "—"
          )}
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

        <td>
          ${formatMoney(
            user.balance,
            user.currency || "USD"
          )}
        </td>

        <td>
          ${formatMoney(
            user.fundingBalance,
            user.currency || "USD"
          )}
        </td>

        <td>
          ${formatMoney(
            user.bonusBalance,
            user.currency || "USD"
          )}
        </td>

        <td>
          ${formatMoney(
            user.tradingProfit,
            user.currency || "USD"
          )}
        </td>

        <td>
          ${formatDate(user.createdAt)}
        </td>
      </tr>
    `).join("");

    if (status) {
      status.textContent =
        `${users.length} customer record${
          users.length === 1 ? "" : "s"
        } loaded.`;
    }

  } catch (error) {
    console.error(
      "Load users error:",
      error
    );

    if (status) {
      status.textContent =
        "Unable to load customer records.";
    }

    showToast(
      error.message ||
      "Unable to load customers.",
      "error"
    );
  }
}


// ============================================================
// LOAD PENDING REQUESTS
// ============================================================

async function loadPendingRequests() {
  const container =
    $("pendingRequests");

  if (!container) return;

  try {
    container.innerHTML = `
      <div style="padding:15px;">
        Loading pending requests...
      </div>
    `;

    const requestsRef =
      collection(db, "withdrawals");

    const requestsQuery =
      query(
        requestsRef,
        where("status", "==", "pending")
      );

    const snapshot =
      await getDocs(requestsQuery);

    if (snapshot.empty) {
      container.innerHTML = `
        <div style="padding:15px;">
          No pending withdrawal requests.
        </div>
      `;

      return;
    }

    const requests = [];

    snapshot.forEach((docSnap) => {
      requests.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    container.innerHTML = requests.map((request) => `
      <div
        class="pending-request"
        data-request-id="${escapeHTML(request.id)}"
        style="
          padding:15px;
          margin-bottom:12px;
          border:1px solid #ddd;
          border-radius:10px;
        "
      >
        <strong>
          ${escapeHTML(
            request.email ||
            request.userEmail ||
            "Unknown user"
          )}
        </strong>

        <div>
          Amount:
          ${formatMoney(
            request.amount,
            request.currency || "USD"
          )}
        </div>

        <div>
          Method:
          ${escapeHTML(
            request.method ||
            request.withdrawalMethod ||
            "—"
          )}
        </div>

        <div>
          Date:
          ${formatDate(request.createdAt)}
        </div>

        <div style="margin-top:10px;">
          <button
            type="button"
            class="approve-withdrawal"
            data-id="${escapeHTML(request.id)}"
          >
            Approve
          </button>

          <button
            type="button"
            class="reject-withdrawal"
            data-id="${escapeHTML(request.id)}"
          >
            Reject
          </button>
        </div>
      </div>
    `).join("");

  } catch (error) {
    console.error(
      "Load pending requests error:",
      error
    );

    container.innerHTML = `
      <div style="padding:15px;">
        Unable to load pending requests.
      </div>
    `;
  }
}


// ============================================================
// APPROVE / REJECT WITHDRAWAL
// ============================================================

async function updateWithdrawalStatus(
  requestId,
  newStatus
) {
  if (!requestId) {
    throw new Error(
      "Invalid withdrawal request."
    );
  }

  const requestRef =
    doc(db, "withdrawals", requestId);

  await runTransaction(
    db,
    async (transaction) => {
      const requestSnap =
        await transaction.get(requestRef);

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

      transaction.update(requestRef, {
        status: newStatus,
        reviewedAt: serverTimestamp()
      });
    }
  );
}


// ============================================================
// HANDLE PENDING REQUEST CLICK
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

  const newStatus =
    approveButton
      ? "approved"
      : "rejected";

  const confirmation =
    approveButton
      ? "Approve this withdrawal request?"
      : "Reject this withdrawal request?";

  if (!window.confirm(confirmation)) {
    return;
  }

  try {
    setButtonLoading(
      button,
      true,
      "Processing..."
    );

    await updateWithdrawalStatus(
      requestId,
      newStatus
    );

    showToast(
      `Withdrawal ${newStatus}.`,
      "success"
    );

    await loadPendingRequests();

  } catch (error) {
    console.error(
      "Withdrawal update error:",
      error
    );

    showToast(
      error.message ||
      "Unable to update withdrawal.",
      "error"
    );

  } finally {
    setButtonLoading(
      button,
      false
    );
  }
}


// ============================================================
// AUTH STATE LISTENER
// ============================================================

function setupAuthListener() {
  onAuthStateChanged(
    auth,
    async (user) => {
      if (user) {

        // IMPORTANT:
        // User is authenticated, so show
        // the admin dashboard.
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

        // User is not authenticated.
        showAdminLogin();
      }
    }
  );
}


// ============================================================
// INITIALIZE ADMIN DASHBOARD
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {
      // Initialize your authentication module.
      initAuth();

    } catch (error) {
      console.error(
        "Auth initialization error:",
        error
      );
    }

    // --------------------------------------------------------
    // IMPORTANT FIX:
    // Watch Firebase authentication state.
    // --------------------------------------------------------

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

          const passwordInput =
            $("adminPassword");

          const password =
            passwordInput?.value || "";

          if (!password) {
            showToast(
              "Enter your admin password.",
              "warning"
            );

            return;
          }

          const loginButton =
            loginForm.querySelector(
              "button[type='submit']"
            );

          try {
            setButtonLoading(
              loginButton,
              true,
              "Signing in..."
            );

            // Firebase login.
            await login();

            // =================================================
            // IMPORTANT FIX:
            // Switch from login screen to dashboard.
            // =================================================

            showAdminDashboard();

            showToast(
              "Dashboard access granted.",
              "success"
            );

            // Clear password field.
            if (passwordInput) {
              passwordInput.value = "";
            }

          } catch (error) {
            console.error(
              "Admin login error:",
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
    // SEARCH USER
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
    // FUNDING FORM
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
    // REFRESH PENDING REQUESTS
    // ========================================================

    const refreshRequestsButton =
      $("refreshRequestsBtn");

    if (refreshRequestsButton) {
      refreshRequestsButton.addEventListener(
        "click",
        async () => {

          try {
            setButtonLoading(
              refreshRequestsButton,
              true,
              "Refreshing..."
            );

            await loadPendingRequests();

            showToast(
              "Pending requests refreshed.",
              "success"
            );

          } catch (error) {
            console.error(
              error
            );

          } finally {
            setButtonLoading(
              refreshRequestsButton,
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


    // ========================================================
    // INITIAL DATA LOAD
    // ========================================================
    // Auth listener handles this when an authenticated
    // admin is detected.
    // ========================================================

  }
);
