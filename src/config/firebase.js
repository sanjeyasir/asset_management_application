import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

export const firebaseConfig = {
    apiKey: "AIzaSyBikxOMJLoF-c3zMMTwaemhze68vY3iGuU",
    authDomain: "clouderp-system.firebaseapp.com",
    projectId: "clouderp-system",
    storageBucket: "clouderp-system.firebasestorage.app",
    messagingSenderId: "469712359536",
    appId: "1:469712359536:web:94dc5dee9e92942ae564b5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use the existing 'test-erp' database ID specified in original configuration
export const db = initializeFirestore(app, {}, "test-erp");

export const storage = getStorage(app);

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') || 
  window.location.hostname.startsWith('10.') || 
  window.location.hostname.endsWith('.local')
);

if (isLocalhost) {
  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  console.log(`Connecting to local Firebase Emulators at ${host}...`);
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
}

export default app;
