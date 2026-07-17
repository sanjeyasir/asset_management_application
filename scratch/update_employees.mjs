import { initializeApp } from "firebase/app";
import { initializeFirestore, getDocs, collection, doc, updateDoc } from "firebase/firestore";

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

async function updateExistingEmployees() {
    console.log("=== Updating Existing Employees ===");
    try {
        const snap = await getDocs(collection(db, "employees"));
        for (const employeeDoc of snap.docs) {
            const data = employeeDoc.data();
            const emailLower = data.email.toLowerCase();
            const updatePayload = {
                email: emailLower,
                role: "Admin", // Give Admin role so they aren't blocked on login
                isFirstLogin: false // Mark as false since they already exist
            };
            
            await updateDoc(doc(db, "employees", employeeDoc.id), updatePayload);
            console.log(`✅ Updated ${data.fullName}: Email set to '${emailLower}', Role set to 'Admin', isFirstLogin set to 'false'`);
        }
        console.log("=== Update Completed Successfully ===");
    } catch (err) {
        console.error("❌ Failed to update employees:", err.message);
    }
}

updateExistingEmployees();
