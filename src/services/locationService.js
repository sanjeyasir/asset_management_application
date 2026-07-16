import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import auditService from "./auditService";

const COLLECTION_NAME = "locations";

export const locationService = {
    getLocations: async () => {
        try {
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error in getLocations:", error);
            throw error;
        }
    },

    getLocationById: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error in getLocationById:", error);
            throw error;
        }
    },

    createLocation: async (data) => {
        try {
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
            console.error("Error in createLocation:", error);
            throw error;
        }
    },

    updateLocation: async (id, data) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Location not found");
            }
            const oldValue = docSnap.data();

            const updateData = {
                ...data,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(docRef, updateData);
            
            // Audit Log
            await auditService.logActivity("UPDATE", COLLECTION_NAME, id, oldValue, { ...oldValue, ...updateData });

            return { id, ...oldValue, ...updateData };
        } catch (error) {
            console.error("Error in updateLocation:", error);
            throw error;
        }
    },

    deleteLocation: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Location not found");
            }
            const oldValue = docSnap.data();

            await deleteDoc(docRef);

            // Audit Log
            await auditService.logActivity("DELETE", COLLECTION_NAME, id, oldValue, null);

            return id;
        } catch (error) {
            console.error("Error in deleteLocation:", error);
            throw error;
        }
    }
};

export default locationService;
