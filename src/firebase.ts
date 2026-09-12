import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

<<<<<<< HEAD
import firebaseConfig from '../firebase-applet-config.json';

=======
// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
>>>>>>> c02fa0eef4d94adb5d0596a17983d68d6e59cb5c
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
