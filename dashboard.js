import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  onSnapshot
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


let currentUser = null;
let stopUserListener = null;
let toastTimer = null;

let maintenanceBlocked = false;
let maintenanceCheckInProgress = false;
let dashboardIntervalsStarted = false;

let marketInterval = null;
let historyInterval = null;


const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});


function formatMoney(value) {
  const number = Number(value);

  return moneyFormatter.format(
    Number.isFinite(number) ? number : 0
  );
}


function formatDate(timestamp) {
  if (!timestamp) return "Just now";

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}


function getInitials(name) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}


function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;

  toast.classList.remove("translate-x-[120%]");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.add("translate-x-[120%]");
  }, 3500);
}


/*
|--------------------------------------------------------------------------
| MAINTENANCE MODE
|--------------------------------------------------------------------------
|
| Firestore document:
|
| settings/maintenance
|
| Example document:
|
| {
|   enabled: true,
|   message: "We're currently undergoing scheduled maintenance."
| }
|
| This check must succeed before account information and transaction
| history are loaded.
|
*/


function stopDashboardActivity() {

  if (stopUserListener) {
    stopUserListener();
    stopUserListener = null;
  }

  if (marketInterval) {
    clearInterval(marketInterval);
    marketInterval = null;
  }

  if (historyInterval) {
    clearInterval(historyInterval);
    historyInterval = null;
  }

  dashboardIntervalsStarted = false;
}


