import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import auditService from "./auditService";

const COLLECTION_NAME = "departments";

export const departmentService = {
    getDepartments: async () => {
        try {
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error in getDepartments:", error);
            throw error;
        }
    },

    getDepartmentById: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error in getDepartmentById:", error);
            throw error;
        }
    },

    createDepartment: async (data) => {
        try {
            // Check duplicate department code
            const q = query(collection(db, COLLECTION_NAME), where("code", "==", data.code));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
                throw new Error(`Department Code "${data.code}" already exists.`);
            }

            const docData = {
                ...data,
                active: data.active ?? true,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
            
            // Audit Log
            await auditService.logActivity("CREATE", COLLECTION_NAME, docRef.id, null, docData);
            
            return { id: docRef.id, ...docData };
        } catch (error) {
            console.error("Error in createDepartment:", error);
            throw error;
        }
    },

    updateDepartment: async (id, data) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Department not found");
            }
            const oldValue = docSnap.data();

            // Check duplicate code if code changed
            if (data.code && data.code !== oldValue.code) {
                const q = query(collection(db, COLLECTION_NAME), where("code", "==", data.code));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                    throw new Error(`Department Code "${data.code}" already exists.`);
                }
            }

            const updateData = {
                ...data,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(docRef, updateData);
            
            // Audit Log
            await auditService.logActivity("UPDATE", COLLECTION_NAME, id, oldValue, { ...oldValue, ...updateData });

            return { id, ...oldValue, ...updateData };
        } catch (error) {
            console.error("Error in updateDepartment:", error);
            throw error;
        }
    },

    deleteDepartment: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Department not found");
            }
            const oldValue = docSnap.data();

            await deleteDoc(docRef);

            // Audit Log
            await auditService.logActivity("DELETE", COLLECTION_NAME, id, oldValue, null);

            return id;
        } catch (error) {
            console.error("Error in deleteDepartment:", error);
            throw error;
        }
    }
};

export default departmentService;
