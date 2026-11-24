
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
const firebaseConfig = {
  apiKey: "AIzaSyBRU8weJZmKPCgdS_Yc7YLoOJW-upN7MBw",
  authDomain: "taskapp-90360.firebaseapp.com",
  projectId: "taskapp-90360",
  storageBucket: "taskapp-90360.firebasestorage.app",
  messagingSenderId: "406585286336",
  appId: "1:406585286336:web:076a12fb29e5358abad725",
  measurementId: "G-EEEXXKJEVE"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);
// Firebase Authentication
export const auth = getAuth(app);
export default app;
