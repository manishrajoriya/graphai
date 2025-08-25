// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAV4GqLgHaYjTE6Mi0huYnev8qW0ZC9xs0",
  authDomain: "raphai-2fc79.firebaseapp.com",
  projectId: "raphai-2fc79",
  storageBucket: "raphai-2fc79.firebasestorage.app",
  messagingSenderId: "57095809267",
  appId: "1:57095809267:web:6f879467204d0693aa6f86",
  measurementId: "G-HYWDFCZMGZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);