//只负责firebase初始化
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxXLf0yxKkCavdGTrqf2GQ1TxMLm-9ZYQ",
  authDomain: "rewear-4bbd6.firebaseapp.com",
  projectId: "rewear-4bbd6",
  storageBucket: "rewear-4bbd6.firebasestorage.app",
  messagingSenderId: "758827459504",
  appId: "1:758827459504:web:faeb8d7ce3cc1f51faec75"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);