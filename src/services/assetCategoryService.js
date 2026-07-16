import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import auditService from "./auditService";

const COLLECTION_NAME = "assetCategories";

export const assetCategoryService = {
    getCategories: async () => {
        try {
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error in getCategories:", error);
            throw error;
        }
    },

    getCategoryById: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error in getCategoryById:", error);
            throw error;
        }
    },

    createCategory: async (data) => {
        try {
            const docData = {
                ...data,
                parentCategory: data.parentCategory || "", // Holds ID of parent category
                active: data.active ?? true,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
            
            // Audit Log
            await auditService.logActivity("CREATE", COLLECTION_NAME, docRef.id, null, docData);
            
            return { id: docRef.id, ...docData };
        } catch (error) {
            console.error("Error in createCategory:", error);
            throw error;
        }
    },

    updateCategory: async (id, data) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Category not found");
            }
            const oldValue = docSnap.data();

            // Self-parent check to avoid circular hierarchy references
            if (data.parentCategory && data.parentCategory === id) {
                throw new Error("A category cannot be its own parent.");
            }

            const updateData = {
                ...data,
                parentCategory: data.parentCategory || "",
                updatedAt: new Date().toISOString()
            };

            await updateDoc(docRef, updateData);
            
            // Audit Log
            await auditService.logActivity("UPDATE", COLLECTION_NAME, id, oldValue, { ...oldValue, ...updateData });

            return { id, ...oldValue, ...updateData };
        } catch (error) {
            console.error("Error in updateCategory:", error);
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Category not found");
            }
            const oldValue = docSnap.data();

            // Check if there are child categories referencing this category
            const categories = await assetCategoryService.getCategories();
            const childCategories = categories.filter(c => c.parentCategory === id);
            if (childCategories.length > 0) {
                throw new Error("Cannot delete category. It is a parent to other subcategories.");
            }

            await deleteDoc(docRef);

            // Audit Log
            await auditService.logActivity("DELETE", COLLECTION_NAME, id, oldValue, null);

            return id;
        } catch (error) {
            console.error("Error in deleteCategory:", error);
            throw error;
        }
    }
};

export default assetCategoryService;