function showMaintenanceScreen(message) {

  let maintenanceScreen =
    document.getElementById("maintenanceScreen");

  if (!maintenanceScreen) {

    maintenanceScreen =
      document.createElement("div");

    maintenanceScreen.id =
      "maintenanceScreen";

    maintenanceScreen.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: #080d19;
      color: #f8fafc;
      font-family: Arial, sans-serif;
    `;

    maintenanceScreen.innerHTML = `
      <div style="
        width: 100%;
        max-width: 480px;
        padding: 32px 24px;
        border: 1px solid rgba(248, 113, 113, 0.35);
        border-radius: 20px;
        background: #111827;
        text-align: center;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      ">

        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          margin: 0 auto 22px;
          border-radius: 18px;
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          font-size: 28px;
        ">
          <i class="fa-solid fa-screwdriver-wrench"></i>
        </div>

        <p style="
          margin: 0 0 10px;
          color: #f87171;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        ">
          Scheduled Maintenance
        </p>

        <h1 style="
          margin: 0 0 14px;
          color: #ffffff;
          font-size: 27px;
          line-height: 1.3;
        ">
          We'll be back soon
        </h1>

        <p id="maintenanceScreenMessage" style="
          margin: 0 auto;
          max-width: 360px;
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.8;
        "></p>

        <div style="
          margin-top: 26px;
          padding-top: 20px;
          border-top: 1px solid rgba(148, 163, 184, 0.15);
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.7;
        ">
          Your account data remains in the system.
          Please try again later.
        </div>

      </div>
    `;

    document.body.appendChild(
      maintenanceScreen
    );
  }

  const messageElement =
    document.getElementById(
      "maintenanceScreenMessage"
    );

  if (messageElement) {
    messageElement.textContent =
      message ||
      "We're currently undergoing scheduled maintenance. Please try again later.";
  }

  maintenanceScreen.style.display = "flex";
}


async function blockDashboardForMaintenance(message) {

  if (maintenanceBlocked) return;

  maintenanceBlocked = true;

  stopDashboardActivity();

  showMaintenanceScreen(message);

  try {

    if (auth.currentUser) {
      await signOut(auth);
    }

  } catch (error) {

    console.error(
      "Unable to sign out during maintenance:",
      error
    );

  }

}


async function blockDashboardForSettingsError() {

  if (maintenanceBlocked) return;

  maintenanceBlocked = true;

  stopDashboardActivity();

  showMaintenanceScreen(
    "We couldn't verify the current service status. Access is temporarily unavailable. Please try again shortly."
  );

  try {

    if (auth.currentUser) {
      await signOut(auth);
    }

  } catch (error) {

    console.error(
      "Sign-out after maintenance check failure:",
      error
    );

  }

}


async function checkMaintenanceMode() {

  if (maintenanceCheckInProgress) {
    return false;
  }

  maintenanceCheckInProgress = true;

  try {

    const maintenanceSnapshot =
      await getDoc(
        doc(db, "settings", "maintenance")
      );


    if (maintenanceSnapshot.exists()) {

      const maintenanceData =
        maintenanceSnapshot.data();


      if (maintenanceData.enabled === true) {

        await blockDashboardForMaintenance(
          maintenanceData.message ||
          "We're currently undergoing scheduled maintenance. Please try again later."
        );

        return false;
      }
    }


    return true;

  } catch (error) {

    console.error(
      "Maintenance mode check failed:",
      error
    );


    await blockDashboardForSettingsError();

    return false;

  } finally {

    maintenanceCheckInProgress = false;

  }
}


/*
|--------------------------------------------------------------------------
| USER BALANCES
|--------------------------------------------------------------------------
|
| Firestore users/{uid} should contain:
|
| balance
| fundingBalance
| bonusBalance
| tradingProfit
|
| balance = Wallet Balance
| fundingBalance = Funding Wallet
| bonusBalance = Bonus Balance
| tradingProfit = Trading Profit
|
*/


function updateUserInterface(data, user) {

  const name = data.name || "User";

  const email =
    data.email ||
    user.email ||
    "No email available";


  const walletBalance = Number(
    data.balance || 0
  );

  const fundingBalance = Number(
    data.fundingBalance || 0
  );

  const bonusBalance = Number(
    data.bonusBalance || 0
  );

  const tradingProfit = Number(
    data.tradingProfit || 0
  );


  const totalAvailableBalance =
    walletBalance;

  const initials =
    getInitials(name);


  document.getElementById("userName").textContent =
    name;

  document.getElementById("profileName").textContent =
    name;

  document.getElementById("userEmail").textContent =
    email;


  document.getElementById("totalAssets").textContent =
    formatMoney(totalAvailableBalance);

  document.getElementById("walletBalance").textContent =
    formatMoney(walletBalance);

  document.getElementById("fundingBalance").textContent =
    formatMoney(fundingBalance);

  document.getElementById("bonusBalance").textContent =
    formatMoney(bonusBalance);

  document.getElementById("tradingProfit").textContent =
    formatMoney(tradingProfit);


  document.getElementById("userInitialsSmall").textContent =
    initials;

  document.getElementById("userInitialsLarge").textContent =
    initials;
}


function getTransactionPresentation(transaction) {

  const isWithdrawal =
    transaction.kind === "withdrawal";

  const isSent =
    transaction.kind === "sent";


  if (isWithdrawal) {

    return {
      icon: "fa-arrow-up-right-from-square",

      iconClass:
        "bg-yellow-400/10 text-yellow-400",

      title:
        `Withdrawal via ${
          transaction.method === "bitcoin"
            ? "Bitcoin"
            : "bank account"
        }`,

      amountClass:
        "text-red-300",

      amountLabel:
        `-${formatMoney(transaction.amount)}`
    };
  }


  if (isSent) {

    return {
      icon: "fa-paper-plane",

      iconClass:
        "bg-red-400/10 text-red-300",

      title:
        `Sent to ${
          transaction.recipientEmail || "recipient"
        }`,

      amountClass:
        "text-red-300",

      amountLabel:
        `-${formatMoney(transaction.amount)}`
    };
  }


  return {

    icon:
      "fa-arrow-down-left-from-square",

    iconClass:
      "bg-emerald-400/10 text-emerald-300",

    title:
      `Received from ${
        transaction.senderEmail || "sender"
      }`,

    amountClass:
      "text-emerald-300",

    amountLabel:
      `+${formatMoney(transaction.amount)}`
  };
}


function renderHistory(transactions) {

  const container =
    document.getElementById("transactionHistory");


  if (!container) return;


  if (!transactions.length) {

    container.innerHTML = `
      <div class="px-6 py-14 text-center">

        <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.04] text-slate-500">

          <i class="fa-regular fa-folder-open text-xl"></i>

        </div>

        <p class="mt-4 font-semibold text-slate-300">
          No transactions yet
        </p>

        <p class="mt-1 text-sm text-slate-500">
          Your transfers and withdrawals will appear here.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML = transactions
    .slice(0, 8)
    .map((transaction) => {

      const presentation =
        getTransactionPresentation(transaction);

      const status =
        transaction.status || "completed";

      const safeStatus =
        String(status)
          .toLowerCase()
          .replace(/[^a-z]/g, "");


      const statusClass =
        [
          "completed",
          "pending",
          "failed",
          "rejected"
        ].includes(safeStatus)
          ? `status-${safeStatus}`
          : "status-pending";


      return `
        <article class="flex items-center gap-3 px-5 py-4 transition hover:bg-white/[0.025] sm:px-6">

          <div class="grid h-11 w-11 shrink-0 place-items-center rounded-xl ${presentation.iconClass}">
            <i class="fa-solid ${presentation.icon}"></i>
          </div>

          <div class="min-w-0 flex-1">

            <p class="truncate text-sm font-semibold text-white">
              ${presentation.title}
            </p>

            <p class="mt-1 text-xs text-slate-500">
              ${formatDate(transaction.createdAt)}
            </p>

          </div>

          <div class="text-right">

            <p class="text-sm font-bold ${presentation.amountClass}">
              ${presentation.amountLabel}
            </p>

            <span class="status-pill ${statusClass}">
              ${status}
            </span>

          </div>

        </article>
      `;

    })
    .join("");
}


