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

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  // Load user data
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists()) {
    document.getElementById('userName').textContent = userDoc.data().name || 'User';
    document.getElementById('totalBalance').textContent = `\[ {userDoc.data().balance?.toFixed(2) || '0.00'}`;
  }

  // Load holdings
  const holdingsSnap = await getDocs(collection(db, 'users', user.uid, 'holdings'));
  const coins = [];
  holdingsSnap.forEach(d => coins.push({ id: d.id, ...d.data() }));
  
  // Fetch live prices
  const ids = coins.map(c => c.id).join(',');
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
  const prices = await res.json();
  
  let total = userDoc.data().balance || 0;
  const holdingsList = document.getElementById('holdingsList');
  
  coins.forEach(c => {
    const price = prices[c.id]?.usd || 0;
    const change = prices[c.id]?.usd_24h_change || 0;
    const value = c.amount * price;
    total += value;
    
    holdingsList.innerHTML += `
      <div class="holding-item">
        <div class="coin-info">
          <div class="coin-icon">${c.symbol}</div>
          <div>
            <div class="coin-name">${c.id}</div>
            <div class="coin-amount">${c.amount} ${c.symbol}</div>
          </div>
        </div>
        <div class="coin-value">
          <div class="amount"> \]{value.toFixed(2)}</div>
          <div class="change \( {change >= 0 ? 'positive' : 'negative'}"> \){change.toFixed(2)}%</div>
        </div>
      </div>`;
  });
  
  document.getElementById('portfolioValue').textContent = `$${total.toFixed(2)}`;
});
