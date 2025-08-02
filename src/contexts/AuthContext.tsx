import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  setDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<any>;
  register: (fullName: string, email: string, password: string, confirmPassword: string, phoneNumber: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    setCurrentUser({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      phoneNumber: user.phoneNumber || ''
    });
    return userCredential;
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
    phoneNumber: string
  ) => {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Add user document to Firestore
    await setDoc(doc(db, 'User', user.uid), {
      analysis: 0,
      betatesting: false,
      check1: false,
      check2: false,
      check3: false,
      check4: false,
      check5: false,
      check6: false,
      check7: false,
      check8: false,
      check9: false,
      check10: false,
      check11: false,
      check12: false,
      check13: false,
      check14: false,
      confirm_password: confirmPassword,
      created_time: serverTimestamp(),
      display_name: fullName,
      email: email,
      is_admin: false,
      is_verified: false,
      lockuntill: serverTimestamp(),
      password: password,
      phone_number: phoneNumber,
      phrase1: true,
      phrase2: false,
      phrase3: false,
      phrase4: false,
      phrase5: false,
      phrase6: false,
      phrase7: false,
      phrase8: false,
      phrase9: false,
      phrase10: false,
      phrase11: false,
      phrase12: false,
      phrase13: false,
      phrase14: false,
      score: 0,
      subscription_date: null,
      uid: user.uid
    });
    setCurrentUser({
      uid: user.uid,
      email: user.email || '',
      displayName: fullName,
      phoneNumber: phoneNumber
    });
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          phoneNumber: user.phoneNumber || ''
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};