// Paste your Firebase web app config here (Firebase Console → Project settings → Your apps).
// This configuration is NOT a password. Firestore rules and Authentication protect the data.

export const firebaseConfig = {
    apiKey: "AIzaSyD5r6aq8qcb8VFfatEGitHNYd9zWmUd_18",
    authDomain: "projectl-fc9ed.firebaseapp.com",
    projectId: "projectl-fc9ed",
    storageBucket: "projectl-fc9ed.firebasestorage.app",
    messagingSenderId: "817216414809",
    appId: "1:817216414809:web:b85544266fbc93f3397d48",
    measurementId: "G-1KNF9NX3TS"
  };

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