async function loadTransactionHistory() {

  if (!currentUser || maintenanceBlocked) return;


  const container =
    document.getElementById("transactionHistory");


  if (!container) return;


  container.innerHTML = `
    <div class="px-6 py-12 text-center text-slate-400">

      <i class="fa-solid fa-spinner fa-spin text-xl text-yellow-400"></i>

      <p class="mt-3 text-sm">
        Updating transaction history...
      </p>

    </div>
  `;


  try {

    const userId =
      currentUser.uid;


    const [
      sentSnapshot,
      receivedSnapshot,
      withdrawalSnapshot
    ] = await Promise.all([

      getDocs(
        query(
          collection(db, "transfers"),
          where("senderId", "==", userId)
        )
      ),

      getDocs(
        query(
          collection(db, "transfers"),
          where("recipientId", "==", userId)
        )
      ),

      getDocs(
        query(
          collection(db, "withdrawals"),
          where("userId", "==", userId)
        )
      )

    ]);


    if (maintenanceBlocked) return;


    const sentTransactions =
      sentSnapshot.docs.map((item) => ({
        id: item.id,
        kind: "sent",
        ...item.data()
      }));


    const receivedTransactions =
      receivedSnapshot.docs.map((item) => ({
        id: item.id,
        kind: "received",
        ...item.data()
      }));


    const withdrawals =
      withdrawalSnapshot.docs.map((item) => ({
        id: item.id,
        kind: "withdrawal",
        ...item.data()
      }));


    const transactions = [

      ...sentTransactions,

      ...receivedTransactions,

      ...withdrawals

    ].sort((first, second) => {

      const firstTime =
        first.createdAt?.toMillis?.() || 0;

      const secondTime =
        second.createdAt?.toMillis?.() || 0;

      return secondTime - firstTime;
    });


    renderHistory(transactions);

  } catch (error) {

    if (maintenanceBlocked) return;


    console.error(
      "Transaction history error:",
      error
    );


    container.innerHTML = `
      <div class="px-6 py-12 text-center">

        <i class="fa-solid fa-triangle-exclamation text-xl text-red-400"></i>

        <p class="mt-3 text-sm font-semibold text-slate-300">
          Unable to load transaction history.
        </p>

        <p class="mt-1 text-xs text-slate-500">
          Check your Firestore rules and collection names.
        </p>

      </div>
    `;
  }
}


