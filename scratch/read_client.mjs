import { initializeApp } from "firebase/app";
import { initializeFirestore, getDocs, collection, addDoc, doc, getDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBikxOMJLoF-c3zMMTwaemhze68vY3iGuU",
    authDomain: "clouderp-system.firebaseapp.com",
    projectId: "clouderp-system",
    storageBucket: "clouderp-system.firebasestorage.app",
    messagingSenderId: "469712359536",
    appId: "1:469712359536:web:94dc5dee9e92942ae564b5"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, "test-erp");

async function testPermissions() {
    console.log("=== Testing Firestore Permissions ===");
    
    // 1. Test Employees Read
    try {
        const snap = await getDocs(collection(db, "employees"));
        console.log("✅ Employees Read: Success. Found", snap.size, "documents");
    } catch (err) {
        console.error("❌ Employees Read: Failed.", err.message);
    }
    
    // 2. Test Sessions Write & Read
    let testSessionId = null;
    try {
        const testSession = {
            uid: "test-uid",
            email: "test@clouderp.com",
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            isActive: true
        };
        const ref = await addDoc(collection(db, "sessions"), testSession);
        testSessionId = ref.id;
        console.log("✅ Sessions Write: Success. Doc ID:", testSessionId);
    } catch (err) {
        console.error("❌ Sessions Write: Failed.", err.message);
    }
    
    if (testSessionId) {
        try {
            const snap = await getDoc(doc(db, "sessions", testSessionId));
            if (snap.exists()) {
                console.log("✅ Sessions Read: Success. Doc data:", snap.data());
            } else {
                console.warn("⚠️ Sessions Read: Document not found");
            }
            
            // Clean up
            await deleteDoc(doc(db, "sessions", testSessionId));
            console.log("✅ Sessions Delete: Success");
        } catch (err) {
            console.error("❌ Sessions Read/Delete: Failed.", err.message);
        }
    }
}

testPermissions();
