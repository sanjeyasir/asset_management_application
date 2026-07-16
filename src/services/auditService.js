import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../config/firebase";

export const auditService = {
    /**
     * Write an audit entry to the auditLogs collection.
     * @param {string} action - 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT'
     * @param {string} collectionName - Name of the collection (e.g., 'employees', 'assets')
     * @param {string} recordId - ID of the document being modified
     * @param {Object|null} oldValue - Previous state of the document (null for CREATE/LOGIN/LOGOUT)
     * @param {Object|null} newValue - New state of the document (null for DELETE/LOGIN/LOGOUT)
     */
    logActivity: async (action, collectionName = "", recordId = "", oldValue = null, newValue = null) => {
        try {
            const currentUser = auth.currentUser;
            const logEntry = {
                action,
                collection: collectionName,
                recordId,
                timestamp: new Date().toISOString(),
                operator: currentUser ? {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName || currentUser.email.split("@")[0]
                } : {
                    uid: "system",
                    email: "system@clouderp.com",
                    displayName: "System Process"
                },
                oldValue: oldValue ? JSON.stringify(oldValue) : null,
                newValue: newValue ? JSON.stringify(newValue) : null
            };

            await addDoc(collection(db, "auditLogs"), logEntry);
        } catch (error) {
            console.error("Failed to write audit log:", error);
            // Non-blocking error, we don't throw it so that main user workflows aren't interrupted
        }
    },

    getLogs: async () => {
        // Implement query fetching if needed, we'll also use this in the Reports page
    }
};

export default auditService;
