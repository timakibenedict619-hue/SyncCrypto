import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

// Check admin access
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    return;
  }
  
  const adminDoc = await getDoc(doc(db, 'admins', user.email));
  if (!adminDoc.exists()) {
    alert('Access denied. Not an admin.');
    await signOut(auth);
    return;
  }
  
  currentUser = user;
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  document.getElementById('adminEmail').textContent = user.email;
  loadAllUsers();
});

// Admin login
window.adminLogin = async () => {
  const email = document.getElementById('adminEmailInput').value;
  const password = document.getElementById('adminPassInput').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert('Login failed: ' + e.message);
  }
};

// Search user
window.searchUser = async () => {
  const email = document.getElementById('searchEmail').value;
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    alert('User not found');
    return;
  }
  
  const userDoc = snap.docs[0];
  const data = userDoc.data();
  const uid = userDoc.id;
  
  document.getElementById('userCard').innerHTML = `
    <div class="user-info">
      <h3>${data.name}</h3>
      <p>${data.email}</p>
      <p>Balance: $${data.balance?.toFixed(2) || '0.00'}</p>
      <p>Country: ${data.country || 'N/A'}</p>
    </div>
    <div class="fund-form">
      <input type="number" id="fundAmount" placeholder="Amount" step="0.01">
      <select id="fundCurrency">
        <option value="USD">USD</option>
        <option value="BTC">BTC</option>
        <option value="ETH">ETH</option>
      </select>
      <button onclick="fundUser('${uid}')">Fund Wallet</button>
    </div>
  `;
  
  loadTransactions(uid);
};

// Fund user wallet
window.fundUser = async (uid) => {
  const amount = parseFloat(document.getElementById('fundAmount').value);
  const currency = document.getElementById('fundCurrency').value;
  
  if (!amount || amount <= 0) {
    alert('Enter valid amount');
    return;
  }
  
  try {
    // 1. Update balance
    if (currency === 'USD') {
      await updateDoc(doc(db, 'users', uid), {
        balance: increment(amount)
      });
    } else {
      // Add to holdings subcollection
      const coinId = currency.toLowerCase() === 'btc'? 'bitcoin' : 'ethereum';
      await updateDoc(doc(db, 'users', uid, 'holdings', coinId), {
        amount: increment(amount)
      }, { merge: true });
    }
    
    // 2. Add transaction record
    await addDoc(collection(db, 'users', uid, 'transactions'), {
      type: 'deposit',
      amount: amount,
      currency: currency,
      admin: currentUser.email,
      timestamp: serverTimestamp()
    });
    
    alert(`Funded ${amount} ${currency} successfully! User will see it instantly.`);
    searchUser(); // Refresh
  } catch (e) {
    alert('Error: ' + e.message);
  }
};

// Load transactions
async function loadTransactions(uid) {
  const transSnap = await getDocs(collection(db, 'users', uid, 'transactions'));
  let html = '<h4>Recent Transactions</h4>';
  transSnap.forEach(d => {
    const t = d.data();
    html += `<div class="trans-item">${t.type} ${t.amount} ${t.currency} - ${t.admin}</div>`;
  });
  document.getElementById('transList').innerHTML = html;
}

// Load all users
async function loadAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  let html = '<table><tr><th>Name</th><th>Email</th><th>Balance</th><th>Action</th></tr>';
  snap.forEach(d => {
    const u = d.data();
    html += `<tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>$${u.balance?.toFixed(2) || '0.00'}</td>
      <td><button onclick="quickFund('${d.id}', '${u.name}')">Fund</button></td>
    </tr>`;
  });
  document.getElementById('usersTable').innerHTML = html + '</table>';
}

window.quickFund = (uid, name) => {
  document.getElementById('searchEmail').value = '';
  alert(`Enter amount to fund ${name}`);
};

window.logout = () => signOut(auth);