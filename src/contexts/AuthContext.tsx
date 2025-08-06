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
  console.log('🔐 AuthProvider rendering...');
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 Auth state changed:', user ? `User ${user.email} logged in` : 'No user');
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔐 Attempting login for:', email);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful for:', email);
      return result;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const register = async (fullName: string, email: string, password: string, confirmPassword: string, phoneNumber: string) => {
    console.log('🔐 Attempting registration for:', email);
    
    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match');
      throw new Error('Passwords do not match');
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Registration successful for:', email);
      
      // Save additional user data to Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        fullName,
        email,
        phoneNumber,
        createdAt: serverTimestamp(),
      });
      console.log('✅ User data saved to Firestore');
      
      return result;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('🔐 Attempting logout...');
    try {
      await signOut(auth);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
  };

  console.log('🔐 AuthProvider value created:', { currentUser: currentUser?.email, loading });

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};