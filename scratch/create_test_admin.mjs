import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBikxOMJLoF-c3zMMTwaemhze68vY3iGuU",
    authDomain: "clouderp-system.firebaseapp.com",
    projectId: "clouderp-system",
    storageBucket: "clouderp-system.firebasestorage.app",
    messagingSenderId: "469712359536",
    appId: "1:469712359536:web:94dc5dee9e92942ae564b5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {}, "test-erp");

async function createTestAdmin() {
    const email = "test-navbar@clouderp.com";
    const password = "Password123";
    
    try {
        console.log("Creating Firebase Auth test user...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        console.log("Creating Firestore employee document...");
        await setDoc(doc(db, "employees", uid), {
            employeeId: "EMP-TEST",
            firstName: "Test",
            lastName: "Admin",
            fullName: "Test Admin",
            email: email,
            role: "Admin",
            isFirstLogin: false,
            status: "Active",
            createdAt: new Date().toISOString()
        });
        
        console.log("✅ Test Admin account created successfully!");
    } catch (err) {
        console.error("❌ Failed to create test user:", err.message);
    }
}

createTestAdmin();
