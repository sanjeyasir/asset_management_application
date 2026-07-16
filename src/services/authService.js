import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import auditService from "./auditService";

export const authService = {
    login: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Log Login event
            await auditService.logActivity("LOGIN", "users", user.uid);
            
            return user;
        } catch (error) {
            console.error("Login service error:", error);
            throw error; // Let centralized error handler/components catch and display formatted messages
        }
    },

    logout: async () => {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                // Log Logout event
                await auditService.logActivity("LOGOUT", "users", currentUser.uid);
            }
            await signOut(auth);
        } catch (error) {
            console.error("Logout service error:", error);
            throw error;
        }
    },

    sendPasswordReset: async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            await auditService.logActivity("PASSWORD_RESET_REQUEST", "users", "", null, { email });
        } catch (error) {
            console.error("Password reset link error:", error);
            throw error;
        }
    },

    getUserProfile: async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error("Fetch user profile error:", error);
            throw error;
        }
    },

    updateUserProfile: async (uid, data) => {
        try {
            const userRef = doc(db, "users", uid);
            const oldDoc = await getDoc(userRef);
            const oldData = oldDoc.exists() ? oldDoc.data() : null;

            // Merge update
            await setDoc(userRef, { ...oldData, ...data, updatedAt: new Date().toISOString() }, { merge: true });

            // If displayName or photoURL is changing, update auth profile too
            const currentUser = auth.currentUser;
            if (currentUser) {
                const profileUpdates = {};
                if (data.displayName) profileUpdates.displayName = data.displayName;
                if (data.photoURL) profileUpdates.photoURL = data.photoURL;
                if (Object.keys(profileUpdates).length > 0) {
                    await updateProfile(currentUser, profileUpdates);
                }
            }

            await auditService.logActivity("UPDATE", "users", uid, oldData, data);
        } catch (error) {
            console.error("Update profile error:", error);
            throw error;
        }
    }
};

export default authService;
