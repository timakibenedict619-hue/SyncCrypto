import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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

export const auth = getAuth(app);
export const db = getFirestore(app);
