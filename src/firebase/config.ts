// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

console.log('🔥 Initializing Firebase...');

const firebaseConfig = {
  apiKey: "AIzaSyAW6QrCnC2vVw4KzPtsTc5pekOccRIj7-0",
  authDomain: "azaan-app-41cac.firebaseapp.com",
  projectId: "azaan-app-41cac",
  storageBucket: "azaan-app-41cac.appspot.com",
  messagingSenderId: "805032773041",
  appId: "1:805032773041:web:fa270641dc010613e82990",
  measurementId: "G-18EJSHEGML"
};

let app: any;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('✅ Firebase services initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

export { auth, db, storage };