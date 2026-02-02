// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth,GoogleAuthProvider} from "firebase/auth"
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";



const firebaseConfig = {
  apiKey: "AIzaSyBiaSkfuvaAUf_SpGl7AEf0TZCEuVNT41I",
  authDomain: "chatapp-d6402.firebaseapp.com",
  projectId: "chatapp-d6402",
  storageBucket: "chatapp-d6402.firebasestorage.app",
  messagingSenderId: "1010429604082",
  appId: "1:1010429604082:web:f904ec6a23d66ee692606b",
  measurementId: "G-9V419GR7V8"
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
