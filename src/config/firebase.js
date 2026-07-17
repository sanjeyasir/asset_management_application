import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

export default app;
