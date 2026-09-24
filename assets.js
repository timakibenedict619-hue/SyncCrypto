import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

const COINGECKO_IDS = 'bitcoin,ethereum,binancecoin,solana,cardano,ripple,dogecoin,polkadot,avalanche-2,chainlink';
const CRYPTO_MAP = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  ethereum: { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  binancecoin: { symbol: 'BNB', name: 'BNB', color: '#F3BA2F' },
  solana: { symbol: 'SOL', name: 'Solana', color: '#14F195' },
  cardano: { symbol: 'ADA', name: 'Cardano', color: '#0033AD' },
  ripple: { symbol: 'XRP', name: 'XRP', color: '#23292F' },
  dogecoin: { symbol: 'DOGE', name: 'Dogecoin', color: '#C2A633' },
  polkadot: { symbol: 'DOT', name: 'Polkadot', color: '#E6007A' },
  'avalanche-2': { symbol: 'AVAX', name: 'Avalanche', color: '#E84142' },
  chainlink: { symbol: 'LINK', name: 'Chainlink', color: '#2A5ADA' }
};

let currentUser = null;
let priceData = {};
let miniCharts = {};

const formatCurrency = (num) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

const formatNumber = (num, decimals = 4) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);

const showToast = (message) => {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  toast.classList.remove('translate-x-[120%]');
  setTimeout(() => toast.classList.add('translate-x-[120%]'), 3000);
};

const fetchPrices = async () => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=usd&include_24hr_change=true&include_sparkline_7d=true`
    );
    if (!response.ok) throw new Error('Failed to fetch prices');
    priceData = await response.json();
    return priceData;
  } catch (error) {
    console.error('Error fetching prices:', error);
    showToast('Failed to load market data');
    return {};
  }
};

const setInitials = (user) => {
  const letter = (user.email?.[0] || 'U').toUpperCase();
  const small = document.getElementById('userInitialsSmall');
  const large = document.getElementById('userInitialsLarge');
  if (small) small.textContent = letter;
  if (large) large.textContent = letter;
};

const calculatePortfolio = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const cashBalance = userDoc.exists() ? (userDoc.data().balance || 0) : 0;
    const userName = userDoc.exists() ? (userDoc.data().name || 'User') : 'User';

    const nameEl = document.getElementById('userName');
    const profileNameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = userName;
    if (profileNameEl) profileNameEl.textContent = userName;

    const emailEl = document.getElementById('userEmail');
    if (emailEl) emailEl.textContent = currentUser?.email || '';

    const holdingsSnap = await getDocs(collection(db, 'users', userId, 'holdings'));
    let cryptoTotal = 0;
    const holdingsArray = [];

    holdingsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const coinId = data.coinId || data.id;
      const price = priceData[coinId]?.usd || 0;
      const value = (data.amount || 0) * price;
      cryptoTotal += value;
      holdingsArray.push({ id: docSnap.id, coinId, ...data, value, price });
    });

    const total = cashBalance + cryptoTotal;

    const totalBalanceEl = document.getElementById('totalBalance');
    const cashBalanceEl = document.getElementById('cashBalance');
    const cryptoBalanceEl = document.getElementById('cryptoBalance');
    if (totalBalanceEl) totalBalanceEl.textContent = formatCurrency(total);
    if (cashBalanceEl) cashBalanceEl.textContent = formatCurrency(cashBalance);
    if (cryptoBalanceEl) cryptoBalanceEl.textContent = formatCurrency(cryptoTotal);

    let weightedChangeSum = 0;
    holdingsArray.forEach((holding) => {
      const change = priceData[holding.coinId]?.usd_24h_change || 0;
      weightedChangeSum += holding.value * change;
    });
    const totalChange = cryptoTotal > 0 ? weightedChangeSum / cryptoTotal : 0;

    const changeEl = document.getElementById('totalChange');
    if (changeEl) {
      const isPositive = totalChange >= 0;
      changeEl.className = `flex items-center gap-1 px-3 py-1 rounded-full ${isPositive ? 'bg-emerald-400/10' : 'bg-red-400/10'}`;
      changeEl.innerHTML = `
        <i class="fa-solid ${isPositive ? 'fa-arrow-trend-up text-emerald-400' : 'fa-arrow-trend-down text-red-400'} text-xs"></i>
        <span class="text-sm font-semibold ${isPositive ? 'text-emerald-300' : 'text-red-300'}">${isPositive ? '+' : ''}${totalChange.toFixed(2)}%</span>
      `;
    }

    return { holdingsArray, cashBalance };
  } catch (error) {
    console.error('Error calculating portfolio:', error);
    return { holdingsArray: [], cashBalance: 0 };
  }
};

const renderHoldings = (holdings) => {
  const holdingsList = document.getElementById('holdingsList');
  const holdingsCount = document.getElementById('holdingsCount');
  const noHoldings = document.getElementById('noHoldings');
  if (!holdingsList) return;

  if (holdingsCount) holdingsCount.textContent = `${holdings.length} ${holdings.length === 1 ? 'asset' : 'assets'}`;

  if (holdings.length === 0) {
    holdingsList.innerHTML = '';
    if (noHoldings) noHoldings.classList.remove('hidden');
    return;
  }

  if (noHoldings) noHoldings.classList.add('hidden');
  holdings.sort((a, b) => b.value - a.value);

  holdingsList.innerHTML = holdings.map((holding) => {
    const meta = CRYPTO_MAP[holding.coinId] || { symbol: holding.symbol || '?', name: holding.name || holding.coinId, color: '#6B7280' };
    const change = priceData[holding.coinId]?.usd_24h_change || 0;
    const isPositive = change >= 0;

    return `
      <div class="asset-card glass rounded-xl p-4 fade-up">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: ${meta.color}20">
            <span class="text-sm font-bold" style="color: ${meta.color}">${meta.symbol}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-white truncate">${meta.name}</p>
            <p class="text-xs text-slate-400">${formatNumber(holding.amount)} ${meta.symbol}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-white">${formatCurrency(holding.value)}</p>
            <p class="text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}">${isPositive ? '+' : ''}${change.toFixed(2)}%</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

