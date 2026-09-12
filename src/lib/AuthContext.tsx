import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  language: string;
  login: (email?: string, password?: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateLanguage: (lang: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(localStorage.getItem('preferred_language') || 'en');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Ensure user document exists in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous',
            photoURL: firebaseUser.photoURL || '',
            role: 'user',
            language: 'en',
            createdAt: serverTimestamp()
          });
          setLanguage('en');
        } else {
          const data = userDoc.data();
          if (data.language) {
            setLanguage(data.language);
            localStorage.setItem('preferred_language', data.language);
          }
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email?: string, password?: string) => {
    if (email && password) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await loginWithGoogle();
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(firebaseUser, { displayName });
    
    // Create user document in Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userDocRef, {
      uid: firebaseUser.uid,
      displayName: displayName,
      photoURL: '',
      role: 'user',
      language: 'en',
      createdAt: serverTimestamp()
    });
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateLanguage = async (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('preferred_language', lang);
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { language: lang }, { merge: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, language, login, register, loginWithGoogle, logout, updateLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