function drawBtcChart(prices) {

  const chart =
    document.getElementById("btcChart");

  const area =
    document.getElementById("btcArea");


  if (!chart || !area) return;


  if (!prices || prices.length < 2) {

    chart.setAttribute(
      "points",
      "0,55 55,42 110,50 165,30 220,38 275,20 330,28 400,10"
    );

    area.setAttribute(
      "d",
      "M0,55 L55,42 L110,50 L165,30 L220,38 L275,20 L330,28 L400,10 L400,90 L0,90 Z"
    );

    return;
  }


  const values =
    prices.map((item) => Number(item[1]));


  const min =
    Math.min(...values);

  const max =
    Math.max(...values);

  const range =
    max - min || 1;


  const points =
    values
      .map((price, index) => {

        const x =
          (index / (values.length - 1)) * 400;

        const y =
          78 -
          ((price - min) / range) * 65;

        return `${x.toFixed(2)},${y.toFixed(2)}`;

      })
      .join(" ");


  chart.setAttribute(
    "points",
    points
  );


  area.setAttribute(
    "d",
    `M${points.replaceAll(" ", " L")} L400,90 L0,90 Z`
  );
}


async function updateBitcoinMarket() {

  if (maintenanceBlocked) return;


  const btcPriceElement =
    document.getElementById("btcPrice");

  const btcChangeElement =
    document.getElementById("btcChange");

  const btcUpdatedElement =
    document.getElementById("btcUpdated");

  const btcEquivalentElement =
    document.getElementById("btcEquivalent");


  if (
    !btcPriceElement ||
    !btcChangeElement ||
    !btcUpdatedElement ||
    !btcEquivalentElement
  ) {
    return;
  }


  try {

    const [
      priceResponse,
      chartResponse
    ] = await Promise.all([

      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true"
      ),

      fetch(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1&interval=hourly"
      )

    ]);


    if (maintenanceBlocked) return;


    if (!priceResponse.ok) {

      throw new Error(
        "Bitcoin price service is unavailable."
      );
    }


    const priceData =
      await priceResponse.json();

    const bitcoin =
      priceData.bitcoin;


    if (!bitcoin?.usd) {

      throw new Error(
        "Bitcoin price data was not returned."
      );
    }


    const price =
      Number(bitcoin.usd);

    const change =
      Number(bitcoin.usd_24h_change || 0);

    const changeIsPositive =
      change >= 0;


    btcPriceElement.textContent =
      formatMoney(price);


    btcChangeElement.textContent =
      `${changeIsPositive ? "+" : ""}${change.toFixed(2)}% today`;


    btcChangeElement.className =
      `text-sm font-bold ${
        changeIsPositive
          ? "text-emerald-300"
          : "text-red-300"
      }`;


    btcUpdatedElement.textContent =
      `Updated ${new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
      })}`;


    const walletText =
      document.getElementById(
        "walletBalance"
      )?.textContent || "$0.00";


    const currentBalance =
      Number(
        walletText.replace(
          /[^0-9.-]+/g,
          ""
        )
      );


    btcEquivalentElement.textContent =
      `${(currentBalance / price).toFixed(8)} BTC`;


    if (chartResponse.ok) {

      const chartData =
        await chartResponse.json();

      if (maintenanceBlocked) return;

      drawBtcChart(
        chartData.prices
      );

    } else {

      drawBtcChart();

    }


    const tickerMessage =
      `BTC/USD ${formatMoney(price)} · ${
        changeIsPositive ? "+" : ""
      }${change.toFixed(2)}% over 24 hours · Live market data refreshes automatically`;


    const tickerText =
      document.getElementById("tickerText");

    const tickerTextDup =
      document.getElementById("tickerTextDup");


    if (tickerText) {
      tickerText.textContent = tickerMessage;
    }

    if (tickerTextDup) {
      tickerTextDup.textContent = tickerMessage;
    }


  } catch (error) {

    if (maintenanceBlocked) return;


    console.error(
      "Bitcoin market error:",
      error
    );


    btcPriceElement.textContent =
      "Unavailable";


    btcChangeElement.textContent =
      "Market feed unavailable";


    btcChangeElement.className =
      "text-sm font-bold text-slate-500";


    btcUpdatedElement.textContent =
      "Try again shortly";


    const tickerText =
      document.getElementById("tickerText");

    const tickerTextDup =
      document.getElementById("tickerTextDup");


    if (tickerText) {
      tickerText.textContent =
        "Bitcoin market data is temporarily unavailable.";
    }

    if (tickerTextDup) {
      tickerTextDup.textContent =
        "Bitcoin market data is temporarily unavailable.";
    }


    drawBtcChart();
  }
}