const createMiniChart = (canvasId, sparklineData, isPositive) => {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !sparklineData) return;
  if (miniCharts[canvasId]) miniCharts[canvasId].destroy();

  miniCharts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sparklineData.map((_, i) => i),
      datasets: [{
        data: sparklineData,
        borderColor: isPositive ? '#34d399' : '#f87171',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
};

const renderMarket = () => {
  const marketList = document.getElementById('marketList');
  if (!marketList) return;
  const coins = Object.keys(CRYPTO_MAP);

  marketList.innerHTML = coins.map((coinId) => {
    const meta = CRYPTO_MAP[coinId];
    const data = priceData[coinId];
    if (!data) return '';

    const change = data.usd_24h_change || 0;
    const isPositive = change >= 0;

    return `
      <div class="p-4 transition hover:bg-white/[0.03]">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style="background: ${meta.color}20; color: ${meta.color}">
            ${meta.symbol.slice(0, 2)}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-white text-sm">${meta.name}</p>
            <p class="text-xs text-slate-400">${meta.symbol}</p>
          </div>
          <canvas id="chart-${coinId}" class="mini-chart"></canvas>
          <div class="text-right">
            <p class="font-semibold text-white text-sm">${formatCurrency(data.usd)}</p>
            <p class="text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}">${isPositive ? '+' : ''}${change.toFixed(2)}%</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  setTimeout(() => {
    coins.forEach((coinId) => {
      const data = priceData[coinId];
      if (data?.sparkline_7d?.price) {
        createMiniChart(`chart-${coinId}`, data.sparkline_7d.price, data.usd_24h_change >= 0);
      }
    });
  }, 100);
};

const loadData = async () => {
  if (!currentUser) return;
  await fetchPrices();
  const { holdingsArray } = await calculatePortfolio(currentUser.uid);
  renderHoldings(holdingsArray);
  renderMarket();
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sendBtn')?.addEventListener('click', () => showToast('Send feature coming soon'));
  document.getElementById('receiveBtn')?.addEventListener('click', () => showToast('Receive feature coming soon'));
  document.getElementById('swapBtn')?.addEventListener('click', () => showToast('Swap feature coming soon'));
  document.getElementById('refreshMarket')?.addEventListener('click', async () => {
    showToast('Refreshing market data...');
    await loadData();
  });
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;
  setInitials(user);
  await loadData();
});

setInterval(async () => {
  if (currentUser) await loadData();
}, 30000);
