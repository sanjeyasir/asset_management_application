import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase";


const COLLECTION_NAME = "designations";

export const designationService = {
    getDesignations: async () => {
        try {
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error in getDesignations:", error);
            throw error;
        }
    },

    getDesignationById: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error in getDesignationById:", error);
            throw error;
        }
    },

    createDesignation: async (data) => {
        try {
            const docData = {
                ...data,
                active: data.active ?? true,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
            

            
            return { id: docRef.id, ...docData };
        } catch (error) {
            console.error("Error in createDesignation:", error);
            throw error;
        }
    },

    updateDesignation: async (id, data) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Designation not found");
            }
            const oldValue = docSnap.data();

            const updateData = {
                ...data,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(docRef, updateData);
            


            return { id, ...oldValue, ...updateData };
        } catch (error) {
            console.error("Error in updateDesignation:", error);
            throw error;
        }
    },

    deleteDesignation: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Designation not found");
            }
            const oldValue = docSnap.data();

            await deleteDoc(docRef);



            return id;
        } catch (error) {
            console.error("Error in deleteDesignation:", error);
            throw error;
        }
    }
};

export default designationService;