function setTheme(isLight) {

  document.body.classList.toggle(
    "theme-light",
    isLight
  );


  const icon =
    document.getElementById(
      "themeIcon"
    );


  if (icon) {

    icon.className =
      isLight
        ? "fa-solid fa-moon text-lg"
        : "fa-regular fa-sun text-lg";

  }


  localStorage.setItem(
    "syncCryptoTheme",
    isLight
      ? "light"
      : "dark"
  );
}


function initialiseTheme() {

  setTheme(
    localStorage.getItem(
      "syncCryptoTheme"
    ) === "light"
  );


  const themeToggle =
    document.getElementById("themeToggle");


  if (themeToggle) {

    themeToggle.addEventListener(
      "click",
      () => {

        setTheme(
          !document.body.classList.contains(
            "theme-light"
          )
        );

      }
    );

  }
}


/*
|--------------------------------------------------------------------------
| DASHBOARD EVENT LISTENERS
|--------------------------------------------------------------------------
*/


const supportBtn =
  document.getElementById("supportBtn");


if (supportBtn) {

  supportBtn.addEventListener(
    "click",
    () => {

      showToast(
        "Support is currently available through your account manager."
      );

    }
  );

}


const refreshHistoryBtn =
  document.getElementById("refreshHistoryBtn");


if (refreshHistoryBtn) {

  refreshHistoryBtn.addEventListener(
    "click",
    () => {

      if (maintenanceBlocked) return;

      loadTransactionHistory();

      showToast(
        "Refreshing transaction history..."
      );

    }
  );

}


/*
|--------------------------------------------------------------------------
| START DASHBOARD
|--------------------------------------------------------------------------
|
| Authentication is checked first.
| Maintenance status is checked second.
| Only after both checks succeed are dashboard listeners started.
|
*/


async function startDashboard(user) {

  if (maintenanceBlocked) return;


  currentUser = user;


  const maintenanceIsOff =
    await checkMaintenanceMode();


  if (!maintenanceIsOff || maintenanceBlocked) {
    return;
  }


  /*
   * Do not continue if the authenticated user changed
   * while the maintenance check was running.
   */

  if (
    !auth.currentUser ||
    auth.currentUser.uid !== user.uid
  ) {
    return;
  }


  if (stopUserListener) {
    stopUserListener();
    stopUserListener = null;
  }


  const userRef =
    doc(
      db,
      "users",
      user.uid
    );


  stopUserListener =
    onSnapshot(

      userRef,

      (userSnapshot) => {

        if (maintenanceBlocked) return;


        if (!userSnapshot.exists()) {

          document.getElementById(
            "userName"
          ).textContent =
            "Account not found";

          return;
        }


        const userData =
          userSnapshot.data();


        updateUserInterface(
          userData,
          user
        );


        updateBitcoinMarket();

      },

      (error) => {

        if (maintenanceBlocked) return;


        console.error(
          "Live wallet listener error:",
          error
        );


        showToast(
          "Unable to receive live wallet updates."
        );

      }

    );


  await loadTransactionHistory();


  if (maintenanceBlocked) return;


  await updateBitcoinMarket();


  if (maintenanceBlocked) return;


  if (!dashboardIntervalsStarted) {

    marketInterval =
      setInterval(
        updateBitcoinMarket,
        60_000
      );


    historyInterval =
      setInterval(
        loadTransactionHistory,
        60_000
      );


    dashboardIntervalsStarted = true;

  }

}


/*
|--------------------------------------------------------------------------
| INITIALISATION
|--------------------------------------------------------------------------
*/


initialiseTheme();

drawBtcChart();


onAuthStateChanged(
  auth,

  async (user) => {

    if (maintenanceBlocked) return;


    if (!user) {

      currentUser = null;

      stopDashboardActivity();

      window.location.href =
        "login.html";

      return;
    }


    await startDashboard(user);

  }
);
