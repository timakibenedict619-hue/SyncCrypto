import {
  initAuth,
  login,
  logout
} from "./auth.js";

import {
  searchUser
} from "./users.js";

import {
  fundWallet
} from "./wallet.js";

let currentUserId = null;

function createToastContainer() {
  if (document.getElementById("toastContainer")) return;

  const container = document.createElement("div");
  container.id = "toastContainer";

  container.style.cssText = `
    position: fixed;
    top: 88px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(390px, calc(100vw - 40px));
    pointer-events: none;
  `;

  document.body.appendChild(container);
}

function showToast(message, type = "error") {
  createToastContainer();

  const styles = {
    success: {
      icon: "fa-circle-check",
      color: "#34d399",
      background: "rgba(12, 52, 41, 0.96)"
    },
    error: {
      icon: "fa-circle-exclamation",
      color: "#ff7b7b",
      background: "rgba(62, 20, 27, 0.96)"
    },
    info: {
      icon: "fa-circle-info",
      color: "#60a5fa",
      background: "rgba(20, 42, 70, 0.96)"
    }
  };

  const selectedStyle = styles[type] || styles.error;
  const toast = document.createElement("div");

  toast.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 15px;
    color: white;
    background: ${selectedStyle.background};
    border: 1px solid ${selectedStyle.color}44;
    border-radius: 14px;
    box-shadow: 0 18px 38px rgba(0, 0, 0, 0.35);
    font-family: "DM Sans", sans-serif;
    font-size: 14px;
    line-height: 1.4;
    pointer-events: auto;
    transform: translateX(30px);
    opacity: 0;
    transition: all 0.3s ease;
  `;

  toast.innerHTML = `
    <i class="fa-solid ${selectedStyle.icon}" style="color:${selectedStyle.color}; margin-top:2px;"></i>
    <span style="flex:1;">${message}</span>
    <button aria-label="Close notification" style="border:none; background:transparent; color:#cbd5e1; cursor:pointer; padding:0 0 0 8px;">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  document.getElementById("toastContainer").appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
    toast.style.opacity = "1";
  });

  const removeToast = () => {
    toast.style.transform = "translateX(30px)";
    toast.style.opacity = "0";

    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector("button").addEventListener("click", removeToast);
  setTimeout(removeToast, 5000);
}

function setButtonLoading(button, isLoading, loadingText) {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.style.opacity = "0.7";
    button.style.cursor = "not-allowed";
    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      ${loadingText}
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

function getErrorMessage(error, fallbackMessage) {
  return error?.message || fallbackMessage;
}

window.addEventListener("DOMContentLoaded", () => {
  initAuth();
  createToastContainer();

  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const searchBtn = document.getElementById("searchBtn");
  const searchEmail = document.getElementById("searchEmail");
  const fundForm = document.getElementById("fundForm");
  const fundAmount = document.getElementById("fundAmount");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const loginButton = loginForm.querySelector('button[type="submit"]');
      const password = document.getElementById("adminPassword")?.value.trim();

      if (!password) {
        showToast("Enter your admin password to continue.", "error");
        document.getElementById("adminPassword")?.focus();
        return;
      }

      try {
        setButtonLoading(loginButton, true, "Signing in...");
        await login();
        showToast("Welcome back. Dashboard access granted.", "success");
      } catch (error) {
        showToast(getErrorMessage(error, "Unable to sign in. Please try again."), "error");
      } finally {
        setButtonLoading(loginButton, false);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        setButtonLoading(logoutBtn, true, "Logging out...");
        await logout();
      } catch (error) {
        showToast(getErrorMessage(error, "Unable to log out. Please try again."), "error");
      } finally {
        setButtonLoading(logoutBtn, false);
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      const email = searchEmail?.value.trim();

      if (!email) {
        showToast("Enter a user's email address before searching.", "error");
        searchEmail?.focus();
        return;
      }

      if (!email.includes("@")) {
        showToast("Enter a valid email address.", "error");
        searchEmail?.focus();
        return;
      }

      try {
        currentUserId = null;
        setButtonLoading(searchBtn, true, "Searching...");

        currentUserId = await searchUser();

        if (!currentUserId) {
          showToast("No matching user was found.", "error");
          return;
        }

        showToast("User found. You can now fund their wallet.", "success");
      } catch (error) {
        currentUserId = null;
        showToast(getErrorMessage(error, "Unable to find this user."), "error");
      } finally {
        setButtonLoading(searchBtn, false);
      }
    });
  }

  if (searchEmail) {
    searchEmail.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        searchBtn?.click();
      }
    });
  }

  if (fundForm) {
    fundForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const fundButton = fundForm.querySelector('button[type="submit"]');
      const amount = Number(fundAmount?.value);

      if (!currentUserId) {
        showToast("Search for and select a user before funding a wallet.", "error");
        searchEmail?.focus();
        return;
      }

      if (!amount || amount <= 0) {
        showToast("Enter a valid funding amount greater than zero.", "error");
        fundAmount?.focus();
        return;
      }

      try {
        setButtonLoading(fundButton, true, "Funding wallet...");
        await fundWallet(currentUserId);

        showToast("Wallet funded successfully.", "success");
        fundForm.reset();
      } catch (error) {
        showToast(getErrorMessage(error, "Wallet funding failed. Please try again."), "error");
      } finally {
        setButtonLoading(fundButton, false);
      }
    });
  }
});
