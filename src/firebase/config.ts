// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAW6QrCnC2vVw4KzPtsTc5pekOccRIj7-0",
  authDomain: "azaan-app-41cac.firebaseapp.com",
  projectId: "azaan-app-41cac",
  storageBucket: "azaan-app-41cac.appspot.com",
  messagingSenderId: "805032773041",
  appId: "1:805032773041:web:fa270641dc010613e82990",
  measurementId: "G-18EJSHEGML"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);