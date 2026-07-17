import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db, firebaseConfig } from "../config/firebase";
import emailService from "./emailService";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const COLLECTION_NAME = "employees";

// Function to generate the next sequential Employee ID (EMP-0001)
const generateNextEmployeeId = async () => {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    let maxNumber = 0;
    snapshot.docs.forEach((d) => {
        const empId = d.data().employeeId;
        if (empId && empId.startsWith("EMP-")) {
            const num = parseInt(empId.substring(4), 10);
            if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
            }
        }
    });
    const nextNumber = maxNumber + 1;
    return `EMP-${nextNumber.toString().padStart(4, "0")}`;
};

export const employeeService = {
    getEmployees: async () => {
        try {
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error in getEmployees:", error);
            throw error;
        }
    },

    getEmployeeById: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error in getEmployeeById:", error);
            throw error;
        }
    },

    createEmployee: async (data) => {
        try {
            const emailLower = data.email.toLowerCase();
            // Check for duplicate email
            const q = query(collection(db, COLLECTION_NAME), where("email", "==", emailLower));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
                throw new Error(`Employee with email "${data.email}" already exists.`);
            }

            // Generate employeeId
            const employeeId = await generateNextEmployeeId();
            const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
            
            // Create Firebase Auth user client-side using a secondary app instance
            if (data.password) {
                const secondaryApp = initializeApp(firebaseConfig, `secondary_${Date.now()}`);
                const secondaryAuth = getAuth(secondaryApp);
                try {
                    await createUserWithEmailAndPassword(secondaryAuth, emailLower, data.password);
                    await signOut(secondaryAuth);
                } catch (authError) {
                    console.error("Firebase Auth user creation failed:", authError);
                    throw new Error(`Auth account creation failed: ${authError.message}`);
                }
            }

            // Omit password from document written to Firestore
            const { password, ...firestoreData } = data;

            const docData = {
                ...firestoreData,
                email: emailLower,
                employeeId,
                fullName,
                role: data.role || "Employee",
                isFirstLogin: data.password ? true : false,
                profilePicture: "",
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

            // Trigger Email notification
            emailService.sendEmployeeCreated(docData);

            return { id: docRef.id, ...docData };
        } catch (error) {
            console.error("Error in createEmployee:", error);
            throw error;
        }
    },

    updateEmployee: async (id, data) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Employee not found");
            }
            const oldValue = docSnap.data();

            // Check email duplication if changed
            if (data.email && data.email.toLowerCase() !== oldValue.email.toLowerCase()) {
                const emailLower = data.email.toLowerCase();
                const q = query(collection(db, COLLECTION_NAME), where("email", "==", emailLower));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                    throw new Error(`Employee with email "${data.email}" already exists.`);
                }
            }

            const fullName = `${data.firstName || oldValue.firstName} ${data.lastName || oldValue.lastName}`.trim();
            const updateData = {
                ...data,
                ...(data.email ? { email: data.email.toLowerCase() } : {}),
                fullName,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(docRef, updateData);

            const merged = { ...oldValue, ...updateData };

            return { id, ...merged };
        } catch (error) {
            console.error("Error in updateEmployee:", error);
            throw error;
        }
    },

    deleteEmployee: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Employee not found");
            }
            const oldValue = docSnap.data();

            // Check if employee has assigned assets
            const assetQ = query(collection(db, "assets"), where("assignedEmployee", "==", id));
            const assetSnap = await getDocs(assetQ);
            if (!assetSnap.empty) {
                throw new Error(`Cannot delete employee. They currently hold ${assetSnap.size} assigned asset(s). Return assets first.`);
            }

            await deleteDoc(docRef);

            return id;
        } catch (error) {
            console.error("Error in deleteEmployee:", error);
            throw error;
        }
    }
};

export default employeeService;