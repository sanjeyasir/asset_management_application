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

const sanitizeData = (data) => {
    if (!data || typeof data !== "object") return {};
    const clean = {};
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            clean[key] = value;
        }
    }
    return clean;
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

    createAsset: async (data, performedBy = "Administrator") => {
        try {
            const assetNumber = data.assetNumber || await generateNextAssetNumber();
            
            // Determine assignment status
            const hasEmployee = Boolean(data.assignedEmployee || data.assignedEmployeeName);
            let status = data.status || (hasEmployee ? "Assigned" : "Available");

            const now = new Date().toISOString();
            const logs = Array.isArray(data.logs) ? [...data.logs] : [];

            // Initial creation log
            logs.unshift({
                id: `log-${Date.now()}-create`,
                type: "CREATED",
                title: "Asset Registered",
                description: `Asset registered in system with status: ${status}.${data.serialNumber ? ` Serial No: ${data.serialNumber}.` : ""}`,
                performedBy: performedBy || "Administrator",
                timestamp: now
            });

            if (hasEmployee) {
                const empName = data.assignedEmployeeName || "Employee";
                const comp = data.companyName ? ` (${data.companyName})` : "";
                logs.unshift({
                    id: `log-${Date.now()}-assign`,
                    type: "ASSIGNED",
                    title: `Assigned to ${empName}`,
                    description: `Assigned to ${empName}${comp} at site ${data.location || "General"}.`,
                    performedBy: performedBy || "Administrator",
                    timestamp: now
                });
            }

            const docData = sanitizeData({
                ...data,
                assetNumber,
                barcode: assetNumber,
                qrCode: assetNumber,
                status,
                companyName: data.companyName || "",
                assignedEmployee: data.assignedEmployee || "",
                assignedEmployeeName: data.assignedEmployeeName || "",
                assignedEmployeeEmail: data.assignedEmployeeEmail || "",
                serialNumber: data.serialNumber || "",
                logs,
                createdAt: now
            });

            const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
            const savedAsset = { id: docRef.id, ...docData };

            // If assigned to a known employee ID, attempt email notification
            if (docData.assignedEmployee) {
                try {
                    const empSnap = await getDoc(doc(db, "employees", docData.assignedEmployee));
                    if (empSnap.exists()) {
                        const empData = empSnap.data();
                        await emailService.sendAssetAssigned(savedAsset, empData);
                    }
                } catch (emailErr) {
                    console.error("Failed to trigger assignment email:", emailErr);
                }
            }

            // Send registration email
            try {
                await emailService.sendAssetCreatedNotification(savedAsset, null, "sanjeyasir@gmail.com");
            } catch (emailErr) {
                console.error("Failed to trigger asset creation notification:", emailErr);
            }

            return savedAsset;
        } catch (error) {
            console.error("Error in createAsset:", error);
            throw error;
        }
    },

    updateAsset: async (id, data, performedBy = "Administrator") => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Asset not found");
            }
            const oldValue = docSnap.data();
            const now = new Date().toISOString();

            const oldEmployeeId = oldValue.assignedEmployee || "";
            const newEmployeeId = data.assignedEmployee !== undefined ? data.assignedEmployee : oldEmployeeId;
            const oldEmployeeName = oldValue.assignedEmployeeName || "";
            const newEmployeeName = data.assignedEmployeeName !== undefined ? data.assignedEmployeeName : oldEmployeeName;
            const oldStatus = oldValue.status || "Available";
            const newStatus = data.status !== undefined ? data.status : oldStatus;

            let adjustedStatus = newStatus;
            // Adjust status automatically if assigned employee field changed
            if (newEmployeeId && newEmployeeId !== oldEmployeeId) {
                adjustedStatus = "Assigned";
            } else if (!newEmployeeId && !newEmployeeName && (oldEmployeeId || oldEmployeeName) && adjustedStatus === "Assigned") {
                adjustedStatus = "Available"; // Revert status if unassigned
            }

            // Generate audit logs for differences
            const existingLogs = Array.isArray(oldValue.logs) ? [...oldValue.logs] : [];
            const newLogs = [];

            // 1. Check Assignment Change
            const assignmentChanged = (newEmployeeId !== oldEmployeeId) || (newEmployeeName && newEmployeeName !== oldEmployeeName);
            if (assignmentChanged) {
                if (newEmployeeName || newEmployeeId) {
                    newLogs.push({
                        id: `log-${Date.now()}-assign`,
                        type: "ASSIGNED",
                        title: `Assigned to ${newEmployeeName || "Employee"}`,
                        description: `Custodian changed from "${oldEmployeeName || "Unassigned"}" to "${newEmployeeName || "Employee"}" (${data.companyName || oldValue.companyName || "Company"}).`,
                        performedBy: performedBy || "Administrator",
                        timestamp: now
                    });
                } else if (oldEmployeeName || oldEmployeeId) {
                    newLogs.push({
                        id: `log-${Date.now()}-unassign`,
                        type: "UNASSIGNED",
                        title: `Unassigned / Returned to Inventory`,
                        description: `Asset returned from ${oldEmployeeName || "previous employee"}. Status set to ${adjustedStatus}.`,
                        performedBy: performedBy || "Administrator",
                        timestamp: now
                    });
                }
            }

            // 2. Check Status Change
            if (adjustedStatus !== oldStatus) {
                newLogs.push({
                    id: `log-${Date.now()}-status`,
                    type: "STATUS_CHANGE",
                    title: `Status Changed to ${adjustedStatus}`,
                    description: `Lifecycle state updated from "${oldStatus}" to "${adjustedStatus}".`,
                    performedBy: performedBy || "Administrator",
                    timestamp: now
                });
            }

            // 3. Check General update if no assignment or status log added
            if (newLogs.length === 0 && !data.logs) {
                newLogs.push({
                    id: `log-${Date.now()}-update`,
                    type: "UPDATED",
                    title: "Asset Specifications Updated",
                    description: "Asset profile and hardware details updated.",
                    performedBy: performedBy || "Administrator",
                    timestamp: now
                });
            }

            // Combine new logs at the beginning
            const combinedLogs = data.logs ? data.logs : [...newLogs, ...existingLogs];

            const updateData = sanitizeData({
                ...data,
                status: adjustedStatus,
                logs: combinedLogs,
                updatedAt: now
            });

            await updateDoc(docRef, updateData);
            const mergedAsset = { ...oldValue, ...updateData };

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

    addAssetLog: async (id, logEntry, performedBy = "Administrator") => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error("Asset not found");
            }
            const current = docSnap.data();
            const existingLogs = Array.isArray(current.logs) ? current.logs : [];
            const newLog = {
                id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: logEntry.type || "NOTE",
                title: logEntry.title || "Maintenance Record",
                description: logEntry.description || "",
                performedBy: performedBy || "Administrator",
                timestamp: new Date().toISOString()
            };

            const updatedLogs = [newLog, ...existingLogs];
            await updateDoc(docRef, {
                logs: updatedLogs,
                updatedAt: new Date().toISOString()
            });

            return { id, ...current, logs: updatedLogs };
        } catch (error) {
            console.error("Error in addAssetLog:", error);
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

            if (oldValue.status === "Assigned" && oldValue.assignedEmployee) {
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
