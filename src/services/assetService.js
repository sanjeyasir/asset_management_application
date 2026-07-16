import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import emailService from "./emailService";

const COLLECTION_NAME = "assets";

const generateNextAssetNumber = async () => {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    let maxNumber = 0;
    snapshot.docs.forEach((d) => {
        const assetNum = d.data().assetNumber;
        if (assetNum && assetNum.startsWith("AST-")) {
            const num = parseInt(assetNum.substring(4), 10);
            if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
            }
        }
    });
    const nextNumber = maxNumber + 1;
    return `AST-${nextNumber.toString().padStart(4, "0")}`;
};

export const assetService = {
    getAssets: async () => {
        try {
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error in getAssets:", error);
            throw error;
        }
    },

    getAssetById: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error in getAssetById:", error);
            throw error;
        }
    },

    createAsset: async (data) => {
        try {
            const assetNumber = await generateNextAssetNumber();
            
            // Barcode & QR Code values compile to the unique Asset Number
            const docData = {
                ...data,
                assetNumber,
                barcode: assetNumber,
                qrCode: assetNumber,
                createdAt: new Date().toISOString(),
                assignedEmployee: data.assignedEmployee || ""
            };

            // Enforce status constraints based on assignment
            if (docData.assignedEmployee) {
                docData.status = "Assigned";
            } else if (docData.status === "Assigned") {
                docData.status = "Available"; // Fallback if no employee given
            }

            const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
            const savedAsset = { id: docRef.id, ...docData };



            // If assigned, trigger email
            if (docData.assignedEmployee) {
                try {
                    const empSnap = await getDoc(doc(db, "employees", docData.assignedEmployee));
                    if (empSnap.exists()) {
                        await emailService.sendAssetAssigned(savedAsset, empSnap.data());
                    }
                } catch (emailErr) {
                    console.error("Failed to trigger assignment email:", emailErr);
                }
            }

            return savedAsset;
        } catch (error) {
            console.error("Error in createAsset:", error);
            throw error;
        }
    },

    updateAsset: async (id, data) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Asset not found");
            }
            const oldValue = docSnap.data();

            const updateData = {
                ...data,
                updatedAt: new Date().toISOString()
            };

            // Manage email triggers based on assignment change
            const oldEmployeeId = oldValue.assignedEmployee || "";
            const newEmployeeId = updateData.assignedEmployee || "";
            const oldStatus = oldValue.status;
            const newStatus = updateData.status || oldStatus;

            // Adjust status automatically if assigned employee field changed
            if (newEmployeeId && newEmployeeId !== oldEmployeeId) {
                updateData.status = "Assigned";
            } else if (!newEmployeeId && oldEmployeeId && newStatus === "Assigned") {
                updateData.status = "Available"; // Revert status if unassigned
            }

            await updateDoc(docRef, updateData);
            const mergedAsset = { ...oldValue, ...updateData };



            // Handle Emails Triggering
            // 1. Assignment Email
            if (newEmployeeId && newEmployeeId !== oldEmployeeId) {
                try {
                    const empSnap = await getDoc(doc(db, "employees", newEmployeeId));
                    if (empSnap.exists()) {
                        await emailService.sendAssetAssigned(mergedAsset, empSnap.data());
                    }
                } catch (err) {
                    console.error("Email send failed for new assignment:", err);
                }
            }

            // 2. Return/Unassignment Email
            if (oldEmployeeId && oldEmployeeId !== newEmployeeId) {
                try {
                    const empSnap = await getDoc(doc(db, "employees", oldEmployeeId));
                    if (empSnap.exists()) {
                        await emailService.sendAssetReturned(mergedAsset, empSnap.data());
                    }
                } catch (err) {
                    console.error("Email send failed for returned asset:", err);
                }
            }

            return { id, ...mergedAsset };
        } catch (error) {
            console.error("Error in updateAsset:", error);
            throw error;
        }
    },

    deleteAsset: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Asset not found");
            }
            const oldValue = docSnap.data();

            if (oldValue.status === "Assigned" || oldValue.assignedEmployee) {
                throw new Error("Cannot delete asset. It is currently assigned to an employee. Unassign it first.");
            }

            await deleteDoc(docRef);



            return id;
        } catch (error) {
            console.error("Error in deleteAsset:", error);
            throw error;
        }
    }
};

export default assetService;
